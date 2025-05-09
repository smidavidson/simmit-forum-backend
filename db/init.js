import pool from "./connect.js";

async function initDatabase() {
    try {
        await initStudents();
        await initUsers();
        await initUsersRoles();
        await initRefresh();
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
        console.log(`Failed to initAuth(): ${error.message}`);
        throw error;
    }
}

async function initUsersRoles() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users_roles (
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'user',
                PRIMARY KEY (user_id, role)
            )`);
        return true;
    } catch (error) {
        console.log(`Failed to initUsersRoles(): ${error.message}`);
        throw error;
    }
}

async function initRefresh() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                token TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_revoked BOOLEAN DEFAULT FALSE
            )
            `);
            return true;
    } catch (error) {
        console.log(`Failed to initRefresh(): ${error.message}`);
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
