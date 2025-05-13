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
import cors from "cors";

const __dirname = dirname(fileURLToPath(import.meta.url)) + sep;
const config = {
    port: process.env.PORT,
    dir: {
        root: __dirname,
    },
};

const app = express();

console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);

const corsConfig = {
    origin: [process.env.CORS_ORIGIN],
    // Allow for authorization HTTP headers and cookies to be sent
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}
app.use(cors(corsConfig));


const redisClient = createClient({
    url: process.env.REDIS_URL,
});
redisClient.on("error", (err) => {
    console.log(`Redis Client Error`);
});
redisClient.on("connect", () => {
    console.log(`Connected to Redis`);
});

const redisStore = new RedisStore({ client: redisClient });
redisStore.on('connect', () => {
    console.log('RedisStore connected');
});
redisStore.on('disconnect', () => {
    console.log('RedisStore disconnected');
});
redisStore.on('error', (err) => {
    console.log('RedisStore error:', err);
});

// Debug environment variables immediately after loading
console.log("Initial environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    NODE_ENV_type: typeof process.env.NODE_ENV,
    NODE_ENV_length: process.env.NODE_ENV?.length,
    comparison: process.env.NODE_ENV === "production",
});

app.use(
    session({
        store: redisStore,
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            // secure: true,
            // Cookies are sent for all request (including cross-site requests)
            // subdomains count as cross-site requests
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

const limiter = rateLimit({
    legacyHeaders: false,
    standardHeaders: true,
    windowMs: 0.01 * 1000,
    max: 1,
    message: { error: "Too many requests sent, please try again later" },
});

app.use(limiter);

app.use(express.urlencoded({ extended: true }));

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
