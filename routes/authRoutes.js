// Handles /auth routing
import { Router } from "express";
import { userStore } from "../stores/userStore.js";
export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password required" });
        }

        // Insert new user into user table
        const userResults = await userStore.insertUser({ username, password });
        res.status(201).json({
            user: userResults.user,
        });
    } catch (error) {
        console.log(`Registration error: ${error.message}`);
        res.status(500).json({ message: "Error during registration" });
    }
});

authRoutes.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ mesage: "Username and password required" });
        }

        // Verify username and password match and retrieve user info
        const userResults = await userStore.verifyUser({ username, password });
        if (!userResults.success) {
            return res.status(401).json({ error: userResults.error });
        }

        // Attach user object to session
        req.session.user = userResults.user;
        res.json({ user: userResults.user });
    } catch (error) {
        console.log(`Login error: ${error.message}`);
        res.status(500).json({ message: "Error during login" });
    }
});

authRoutes.get("/logout", (req, res) => {
    // Destroy the current existing session from the session store
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
    });
});

authRoutes.get("/profile", (req, res) => {
    // If no user in session object, then not authenticated
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    // Otherwise just return the user object from the session
    res.json({ user: req.session.user });
});

// Debug route to inspect session data
authRoutes.get("/debug-session", (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        cookie: req.session.cookie,
    });
});
