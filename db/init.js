import pool from "./connect.js";

async function initDatabase() {
    try {
        await initStudents();
        await initUsers();
    } catch (error) {
        console.log(`Failed to initDatabase(): ${error.message}`);
        throw error;
    }
}

async function initStudents() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                student_id SERIAL PRIMARY KEY,
                name TEXT,
                age INTEGER
            )`);
        return true;
    } catch (error) {
        console.log(`Failed to initStudents(): ${error.message}`);
        throw error;
    }
}

async function initUsers() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`);
        return true;
    } catch (error) {
        console.log(`Failed to initUsers(): ${error.message}`);
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

export { initDatabase, closeDatabase };
