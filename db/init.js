import pool from "./connect.js";

async function initDatabase() {
    try {
        await initStudents();
        await initUsers();
        await initFlairs();
        await initPosts();
        await initComments();
        await initCommentCountTrigger();
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
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
        )`);
        
        const res = await pool.query(`SELECT COUNT(*) FROM users`);
        if (Number(res.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO users (email, username, password) VALUES
                ('test@test.com', 'admin', '$2b$10$2EsoP8iMu8tHs75eZRGk8.3QAOAhPVDN2w6wWsZcjULoiXLMtaLh.')
            `);
        }

        return true;
    } catch (error) {
        console.log(`Failed to initUsers(): ${error.message}`);
        throw error;
    }
}

async function initPosts() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                post_id SERIAL PRIMARY KEY,
                created_by INT,
                created_at TIMESTAMP DEFAULT NOW(),
                title TEXT,
                content TEXT,
                link_url TEXT,
                comment_count INT DEFAULT 0,
                image_url TEXT,
                image_key TEXT,
                flair INT,
                is_deleted BOOLEAN DEFAULT FALSE,
                like_count INT DEFAULT 0,
                FOREIGN KEY (created_by) REFERENCES users(user_id),
                FOREIGN KEY (flair) REFERENCES flairs(flair_id)
        )`)
        return true;
    }catch (error) {
        console.log(`Failed to initPosts(): ${error.message}`);
        throw error;
    }
}

async function initComments() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                comment_id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT NOW(),
                created_by INT,
                is_deleted BOOLEAN DEFAULT FALSE,
                post_id INT NOT NULL,
                content TEXT,
                FOREIGN KEY (created_by) REFERENCES users(user_id),
                FOREIGN KEY (post_id) REFERENCES posts(post_id)
        )`)
        return true;
    } catch (error) {
        console.log(`Failed to initComments(): ${error.message}`);
        throw error;
    }
}

async function initFlairs() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flairs (
                flair_id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT NOW(),
                color TEXT NOT NULL,
                name TEXT NOT NULL
        )`);

        const res = await pool.query(`SELECT COUNT(*) FROM flairs`);
        if (Number(res.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO flairs (color, name) VALUES
                ('#8B008B', 'gaming'),
                ('#DC143C', 'advice'),
                ('#1E90FF', 'news'),
                ('#006400', 'food'),
                ('#FF4500', 'sports'),
                ('#808b96', 'general')
            `);
        }
        return true;
    } catch (error) {
        console.log(`Failed to initFlairs(): ${error.message}`);
        throw error;
    }
}

async function initCommentCountTrigger() {
    try {
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_post_comment_count()
            RETURNS TRIGGER AS $$ 
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    UPDATE posts
                    SET comment_count = comment_count + 1
                    WHERE post_id = NEW.post_id;
                    RETURN NEW;
                END IF;

                IF TG_OP = 'UPDATE' THEN
                    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
                        UPDATE posts 
                        SET comment_count = comment_count - 1
                        WHERE post_id = NEW.post_id;
                        END IF;
                        RETURN NEW;
                END IF;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await pool.query(`
            DROP TRIGGER IF EXISTS comment_count_insert_trigger ON comments;
            CREATE TRIGGER comment_count_insert_trigger
                AFTER INSERT ON comments
                FOR EACH ROW
                EXECUTE FUNCTION update_post_comment_count();
        `);

        await pool.query(`
            DROP TRIGGER IF EXISTS comment_count_update_trigger ON comments;
            CREATE TRIGGER comment_count_update_trigger
                AFTER UPDATE ON comments
                FOR EACH ROW
                EXECUTE FUNCTION update_post_comment_count();
        `)


    } catch (error) {
        console.log(`Failed to initCommentCountTrigger(): ${error.message}`);
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
