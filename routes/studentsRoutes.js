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
studentsRoutes.get("/:student_id", async (req, res) => {});

// Handle POST of new data
studentsRoutes.post("/", async (req, res) => {});

// authorizeRole(['admin'])
studentsRoutes.delete("/:student_id", async (req, res) => {});
