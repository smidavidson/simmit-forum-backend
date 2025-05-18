import { Router } from "express";
import { postsStore } from "../stores/postsStore.js";
import { isAuthenticated } from "../middleware/auth.js";

export const postsRoutes = Router();

// Get a number of posts
postsRoutes.get("/", async (req, res) => {
    try {
        const {
            sort_field = "created_at",
            sort_direction = "desc",
            page = 1,
            filter,
        } = req.query;

        const PAGE_SIZE = 10;

        const posts = await postsStore.getPosts({
            sortBy: {
                field: sort_field,
                direction: sort_direction,
            },
            page: parseInt(page),
            pageSize: PAGE_SIZE,
            filter,
        });

        res.json(posts);
    } catch (error) {
        console.log(`GET posts error: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
});

// Create a new post
postsRoutes.post("/", isAuthenticated, async (req, res) => {
    try {
        const { title, content, link_url, image_url, image_key, flair } =
            req.body;

        if (!title || !content || !flair) {
            return res
                .status(400)
                .json({ message: "Title, content and flair are required" });
        }

        const userId = req.session.user.userId;
        console.log("UserID: ", userId);

        const post = await postsStore.insertPost(
            {
                title,
                content,
                link_url,
                image_url,
                image_key,
                flair,
            },
            userId
        );

        res.json(post);
    } catch (error) {
        console.log(`POST posts error: ${error.message}`);
        res.status(500).json({ message: "Failed to insert posts" });
    }
});
