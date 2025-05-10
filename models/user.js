import pool from "../db/connect.js";
import bcrypt from "bcrypt";
import {
    calculateExpiryDate,
    generateAccessToken,
    generateRefreshToken,
} from "../utils/jwt.js";
import * as refreshTokenDB from "./refreshToken.js";
import * as usersRolesDB from "../models/usersRoles.js";

export async function getUserByUsername({ username }) {
    try {
        const userResults = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );
        return userResults.rows[0] || null;
    } catch (error) {
        console.log(`Error in registerUser(): ${error.message}`);
        throw error;
    }
}

// Register new user
export async function registerUser({ username, password }) {
    try {
        const userResults = await getUserByUsername({ username: username });

        if (userResults) {
            return { error: "Username already taken" };
        }

        // Hash password 10 times (salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);

        // Don't return the password hash
        const registerResults = await pool.query(
            `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id, username`,
            [username, passwordHash]
        );

        const user = registerResults.rows[0];

        const userRolesResults = await usersRolesDB.insertUserIntoUserRole({user_id: user.user_id});

        return registerResults.rows;
    } catch (error) {
        console.log(`Error in registerUser(): ${error.message}`);
        throw error;
    }
}

// Log user in - grant access token
export async function loginUser({ username, password }) {
    try {
        const userResults = await pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );

        if (userResults.rows.length === 0) {
            return { error: "Username not found" };
        }

        const user = userResults.rows[0];

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { error: "Invalid password" };
        }

        const user_data = {
            user_id: user.user_id,
            username: user.username,
        };

        // Generate both access and refresh token
        const accessToken = generateAccessToken(user_data);
        const refreshToken = generateRefreshToken(user_data);

        const refreshExpiryDate = calculateExpiryDate(
            process.env.JWT_REFRESH_EXPIRY
        );

        await refreshTokenDB.saveRefreshToken(
            user.user_id,
            refreshToken,
            refreshExpiryDate
        );

        return {
            user_data,
            accessToken,
            refreshToken,
        };
    } catch (error) {
        console.log(`Error in loginUser(): ${error.message}`);
        throw error;
    }
}

export async function getUserById({ user_id }) {
    try {
        const userResults = await pool.query(
            `SELECT * FROM users WHERE user_id = $1`,
            [user_id]
        );
        return userResults.rows[0] || null;
    } catch (error) {
        console.log(`Error in getUserById(): ${error.message}`);
        throw error;
    }
}
