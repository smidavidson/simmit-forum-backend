import { Router } from "express";
import { postsStore } from "../stores/postsStore.js";
import { isAuthenticated } from "../middleware/auth.js";
import { commentsStore } from "../stores/commentsStore.js";

export const commentsRoutes = Router();

// Get all comments given a post id
commentsRoutes.get("/post/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { sort_field = "created_at", sort_direction = "desc" } =
            req.query;

        const comments = await commentsStore.getComments({
            postId: parseInt(postId),
            sortBy: { field: sort_field, direction: sort_direction },
        });

        res.json(comments);
    } catch (error) {
        console.log(
            `Error in GET commentsRoutes.js /post/:postId: ${error.message}`
        );
        res.status(500).json({ message: "Failed to fetch comments for post" });
    }
});

commentsRoutes.get("/user/:username", async (req, res) => {
    try {
        const { username } = req.params;

        const comments = await commentsStore.getCommentsByUsername({
            username,
        });

        res.json(comments);
    } catch (error) {
        console.log(
            `Error in GET postsRoutes.js /user/:username: ${error.message}`
        );
        res.status(500).json({
            message: `Failed to fetch comments for user: ${username}`,
        });
    }
});

commentsRoutes.post("/", isAuthenticated, async (req, res) => {
    try {
        const { content, postId } = req.body;

        if (!content || !postId) {
            return res
                .status(400)
                .json({ message: "Content and postId are required" });
        }

        const userId = req.session.user.user_id;

        const comment = await commentsStore.insertComment({
            comment: {
                content,
                postId: parseInt(postId),
            },
            userId,
        });

        res.json(comment);
    } catch (error) {
        console.log(`Error in POST postsRoutes.js /comments: ${error.message}`);
        res.status(500).json({
            message: `Failed to post comment`,
        });
    }
});

commentsRoutes.delete('/:commentId', isAuthenticated, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.session.user.user_id;

        const deletedCommentId = await commentsStore.deleteComment({commentId, userId});

        res.json({id: deletedCommentId});
    } catch (error) {
        console.log(`Error in DELETE postsRoutes.js /comments: ${error.message}`);
        if (error.message === "Comment not found") {
            return res.status(404).json({message: error.message});
        } else if (error.message.includes("permission")) {
            return res.status(403).json({message: error.message});
        }

        res.status(500).json({message: "Error deleting comment"});
    }
})
