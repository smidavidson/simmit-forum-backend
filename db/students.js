import pool from './connect.js';

export async function getAllStudents() {
    try {
        const results = await pool.query("SELECT * FROM students");
        return results.rows;
    } catch (error) {
        console.error(`Error to getAllStudents() fetch ${student_id}:`, error.message); 
        throw error;
    }
}

export async function getStudentById({student_id}) {
	try {
		const results = await pool.query(
                        'SELECT * FROM students WHERE student_id = $1'
                        , [student_id]);
		return results.rows;
	} catch (error) {
	    console.error(`Error to getStudentByID() fetch ${student_id}:`, error.message);
		throw error;
	}
}

export async function insertStudent({name, age}) {
    try {
        const results = await pool.query("INSERT INTO students (name, age) VALUES ($1, $2) RETURNING *", [name, age]);
        return results.rows;
    } catch (error) {
        console.error(`Error to insertStudent():`, error.message);
        throw error;
    }
}

export async function deleteStudent({student_id}) {
    try {
        const results = await pool.query("DELETE FROM students WHERE student_id = $1", [student_id]);
        return results.rowCount > 0;
    } catch (error) {
        console.error(`Error to deleteStudent() student id: ${student_id}:`, error.message);
        throw error;
    }
}

// Add more later