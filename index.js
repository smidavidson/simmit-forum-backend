// Load environment variables
import '@dotenvx/dotenvx/config';

import { fileURLToPath } from "url";
import { dirname, sep } from "path";
import express from "express";
import { initDatabase, studentDB } from "./db/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url)) + sep;
const config = {
    port: process.env.PORT,
    dir: {
        root: __dirname,
        static: __dirname + "static" + sep,
    },
};

const app = express();

app.set('trust proxy', true);


app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(JSON.stringify(req.headers));
    const ip = req.headers['x-forwarded-for'];
    console.log(`Request from IP: ${ip}`);
    next();
})

async function startServer() {
    try {
        await initDatabase();
        console.log(`Database initialized`);
    } catch (error) {
        process.exit(1);
    }
}

startServer();

// Returns all students
app.get("/students", async (req, res) => {
    try {
        const students = await studentDB.getAllStudents();
        res.json(students);
    } catch (error) {
        // Handle thrown error emanating from DB layer
        res.status(500).json({error: "Failed to fetch students"})
    }
});

// Returns student with specified student_id
app.get("/students/:student_id", async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const student = await studentDB.getStudentById({student_id: student_id});

        if(student.length === 0) {
            return res.status(404).json({error: "Student not found"});
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch student"});
    }
});

// Handle POST of new data
app.post("/students", async (req, res) => {
    try {
        const {name, age} = req.body;
        if (!name || !age) {
            return res.status(400).json({error: "Name and age required"});
        }
        const student = await studentDB.insertStudent({name: name, age: age});
        res.json(student);
    } catch (error) {
        res.status(500).json({error: "Failed to insert new student"});
    }
});

app.delete("/students/:student_id", async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const student = await studentDB.deleteStudent({student_id: student_id});

        if (!student) {
            return res.status(404).json({error: "Student not found"});
        }

        res.status(200).json({message: "student deleted successfully"});
    } catch (error) {
        res.status(500).json({error: "Failed to delete student"});
    }
})



// Form to insert new students
app.get("/newstudent", (req, res) => {
    res.render("newstudent");
});



app.listen(config.port, () => {
    console.log(`Server is on at port ${config.port}`);
});
