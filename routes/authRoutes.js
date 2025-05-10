// Handles /auth routing
import { Router } from "express";
import * as userDB from "../models/user.js";
import * as usersRolesDB from "../models/usersRoles.js";
import * as refreshTokenDB from "../models/refreshToken.js";
import {
    calculateExpiryDate,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { getUserRoleByUserId } from "../models/usersRoles.js";
export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Username and password required" });
        }
        const results = await userDB.registerUser({
            username: username,
            password: password,
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to register new user" });
    }
});

authRoutes.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Username and password required" });
        }
        const results = await userDB.loginUser({
            username: username,
            password: password,
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to login" });
    }
});

authRoutes.get("/my_role", authenticateToken, async (req, res) => {
    try {
        const userRole = await getUserRoleByUserId({
            user_id: req.user.user_id,
        });

        res.json(userRole);
    } catch (error) {
        res.status(500).json({ error: "Failed to login" });
    }
});

authRoutes.post("/renew_access_token", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token required" });
        }

        let decodedRefreshToken;
        try {
            decodedRefreshToken = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(403).json({ error: "Refresh token invalid" });
        }

        const refreshTokenRecord = refreshTokenDB.getRefreshToken(refreshToken);
        if (!refreshTokenRecord) {
            return res
                .status(403)
                .json({ error: "Refresh token invalid or revoked" });
        }

        const user = await userDB.getUserById({
            user_id: decodedRefreshToken.user_id,
        });
        const accessToken = generateAccessToken(user);

        res.json({ accessToken });
    } catch (error) {
        console.log(`Error in path /refresh_access_token: ${error.message}`);
        res.status(500).json({ error: "Access token renewal failed" });
    }
});

authRoutes.post("/renew_refresh_token", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token required" });
        }

        let decodedRefreshToken;
        try {
            decodedRefreshToken = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(403).json({ error: "Refresh token invalid" });
        }

        const refreshTokenRecord = refreshTokenDB.getRefreshToken(refreshToken);
        if (!refreshTokenRecord) {
            return res
                .status(403)
                .json({ error: "Refresh token invalid or revoked" });
        }

        const user = await userDB.getUserById({
            user_id: decodedRefreshToken.user_id,
        });
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        const refreshExpiryDate = calculateExpiryDate(
            process.env.JWT_REFRESH_EXPIRY
        );

        const refreshTokenResults = await refreshTokenDB.updateRefreshToken(
            refreshToken,
            newRefreshToken,
            refreshExpiryDate
        );
        if (!refreshTokenResults) {
            return res.status(403).json({ error: "Failed to renew token" });
        }

        // Return new tokens
        res.json({
            user: {
                user_id: user.user_id,
                username: user.username,
            },
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.log(`Error in path /refresh_access_token: ${error.message}`);
        res.status(500).json({ error: "Refresh token renewal failed" });
    }
});
