// Load environment variables
import "@dotenvx/dotenvx/config";

import { fileURLToPath } from "url";
import { dirname, sep } from "path";
import express from "express";
import rateLimit from "express-rate-limit";
import { initDatabase } from "./db/init.js";
import { studentsRoutes } from "./routes/studentsRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { s3Routes } from "./routes/s3Routes.js";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import cors from "cors";
import { isAuthenticated } from "./middleware/auth.js";
import { postsRoutes } from "./routes/postsRoutes.js";
import { commentsRoutes } from "./routes/commentsRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url)) + sep;
const config = {
    port: process.env.PORT,
    dir: {
        root: __dirname,
    },
};

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

console.log(`CORS_REQUEST_ORIGIN: ${process.env.CORS_REQUEST_ORIGIN}`);

const corsConfig = {
    origin: [process.env.CORS_REQUEST_ORIGIN],
    // Allow for authorization HTTP headers and cookies to be sent
    credentials: true,
};
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

// Debug environment variables immediately after loading
console.log("Initial node environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    is_in_production_mode: process.env.NODE_ENV === "production",
});

app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.REDIS_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            sameSite: "lax",
            // secure: process.env.NODE_ENV === "production",
            // sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

// Limit requests
const limiter = rateLimit({
    legacyHeaders: false,
    standardHeaders: true,
    windowMs: 0.01 * 1000,
    max: 1,
    message: { error: "Too many requests sent, please try again later" },
});
// app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
    try {
        await redisClient.connect();
        await initDatabase();
        console.log(`Server initialized`);
    } catch (error) {
        process.exit(1);
    }
}

startServer();

// Add session debugging middleware
app.use((req, res, next) => {
    console.log(
        `\n\n!! Request to localhost:${process.env.PORT}${req.url} Received !!`
    );
    // console.log("Session middleware:", {
    //     sessionID: req.sessionID,
    //     hasSession: !!req.session,
    //     hasUser: req.session?.user ? true : false,
    // });
    next();
});

app.use("/students", studentsRoutes);
app.use("/auth", authRoutes);
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/s3", isAuthenticated, s3Routes);

app.listen(config.port, () => {
    console.log(`Server is on at port ${config.port}`);
});
