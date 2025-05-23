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
            page_size,
        } = req.query;

        const PAGE_SIZE = parseInt(page_size) || 9;
        
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
        console.log(`Error in GET postsRoutes.js /: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
});

postsRoutes.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postsStore.getPost({ postId });

        res.json(post);
    } catch (error) {
        console.log(`Error in GET postsRoutes.js /:id: ${error.message}`);

        if (error.message === "Post not found") {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(500).json({ message: `Failed to fetch post ${postId}` });
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

postsRoutes.delete("/:postId", isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.session.user.user_id;

        const deletedPostId = await postsStore.deletePost({ postId, userId });

        res.json({ post_id: deletedPostId });
    } catch (error) {
        console.log(`Error in DELETE postsRoutes.js /posts: ${error.message}`);
        if (error.message === "Post not found") {
            return res.status(404).json({ message: error.message });
        } else if (error.message.includes("permissions")) {
            return res.status(403).json({ message: error.message });
        }

        res.status(500).json({ message: "Failed to delete post" });
    }
});

postsRoutes.get("/user/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { sortBy, page, pageSize } = req.query;

        const sortOptions = sortBy ? JSON.parse(sortBy) : undefined;

        const result = await postsStore.getPostsByUsername({
            username,
            sortBy: sortOptions,
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : 10,
        });

        res.json(result);
    } catch (error) {
        console.log(`Error in GET /posts/user/:username: ${error.message}`);
        res.status(500).json({ message: "Error fetching user posts" });
    }
});
