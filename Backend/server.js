import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import mockInterviewRoutes from "./routes/mockInterviewRoutes.js";

dotenv.config();

const app = express();

// ES Module __dirname fix for static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to Database
connectDB();

// Global Middleware
app.use(cors());

// Increase payload limit for Base64/large profile photo uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static Folder for Profile Photos & File Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/candidates", resultRoutes); // Alias route for results
app.use("/api/exams", examRoutes);
app.use("/api/mock-interview", mockInterviewRoutes);

console.log("All routes successfully loaded!");

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    message: "AI Exam Backend Running",
    status: "Active",
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Server Initialization
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});