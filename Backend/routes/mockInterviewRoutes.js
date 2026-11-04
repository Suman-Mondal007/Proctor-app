import express from "express";
import multer from "multer";
import { startInterview, analyzeAnswers } from "../controllers/mockInterviewController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary storage for CV parsing

router.post("/start", upload.single("cv"), startInterview);
router.post("/analyze", analyzeAnswers);

export default router;
