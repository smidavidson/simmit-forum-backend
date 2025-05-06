// Set up DB connection
import pg from 'pg';
const { Pool } = pg;

// Create a pool of connections
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
});

export default pool;