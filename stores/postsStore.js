import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import pool from "../db/connect.js";
import { deleteFileFromS3 } from "../routes/s3Routes.js";

export const postsStore = {
    // Create post
    insertPost: async ({ postData, userId }) => {
        try {
            const values = [
                postData.title,
                postData.content,
                postData.link_url || null,
                userId,
                postData.image_url || null,
                postData.image_key || null,
                postData.flair,
            ];

            const postsResults = await pool.query(
                `
                INSERT INTO posts (
                    title,
                    content,
                    link_url,
                    created_by,
                    image_url,
                    image_key,
                    flair
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                values
            );

            if (postsResults.rows.length === 0) {
                throw new Error("Failed to create post");
            }

            const postWithDetails = await postsStore.getPost({
                postId: postsResults.rows[0].post_id,
            });

            return postWithDetails;
        } catch (error) {
            console.log(`Error in postStore.js/insertPost(): ${error.message}`);
            throw error;
        }
    },

    // Get some posts
    getPosts: async ({
        sortBy = { field: "created_at", direction: "desc" },
        page,
        pageSize,
        filter,
    }) => {
        try {
            let query = `
                SELECT 
                    p.*,
                    u.username,
                    f.name as flair_name,
                    f.color as flair_color,
                    COUNT(*) OVER() as total_count
                FROM 
                    posts p
                JOIN 
                    users u ON p.created_by = u.user_id
                JOIN
                    flairs f ON p.flair = f.flair_id
                WHERE
                    p.is_deleted = false
            `;

            const queryParams = [];

            // Use queryParams.length for additional parameters $1, $2, etc.
            if (filter && filter !== "none") {
                queryParams.push(filter);
                query = query + ` AND f.name = $${queryParams.length}`;
            }

            query =
                query +
                ` ORDER BY p.${sortBy.field} ${
                    sortBy.direction === "asc" ? "ASC" : "DESC"
                }`;

            if (page && pageSize) {
                const offset = (page - 1) * pageSize;
                queryParams.push(pageSize);
                queryParams.push(offset);
                query =
                    query +
                    ` LIMIT $${queryParams.length - 1} OFFSET $${
                        queryParams.length
                    }`;
            }

            const postsResults = await pool.query(query, queryParams);

            const posts = postsResults.rows.map((row) => ({
                id: row.post_id,
                title: row.title,
                content: row.content,
                link_url: row.link_url,
                image_url: row.image_url,
                created_at: row.created_at,
                created_by: row.created_by,
                username: row.username,
                comment_count: row.comment_count,
                is_deleted: row.is_deleted,
                flairs: {
                    name: row.flair_name,
                    color: row.flair_color,
                },
            }));

            const count =
                postsResults.rows.length > 0
                    ? parseInt(postsResults.rows[0].total_count)
                    : 0;

            return { posts, count };
        } catch (error) {
            console.error(`Error in getPosts():`, error.message);
            throw error;
        }
    },

    // Get specific post with post id
    getPost: async ({ postId }) => {
        try {
            const query = `
                SELECT 
                    p.*,
                    u.username,
                    f.name as flair_name,
                    f.color as flair_color
                FROM 
                    posts p
                LEFT JOIN 
                    users u ON p.created_by = u.user_id
                LEFT JOIN 
                    flairs f ON p.flair = f.flair_id
                WHERE 
                    p.post_id = $1
            `;

            const postsResults = await pool.query(query, [postId]);

            if (postsResults.rows.length === 0) {
                throw new Error("Post not found");
            }

            const row = postsResults.rows[0];

            return {
                id: row.post_id,
                title: row.title,
                content: row.content,
                link_url: row.link_url,
                image_url: row.image_url,
                created_at: row.created_at,
                created_by: row.created_by,
                is_deleted: row.is_deleted,
                username: row.username,
                flairs: {
                    name: row.flair_name,
                    color: row.flair_color,
                },
            };
        } catch (error) {
            console.error(`Error in postsStore.js/getPost():`, postId);
            throw error;
        }
    },

    // Delete post
    deletePost: async ({ postId, userId }) => {
        try {
            // Check if user owns the post
            const postsResults = await pool.query(
                `SELECT created_by FROM posts WHERE post_id = $1`,
                [postId]
            );

            if (postsResults.rows.length === 0) {
                throw new Error("Post not found");
            }

            const post = postsResults.rows[0];
            console.log("Post created by userId: ", post.created_by);

            if (post.created_by !== userId) {
                console.log(`Permission check failed: post.created_by=${post.created_by} (${typeof post.created_by}), userId=${userId} (${typeof userId})`);

                throw new Error(
                    "You do not have permission to delete this post"
                );
            }

            // Delete image from bucket if it exists
            if (post.image_key) {
                try {
                    const deleted = await deleteFileFromS3(post.image_key);
                    if (deleted) {
                        console.log(
                            `Successfully deleted image with key: ${post.image_key}`
                        );
                    } else {
                        console.log(
                            `Failed to delete image with key: ${post.image_key}, continuing with post deletion`
                        );
                    }
                } catch (error) {
                    console.log(
                        `Failed to delete image from S3: ${error.message}`
                    );
                }
            }

            // Update the post as deleted
            const updateResult = await pool.query(
                `UPDATE posts
                SET 
                    is_deleted = true,
                    title = NULL,
                    content = NULL,
                    created_by = NULL,
                    link_url = NULL,
                    image_url = NULL,
                    image_key = NULL,
                    flair = NULL
                WHERE post_id = $1
                RETURNING post_id`,
                [postId]
            );
            return updateResult.rows[0].post_id;
        } catch (error) {
            console.error(
                `Error in postsStore.js/deletePost() post id: ${postId}:`,
                error.message
            );
            throw error;
        }
    },
};
