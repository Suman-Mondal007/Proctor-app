import express from "express";
import {
  submitResult,
  getCandidateResults,
  getAllResults,
  deleteResult,
} from "../controllers/resultController.js";

const router = express.Router();

// ==========================
// Submit Exam Result
// POST /api/results
// ==========================
router.post("/", submitResult);

// ==========================
// Get All Results (Admin)
// GET /api/results
// ==========================
router.get("/", getAllResults);

// ==========================
// Get Candidate Results
// GET /api/results/:id
// ==========================
router.get("/:id", getCandidateResults);

// ==========================
// Delete Exam Result
// DELETE /api/results/:id
// ==========================
router.delete("/:id", deleteResult);

export default router;