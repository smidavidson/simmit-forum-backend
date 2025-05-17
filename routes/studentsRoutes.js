// Handles /students routing
import { Router } from "express";
import { studentsStore } from "../stores/studentsStore.js";
import { isAuthenticated } from "../middleware/auth.js";
export const studentsRoutes = Router();

// Returns all students
studentsRoutes.get("/", isAuthenticated, async (req, res) => {
    try {
        const students = await studentsStore.getAllStudents();
        res.json(students);
    } catch (error) {
        console.log(`Get students error: ${error.message}`);
        res.status(500).json({ message: "Failed to fetch students" });
    }
});

// Returns student with specified student_id
studentsRoutes.get("/:student_id", async (req, res) => {
    try {
        const { student_id } = req.params;
        const student = await studentsStore.getStudentWithId({ student_id });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json(student);
    } catch (error) {
        console.log(`Get student with id error: ${error.message}`);
        res.status(500).json({
            message: `Error fetching student with student_id: ${student_id}`,
        });
    }
});

// Handle POST of new data
studentsRoutes.post("/", isAuthenticated, async (req, res) => {
    try {
        const { name, age } = req.body;
        if (!name || !age) {
            return res
                .status(400)
                .json({ message: "Name and age are required" });
        }

        const student = await studentsStore.insertStudent({ name, age });
        res.json(student);
    } catch (error) {
        console.log(`Create student error: ${error.message}`);
        res.status(500).json({ message: `Error creating student` });
    }
});

// authorizeRole(['admin'])
studentsRoutes.delete("/:student_id", isAuthenticated, async (req, res) => {
    try {
        const { student_id } = req.params;
        const student = await studentsStore.deleteStudent({ student_id });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: `Error deleting student with student_id: ${student_id}`,
        });
    }
});
