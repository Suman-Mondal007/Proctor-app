import { GoogleGenAI } from "@google/genai";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const MODEL = "gemini-3.5-flash-lite";

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key is missing in backend .env");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const callGemini = async (ai, prompt) => {
  const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
  return response.text?.trim();
};

// ============================================================
// START INTERVIEW — Generate structured phased questions
// ============================================================
export const startInterview = async (req, res) => {
  let filePath = null;
  try {
    const { company, role, difficulty, questionCount = 10, interviewType = "Mixed" } = req.body;
    const count = Math.min(30, Math.max(3, parseInt(questionCount, 10) || 10));

    if (!req.file) return res.status(400).json({ success: false, message: "CV file is required." });

    filePath = req.file.path;
    const cvBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(cvBuffer);
    const cvText = pdfData.text?.trim();

    if (!cvText) return res.status(400).json({ success: false, message: "Could not extract text from CV." });

    const ai = getAI();

    const prompt = `You are a senior interviewer at ${company} conducting a real job interview for the role of ${role} (Difficulty: ${difficulty}).
Interview Type: ${interviewType}

Candidate CV:
----
${cvText.substring(0, 5000)}
----

Generate exactly ${count} ${interviewType} interview questions for a ${difficulty} level ${role} role at ${company}, based on the CV below.

CRITICAL REQUIREMENT FOR QUESTION LENGTH & COMPLEXITY BALANCE:
- Exactly 50% of the questions must be SHORT and concise (quick conceptual definitions, single-topic checks, or brief warm-up questions that take 10-20 seconds to answer).
- Exactly 50% of the questions must be LONG, deep, multi-part scenarios, system design, architectural decisions, or complex behavioral/STAR-method case studies.
- Interleave them properly across the list (do not bunch all short ones together).

Rules:
- All questions must be UNIQUE and RANDOMIZED — not generic templates.
- Use the CV to personalize questions wherever possible.
- Return ONLY a JSON array of exactly ${count} strings, with no extra text.`;

    const text = await callGemini(ai, prompt);
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ success: false, message: "AI returned an invalid response. Please try again." });
    }

    const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    const questions = questionsArray.slice(0, count);

    return res.status(200).json({ success: true, questions });

  } catch (error) {
    console.error("Start Interview Error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate questions." });
  } finally {
    if (filePath) {
      setImmediate(() => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      });
    }
  }
};

// ============================================================
// ANALYZE ANSWERS — Structured feedback with scores
// ============================================================
export const analyzeAnswers = async (req, res) => {
  try {
    const { questions, answers, role, difficulty } = req.body;

    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ success: false, message: "Questions are required." });

    const ai = getAI();

    let qaPairs = "";
    questions.forEach((q, i) => {
      const questionText = typeof q === "object" ? q.question : q;
      const phase = typeof q === "object" ? q.phaseLabel : "General";
      qaPairs += `[${phase}]\nQ: ${questionText}\nA: ${answers[i] || "No answer given"}\n\n`;
    });

    const prompt = `You are a senior interviewer analyzing a ${difficulty} level interview for the role of ${role}.

Interview Q&A:
---
${qaPairs}
---

Note: Answers were spoken and auto-transcribed — ignore minor grammar/spelling issues.

Analyze the candidate's performance comprehensively. Return ONLY this exact JSON (no markdown, no extra text):

{
  "overallFeedback": "2-3 sentence professional summary of performance",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement area 1", "specific improvement area 2", "specific improvement area 3"],
  "technicalScore": 0,
  "communicationScore": 0,
  "confidenceScore": 0,
  "overallScore": 0,
  "verdict": "Strong Hire | Hire | Maybe | No Hire",
  "verdictReason": "One sentence justifying the verdict."
}

Scoring: all scores 0-100. Be accurate and fair. Penalize heavily for "No answer given".`;

    const text = await callGemini(ai, prompt);
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let feedback;
    try {
      feedback = JSON.parse(cleaned);
    } catch (e) {
      feedback = {
        overallFeedback: cleaned,
        strengths: [],
        improvements: [],
        technicalScore: null,
        communicationScore: null,
        confidenceScore: null,
        overallScore: null,
        verdict: "N/A",
        verdictReason: ""
      };
    }

    return res.status(200).json({ success: true, feedback });

  } catch (error) {
    console.error("Analyze Error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to analyze answers." });
  }
};