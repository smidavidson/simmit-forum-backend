// Handles /auth routing
import { Router } from "express";
import { userStore } from "../stores/userStore.js";
import { isAuthenticated } from "../middleware/auth.js";
export const authRoutes = Router();

authRoutes.get("/me", isAuthenticated, async (req, res) => {
    try {
        const response = req.session.user;
        return res.status(200).json({message: "true", data: response});
    } catch (error) {
        console.log(`/me authentication error: ${error.message}`);
        res.status(500).json({ message: "Error checking user authentication" });
    }
})

authRoutes.post("/register", async (req, res) => {
    console.log('/auth/register request');
    try {
        const { username, password, email } = req.body;
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password required" });
        }

        // Insert new user into user table
        const userResults = await userStore.insertUser({ username, password, email });
        res.status(201).json({
            user: userResults.user,
        });
    } catch (error) {
        console.log(`Registration error: ${error.message}`);
        res.status(500).json({ message: "Error during registration" });
    }
});

authRoutes.post("/login", async (req, res) => {
        console.log('/auth/login request');
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

        console.log('Login attempt:', {
            userFound: !!userResults.user,
            userData: userResults.user,
            sessionID: req.sessionID,
            sessionBefore: !!req.session,
            sessionUserBefore: !!req.session?.user
        });

        // Attach user object to session
        req.session.user = userResults.user;
        console.log('Session after setting user:', {
            sessionID: req.sessionID,
            sessionAfter: !!req.session,
            sessionUserAfter: !!req.session?.user,
            userData: req.session?.user
        });
        
        res.json({ user: userResults.user });
    } catch (error) {
        console.log(`Login error: ${error.message}`);
        res.status(500).json({ message: "Error during login" });
    }
});

authRoutes.get("/logout", (req, res) => {
    console.log('/auth/logout request');
    // Destroy the current existing session from the session store
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
    });
});

authRoutes.get("/profile", (req, res) => {
    console.log('/auth/profile request:', {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionData: req.session,
        hasUser: !!req.session?.user,
        userData: req.session?.user
    });
    console.log("");

    // If no user in session object, then not authenticated
    if (!req.session.user) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    // Otherwise just return the user object from the session
    res.json({ user: req.session.user });
});
