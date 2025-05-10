import pool from "../db/connect.js";

export async function getUserRoleByUserId({ user_id }) {
    try {
        const usersRolesResults = await pool.query(
            `SELECT role FROM users_roles WHERE user_id = $1`,
            [user_id]
        );
        return usersRolesResults.rows[0]['role'] || null;
    } catch (error) {
        console.log(`Error in getUserRoleByUserId(): ${error.message}`);
        throw error;
    }
}

export async function insertUserIntoUserRole({user_id}) {
	try {
		const usersRolesResults = await pool.query(
			`INSERT INTO users_roles VALUES ($1) RETURNING *`,
			[user_id]
		)
		return usersRolesResults.rows;
	} catch (error) {
		console.log(`Error in insertUserIntoUserRole(): ${error.message}`);
		throw error;
	}
}