import { Router } from "express";
import { postsStore } from "../stores/postsStore.js";
import { isAuthenticated } from "../middleware/auth.js";
import { commentsStore } from "../stores/commentsStore.js";

export const commentsRoutes = Router();

// Get all comments given a post id
commentsRoutes.get("/post/:postId", async (req, res) => {
    try {
        const {postId} = req.params;
        const {
            sort_field = 'created_at',
            sort_direction = 'desc',
        } = req.query;

        const comments = await commentsStore.getComments({postId: parseInt(postId), sortBy: {field: sort_field, direction: sort_direction}})

        res.json(comments);
    } catch (error) {
        console.log(`Error in GET commentsRoutes.js /post/:postId: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch comments for post" });
    }
});

commentsRoutes.get("/user/:username", async (req, res) => {
    try {
        const {username} = req.params;

        const comments = await commentsStore.getCommentsByUsername({username});

        res.json(comments);
    } catch (error) {
        console.log(`Error in GET postsRoutes.js /user/:username: ${error.message}`);
        res.status(500).json({ message: `Failed to fetch comments for user: ${username}` });
    }
});

// Create a new post
postsRoutes.post("/", isAuthenticated, async (req, res) => {
    try {
        console.log("req body: ", req.body);
        const { title, content, link_url, image_url, image_key, flair } =
            req.body;

        if (!title || !content || !flair) {
            return res
                .status(400)
                .json({ message: "Title, content and flair are required" });
        }

        const userId = req.session.user.user_id;
        console.log("UserID: ", userId);

        const post = await postsStore.insertPost({
            postData: {
                title,
                content,
                link_url,
                image_url,
                image_key,
                flair,
            },
            userId,
        });

        res.json(post);
    } catch (error) {
        console.log(`Error in POST postsRoutes.js /: ${error.message}`);
        res.status(500).json({ message: "Failed to insert to posts" });
    }
});
