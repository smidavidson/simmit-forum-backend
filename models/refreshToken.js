import pool from "../db/connect.js";

export async function saveRefreshToken(userId, token, expiresAt) {
    try {
        const result = await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token_id`,
            [userId, token, expiresAt]
        );
        return result.rows[0];
    } catch (error) {
        console.log(`Error in saveRefreshToken(): ${error.message}`);
        throw error;
    }
}

export async function getRefreshToken(refreshToken) {
    try {
        const result = await pool.query(
            `SELECT * FROM refresh_tokens WHERE token = $1 AND is_revoked = FALSE AND expires_at > NOW()`,
            [refreshToken]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.log(`Error in getRefreshToken: ${error.message}`);
        throw error;
    }
}
