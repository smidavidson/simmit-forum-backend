import pool from "../db/connect.js";

export const commentsStore = {
    // Insert comment for a post
    insertComment: async ({ comment, userId }) => {
        try {
            const commentsResults = await pool.query(
                `
                    INSERT INTO comments (
                    content,
                    post_id,
                    created_by
                )
                VALUES ($1, $2, $3)
                RETURNING *
                `,
                [comment.content, comment.postId, userId]
            );

            if (commentsResults.rows.length === 0) {
                throw new Error("Failed to insert comment");
            }

            return {
                id: commentsResults.rows[0].comment_id,
                success: true,
            };
        } catch (error) {
            console.error(
                `Error in submitComment to post ${comment.post_id}:`,
                error.message
            );
            throw error;
        }
    },

    // Get all comments for a specific post
    getComments: async ({
        postId,
        sortBy = { field: "created_at", direction: "desc" },
    }) => {
        try {
            const commentsResults = await pool.query(
                `
                    SELECT
                        c.*,
                        u.username
                    FROM
                        comments c
                    LEFT JOIN
                        users u ON c.created_by = u.user_id
                    WHERE 
                        c.post_id = $1
                    ORDER BY 
                        c.${sortBy.field} ${
                    sortBy.direction === "asc" ? "ASC" : "DESC"
                }
                `,
                [postId]
            );

            const comments = commentsResults.rows.map((comment) => ({
                id: comment.comment_id,
                content: comment.content,
                created_at: comment.created_at,
                created_by: comment.created_by,
                is_deleted: comment.is_deleted,
                post_id: comment.post_id,
                username: comment.username,
            }));

            return comments;
        } catch (error) {
            console.error(
                `Error in getCommentsFromPostId() fetching post ${postId}:`,
                error.message
            );
            throw error;
        }
    },

    getCommentsByUsername: async ({ username }) => {
        try {
            const commentsResults = await pool.query(
                `
                SELECT 
                    c.*,
                    u.username
                FROM 
                    comments c
                JOIN 
                    users u ON c.created_by = u.user_id
                WHERE 
                    u.username = $1
                ORDER BY
                    c.created_at DESC
                `,
                [username]
            );

            const comments = commentsResults.rows.map((comment) => ({
                id: comment.comment_id,
                content: comment.content,
                created_at: comment.created_at,
                created_by: comment.created_by,
                username: comment.username,              
            }));

            return comments;
        } catch (error) {
            console.error(
                `Error in getCommentsByUsername() username: ${username}`,
                error.message
            );
            throw error;
        }
    },

    // Delete a comment
    deleteComment: async ({ commentId, userId }) => {
        try {
            const commentsResults = await pool.query(
                `
                SELECT 
                    created_by,
                    post_id
                FROM 
                    comments
                WHERE 
                    comment_id = $1
                `,
                [commentId]
            );

            if (commentsResults.rows.length === 0) {
                throw new Error("Comment not found");
            }

            const comment = commentsResults.rows[0];

            // Check if user has perms before deleting
            if (comment.created_by !== userId) {
                throw new Error(
                    "You do not have the permission to delete this comment"
                );
            }

            const deleteCommentResults = await pool.query(
                `
                UPDATE 
                    comments
                SET
                    content = NULL, 
                    created_by = NULL,
                    is_deleted = true
                WHERE
                    comment_id = $1
                RETURNING comment_id
                `,
                [commentId]
            );

            return {
                comment_id: deleteCommentResults.rows[0].comment_id,
                success: true,
            };
        } catch (error) {
            console.error(
                `Error in deleteComment() deleting comment id ${commentId}:`,
                error.message
            );
            throw error;
        }
    },
};
