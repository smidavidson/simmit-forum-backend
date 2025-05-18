import pool from "../db/connect.js";
import bcrypt from "bcrypt";

export const userStore = {
    insertUser: async ({username, password, email}) => {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const userResults = await pool.query(
                `INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING username, user_id`,
                [username, hashedPassword, email]
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

    verifyUser: async ({email, password}) => {
        try {
            const userResults = await pool.query(
                `SELECT * FROM users WHERE email = $1`,
                [email]
            );

            if (userResults.rows.length === 0) {
                return { success: false, message: "Invalid email" };
            }

            const user = userResults.rows[0];

            const isPasswordMatch = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordMatch) {
                return { success: false, message: "Invalid password" };
            }
            return {
                success: true,
                user: {
                    username: user.username,
                    user_id: user.user_id,
                },
            };
        } catch (error) {
            console.log(`Error in verifyUser(): ${error.message}`);
            throw error;
        }
    }
};
