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

export async function updateRefreshToken(
    oldRefreshToken,
    newRefreshToken,
    newExpiryDate
) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Get old refresh token
        const oldRefreshTokenResults = await client.query(
            `SELECT user_id FROM refresh_tokens WHERE token = $1 AND is_revoked = FALSE AND expires_at > NOW()`,
            [oldRefreshToken]
        );
        if (oldRefreshTokenResults.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        const userId = oldRefreshTokenResults.rows[0].user_id;
        await client.query(
            `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1`,
            [oldRefreshToken]
        );

        const result = await client.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING token_id`,
            [userId, newRefreshToken, newExpiryDate]
        );

        await client.query("COMMIT");

        return {
            tokenId: result.rows[0].token_id,
            userId
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(`Error in updateRefreshToken(): ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}