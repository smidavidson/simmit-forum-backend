// Load environment variables
import "@dotenvx/dotenvx/config";

import { fileURLToPath } from "url";
import { dirname, sep } from "path";
import express from "express";
import rateLimit from "express-rate-limit";
import { initDatabase } from "./db/init.js";
import { studentsRoutes } from "./routes/studentsRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

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

const redisClient = createClient({
    url: process.env.REDIS_URL,
});
redisClient.on("error", (err) => {
    console.log(`Redis Client Error`);
});
redisClient.on("connect", () => {
    console.log(`Connected to Redis`);
});

app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            // secure: process.env.NODE_ENV === "production",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

app.use(express.urlencoded({ extended: true }));
app.use(limiter);

async function startServer() {
    try {
        await redisClient.connect();
        await initDatabase();
        console.log(`Database initialized`);
    } catch (error) {
        process.exit(1);
    }
}

startServer();

// Add session debugging middleware
app.use((req, res, next) => {
    console.log("Session middleware:", {
        sessionID: req.sessionID,
        hasSession: !!req.session,
        hasUser: req.session?.user ? true : false,
    });
    next();
});

app.use("/students", studentsRoutes);
app.use("/auth", authRoutes);

app.listen(config.port, () => {
    console.log(`Server is on at port ${config.port}`);
});
