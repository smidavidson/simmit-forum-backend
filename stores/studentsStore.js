import pool from "../db/connect.js";

export const studentsStore = {
    // Get all students
    getAllStudents: async () => {
        try {
            const studentResults = await pool.query("SELECT * FROM students");
            return studentResults.rows;
        } catch (error) {
            console.error(
                `Error to getAllStudents() fetch ${student_id}:`,
                error.message
            );
            throw error;
        }
    },
    // Get student with matching student_id
    getStudentWithId: async ({ student_id }) => {
        try {
            const studentResults = await pool.query(
                "SELECT * FROM students WHERE student_id = $1",
                [student_id]
            );
            return studentResults.rows;
        } catch (error) {
            console.error(
                `Error to getStudentByID() fetch ${student_id}:`,
                error.message
            );
            throw error;
        }
    },
    // Insert new student
    insertStudent: async ({ name, age }) => {
        try {
            const results = await pool.query(
                "INSERT INTO students (name, age) VALUES ($1, $2) RETURNING *",
                [name, age]
            );
            return results.rows;
        } catch (error) {
            console.error(`Error to insertStudent():`, error.message);
            throw error;
        }
    },
    // Delete student
    deleteStudent: async ({ student_id }) => {
        try {
            const results = await pool.query(
                "DELETE FROM students WHERE student_id = $1",
                [student_id]
            );
            return results.rowCount > 0;
        } catch (error) {
            console.error(
                `Error to deleteStudent() student id: ${student_id}:`,
                error.message
            );
            throw error;
        }
    },
};
