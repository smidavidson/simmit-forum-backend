import pool from "./connect.js";
import * as studentDB from "./students.js";

async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
            student_id SERIAL PRIMARY KEY,
            name TEXT,
            age INTEGER
            )`);
        return true;
    } catch (error) {
        console.log(`Failed to initDatabase: ${error.message}`);
        throw error;
    }
}

async function closeDatabase() {
    try {
        await pool.end();
        return true;
    } catch (error) {
        return false;
    }
}

export { initDatabase, closeDatabase, studentDB };
