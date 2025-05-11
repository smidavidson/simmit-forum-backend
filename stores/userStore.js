import { errors } from "formidable";
import pool from "../db/connect.js";
import bcrypt from "bcrypt";

export const userStore = {
    insertUser: async ({username, password}) => {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const userResults = await pool.query(
                `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING username, user_id`,
                [username, hashedPassword]
            );
            return {
                success: true,
                user: userResults.rows[0],
            };
        } catch (error) {
            console.log(`Error in insertUser(): ${error.message}`);
            throw error;
        }
    },

    verifyUser: async ({username, password}) => {
        try {
            const userResults = await pool.query(
                `SELECT * FROM users WHERE username =$1`,
                [username]
            );

            if (userResults.rows.length === 0) {
                return { success: false, error: "Invalid username" };
            }

            const user = userResults.rows[0];

            const isPasswordMatch = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordMatch) {
                return { success: false, error: "Invalid password" };
            }
            return {
                success: true,
                user: {
                    username: user.username,
                },
            };
        } catch (error) {
            console.log(`Error in verifyUser(): ${error.message}`);
            throw error;
        }
    }
};
