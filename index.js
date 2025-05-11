// Load environment variables
import "@dotenvx/dotenvx/config";

import { fileURLToPath } from "url";
import { dirname, sep } from "path";
import express from "express";
import rateLimit from "express-rate-limit";
import { initDatabase } from "./db/init.js";
import { studentsRoutes } from "./routes/studentsRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import session from 'express-session';

const __dirname = dirname(fileURLToPath(import.meta.url)) + sep;
const config = {
    port: process.env.PORT,
    dir: {
        root: __dirname,
    },
};

const app = express();

const limiter = rateLimit({
    legacyHeaders: false,
    standardHeaders: true,
    windowMs: 0.25 * 1000,
    max: 1,
    message: { error: "Too many requests sent, please try again later" },
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}))

app.use(express.urlencoded({ extended: true }));
app.use(limiter);

async function startServer() {
    try {
        await initDatabase();
        console.log(`Database initialized`);
    } catch (error) {
        process.exit(1);
    }
}

startServer();

app.use("/students", studentsRoutes);
app.use("/auth", authRoutes);

app.listen(config.port, () => {
    console.log(`Server is on at port ${config.port}`);
});
