import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaBuilding,
  FaUserTie,
  FaLayerGroup,
  FaArrowRight,
  FaArrowLeft,
  FaRobot,
  FaSpinner,
  FaFilePdf,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaCamera,
  FaMicrophone,
  FaLightbulb,
  FaListOl,
  FaClipboardList,
  FaTags,
} from "react-icons/fa";
import API from "../../services/api";
import "./MockInterviewSetup.css";

const MAX_CV_SIZE_MB = 5;
const MAX_SKILLS = 8;
const SETTINGS_KEY = "mockInterviewSetup";

const DIFFICULTIES = [
  { value: "Easy", label: "Easy", sub: "Entry Level" },
  { value: "Medium", label: "Medium", sub: "Mid Level" },
  { value: "Hard", label: "Hard", sub: "Senior Level" },
];

const INTERVIEW_TYPES = ["Technical", "Behavioral", "HR", "Mixed"];
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 30;
const QUICK_COUNTS = [5, 10, 15, 20];
const MINUTES_PER_QUESTION = 2;

// Keep the question count a whole number between MIN and MAX
const clampCount = (value) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return MIN_QUESTIONS;
  return Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, n));
};

const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
  "Java Developer",
];

const LOADING_STEPS = [
  "Reading your CV...",
  "Analysing your skills & experience...",
  "Tailoring questions to the role...",
  "Preparing your interview room...",
];

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MockInterviewSetup = () => {
  const navigate = useNavigate();

  // Fresh initial state so it doesn't persist stale inputs from a completed session
  const [formData, setFormData] = useState({
    cv: null,
    company: "",
    role: "",
    difficulty: "Medium",
    interviewType: "Mixed",
    questionCount: 10,
    jobDescription: "",
  });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  // Clear local setup storage on mount to ensure a fresh reset every time the page opens
  useEffect(() => {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Cycle through progress messages while the backend generates questions
  useEffect(() => {
    if (!isSubmitting) {
      setLoadingStep(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2500);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  const validateAndSetFile = (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are supported. Please upload your CV as a PDF.");
      return;
    }
    if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
      setError(`Your CV must be smaller than ${MAX_CV_SIZE_MB} MB.`);
      return;
    }

    setError("");
    setFormData((prev) => ({ ...prev, cv: file }));
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files[0]);
    e.target.value = ""; // allow re-selecting the same file
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, cv: null }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---- Custom number of questions ----
  const handleCountInput = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setFormData((prev) => ({ ...prev, questionCount: raw === "" ? "" : Number(raw) }));
  };

  const handleCountBlur = () => {
    setFormData((prev) => ({ ...prev, questionCount: clampCount(prev.questionCount) }));
  };

  const stepCount = (delta) => {
    setFormData((prev) => ({
      ...prev,
      questionCount: clampCount((parseInt(prev.questionCount, 10) || MIN_QUESTIONS) + delta),
    }));
  };

  const setCount = (n) => {
    setFormData((prev) => ({ ...prev, questionCount: clampCount(n) }));
  };

  const addSkill = (raw) => {
    const value = raw.trim().replace(/,$/, "").trim();
    if (!value) return;
    if (skills.length >= MAX_SKILLS) return;
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    setSkills((prev) => [...prev, value]);
    setSkillInput("");
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && !skillInput && skills.length) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const questionCount = clampCount(formData.questionCount);
    if (!formData.cv) {
      setError("Please upload your CV to proceed.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("cv", formData.cv);
      data.append("company", formData.company);
      data.append("role", formData.role);
      data.append("difficulty", formData.difficulty);
      data.append("interviewType", formData.interviewType);
      data.append("questionCount", String(questionCount));
      if (formData.jobDescription.trim()) data.append("jobDescription", formData.jobDescription.trim());
      if (skills.length) data.append("focusSkills", JSON.stringify(skills));

      // Call Backend to parse CV and generate questions
      const requestStart = () =>
        API.post("/mock-interview/start", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });

      const response = await requestStart();
      let questions = Array.isArray(response.data?.questions) ? [...response.data.questions] : [];

      const MAX_TOP_UPS = 3;
      for (let attempt = 0; attempt < MAX_TOP_UPS && questions.length < questionCount; attempt++) {
        try {
          const extra = await requestStart();
          const seen = new Set(questions.map((q) => String(q).trim().toLowerCase()));
          const fresh = (extra.data?.questions || []).filter((q) => !seen.has(String(q).trim().toLowerCase()));
          if (fresh.length === 0) break;
          questions = [...questions, ...fresh];
        } catch (topUpErr) {
          console.warn("Could not fetch additional questions:", topUpErr);
          break;
        }
      }

      // Navigate to room with generated questions
      navigate("/mock-interview-room", {
        state: {
          company: formData.company,
          role: formData.role,
          difficulty: formData.difficulty,
          interviewType: formData.interviewType,
          questionCount,
          questions: Array.isArray(questions) ? questions.slice(0, questionCount) : questions,
        },
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to generate interview. Is your Gemini API key set in the backend?"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { label: "Upload CV", done: !!formData.cv },
    { label: "Target role", done: !!formData.company.trim() && !!formData.role.trim() },
    { label: "Preferences", done: !!formData.difficulty && !!formData.interviewType },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  return (
    <div className="setup-page">
      <div className="setup-container">
        <button type="button" className="setup-back-btn" onClick={() => navigate(-1)} disabled={isSubmitting}>
          <FaArrowLeft /> Back
        </button>

        <div className="setup-header">
          <h1>
            <FaRobot className="icon-glow" /> AI Mock Interview Setup
          </h1>
          <p>Provide details to generate personalized interview questions based on your CV and target role.</p>
        </div>

        {/* Progress stepper */}
        <ol className="setup-stepper">
          {steps.map((s, i) => (
            <li
              key={s.label}
              className={`step ${s.done ? "done" : ""} ${i === currentStep ? "current" : ""}`}
            >
              <span className="step-dot">{s.done ? <FaCheckCircle /> : i + 1}</span>
              <span className="step-label">{s.label}</span>
            </li>
          ))}
        </ol>

        {error && (
          <div className="setup-error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <FaTimes />
            </button>
          </div>
        )}

        <form className="setup-form" onSubmit={handleSubmit}>
          {/* CV upload */}
          <div className="form-group">
            <label>
              <FaUpload /> Upload Resume / CV (PDF)
            </label>

            {formData.cv ? (
              <div className="file-selected">
                <span className="file-icon">
                  <FaFilePdf />
                </span>
                <div className="file-meta">
                  <strong title={formData.cv.name}>{formData.cv.name}</strong>
                  <span>{formatSize(formData.cv.size)} • Ready to upload</span>
                </div>
                <button
                  type="button"
                  className="file-remove"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                  aria-label="Remove file"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div
                className={`file-upload-box ${isDragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} id="cv-upload" />
                <label htmlFor="cv-upload" className="file-label">
                  <FaUpload className="upload-big-icon" />
                  <span>{isDragging ? "Drop your PDF here" : "Click to select a PDF file"}</span>
                  <small>or drag &amp; drop • PDF only, max {MAX_CV_SIZE_MB} MB</small>
                </label>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FaBuilding /> Target Company
              </label>
              <input
                type="text"
                name="company"
                placeholder="e.g. Google, Microsoft, Startup"
                value={formData.company}
                onChange={handleChange}
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaUserTie /> Job Role
              </label>
              <input
                type="text"
                name="role"
                placeholder="e.g. Frontend Developer, Data Scientist"
                value={formData.role}
                onChange={handleChange}
                maxLength={60}
                required
              />
            </div>
          </div>

          <div className="chip-suggestions">
            <span>Quick pick:</span>
            {ROLE_SUGGESTIONS.map((r) => (
              <button
                type="button"
                key={r}
                className={`suggest-chip ${formData.role === r ? "active" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, role: r }))}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label>
              <FaLayerGroup /> Difficulty Level
            </label>
            <div className="difficulty-options" role="radiogroup" aria-label="Difficulty level">
              {DIFFICULTIES.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  role="radio"
                  aria-checked={formData.difficulty === d.value}
                  className={`difficulty-card ${d.value.toLowerCase()} ${
                    formData.difficulty === d.value ? "selected" : ""
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, difficulty: d.value }))}
                >
                  <strong>{d.label}</strong>
                  <span>{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interview type */}
          <div className="form-group">
            <label>
              <FaClipboardList /> Interview Type
            </label>
            <div className="pill-options">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`pill ${formData.interviewType === t ? "selected" : ""}`}
                  onClick={() => setFormData((prev) => ({ ...prev, interviewType: t }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions (custom) */}
          <div className="form-group">
            <label>
              <FaListOl /> Number of Questions
            </label>

            <div className="count-control">
              <div className="count-stepper">
                <button
                  type="button"
                  className="count-btn"
                  onClick={() => stepCount(-1)}
                  disabled={clampCount(formData.questionCount) <= MIN_QUESTIONS && formData.questionCount !== ""}
                  aria-label="Decrease number of questions"
                >
                  <span aria-hidden="true">&minus;</span>
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="count-input"
                  value={formData.questionCount}
                  onChange={handleCountInput}
                  onBlur={handleCountBlur}
                  onFocus={(e) => e.target.select()}
                  aria-label="Number of questions"
                />

                <button
                  type="button"
                  className="count-btn"
                  onClick={() => stepCount(1)}
                  disabled={clampCount(formData.questionCount) >= MAX_QUESTIONS && formData.questionCount !== ""}
                  aria-label="Increase number of questions"
                >
                  <span aria-hidden="true">+</span>
                </button>
              </div>

              <div className="count-slider-wrap">
                <input
                  type="range"
                  className="count-slider"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  step={1}
                  value={clampCount(formData.questionCount)}
                  onChange={(e) => setCount(e.target.value)}
                  aria-label="Number of questions slider"
                  style={{
                    "--fill": `${
                      ((clampCount(formData.questionCount) - MIN_QUESTIONS) / (MAX_QUESTIONS - MIN_QUESTIONS)) * 100
                    }%`,
                  }}
                />
                <div className="count-scale">
                  <span>{MIN_QUESTIONS}</span>
                  <span>{MAX_QUESTIONS}</span>
                </div>
              </div>
            </div>

            <div className="count-quick">
              <span>Quick pick:</span>
              {QUICK_COUNTS.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`suggest-chip ${Number(formData.questionCount) === n ? "active" : ""}`}
                  onClick={() => setCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <span className="field-hint">
              Choose any number from {MIN_QUESTIONS} to {MAX_QUESTIONS} • Estimated duration: about{" "}
              {clampCount(formData.questionCount) * MINUTES_PER_QUESTION} min
            </span>
          </div>

          {/* Focus skills */}
          <div className="form-group">
            <label>
              <FaTags /> Focus Skills <span className="optional-tag">Optional</span>
            </label>
            <div className="tag-input-box">
              {skills.map((s) => (
                <span className="skill-tag" key={s}>
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                    aria-label={`Remove ${s}`}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => addSkill(skillInput)}
                placeholder={
                  skills.length >= MAX_SKILLS
                    ? "Maximum reached"
                    : skills.length
                    ? "Add another..."
                    : "e.g. React, Java, SQL — press Enter"
                }
                disabled={skills.length >= MAX_SKILLS}
              />
            </div>
            <span className="field-hint">
              {skills.length}/{MAX_SKILLS} skills • Press Enter or comma to add
            </span>
          </div>

          {/* Job description */}
          <div className="form-group">
            <label>
              <FaClipboardList /> Job Description <span className="optional-tag">Optional</span>
            </label>
            <textarea
              name="jobDescription"
              rows={4}
              maxLength={1500}
              placeholder="Paste the job description for even more tailored questions..."
              value={formData.jobDescription}
              onChange={handleChange}
            />
            <span className="field-hint right">{formData.jobDescription.length}/1500</span>
          </div>

          {/* Tips */}
          <div className="setup-tips">
            <div className="tips-title">
              <FaLightbulb /> Before you start
            </div>
            <ul>
              <li>
                <FaCamera /> Allow camera access when asked
              </li>
              <li>
                <FaMicrophone /> Use a quiet place with a working microphone
              </li>
              <li>
                <FaFilePdf /> Use an up-to-date, text-based PDF CV (not a scanned image)
              </li>
            </ul>
          </div>

          <button type="submit" className="btn-primary start-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FaSpinner className="spin" /> Generating Questions from CV...
              </>
            ) : (
              <>
                Configure Interview <FaArrowRight />
              </>
            )}
          </button>

          {isSubmitting && (
            <div className="loading-progress" aria-live="polite">
              <div className="loading-bar">
                <div
                  className="loading-bar-fill"
                  style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                ></div>
              </div>
              <span>{LOADING_STEPS[loadingStep]}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MockInterviewSetup;