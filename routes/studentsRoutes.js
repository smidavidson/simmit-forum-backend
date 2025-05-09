// Handles /students routing
import { Router } from "express";
import * as studentDB from "../models/students.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
export const studentsRoutes = Router();

// Returns all students
studentsRoutes.get("/", async (req, res) => {
    try {
        const students = await studentDB.getAllStudents();
        res.json(students);
    } catch (error) {
        // Handle thrown error emanating from DB layer
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

// Returns student with specified student_id
studentsRoutes.get("/:student_id", async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const student = await studentDB.getStudentById({
            student_id: student_id,
        });

        if (student.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch student" });
    }
});

// Handle POST of new data
studentsRoutes.post("/", authenticateToken, async (req, res) => {
    try {
        const { name, age } = req.body;
        if (!name || !age) {
            return res.status(400).json({ error: "Name and age required" });
        }
        const student = await studentDB.insertStudent({ name: name, age: age });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: "Failed to insert new student" });
    }
});

// authorizeRole(['admin'])
studentsRoutes.delete(
    "/:student_id",
    authenticateToken,
    authorizeRole(['admin']),
    async (req, res) => {
        try {
            const student_id = req.params.student_id;
            const student = await studentDB.deleteStudent({
                student_id: student_id,
            });

            if (!student) {
                return res.status(404).json({ error: "Student not found" });
            }

            res.status(200).json({ message: "Student deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete student" });
        }
    }
);
