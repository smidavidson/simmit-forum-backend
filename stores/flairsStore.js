import pool from "../db/connect.js";

export const flairsStore = {
    // Get all flairs
    getFlairs: async () => {
        try {
            const flairsResults = await pool.query(`
                SELECT 
                    flair_id as id,
                    name,
                    color
                FROM 
                    flairs
                ORDER BY name ASC
            `);

            return flairsResults.rows;
        } catch (error) {
            console.error(`Error in flairStore.js/getFlairs():`, error.message);
            throw error;
        }
    },
};
