import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaRobot,
  FaCheckCircle,
  FaSpinner,
  FaMicrophone,
  FaMicrophoneSlash,
  FaThumbsUp,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaVideo,
  FaVideoSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaRedo,
  FaClock,
  FaForward,
  FaSignOutAlt,
  FaDownload,
  FaArrowRight,
  FaEraser,
  FaListUl,
  FaLightbulb,
  FaHome,
  FaSyncAlt,
} from "react-icons/fa";
import API from "../../services/api";
import "./MockInterviewRoom.css";

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const hasScore = (s) => s !== null && s !== undefined;

const scoreClass = (s) => (s >= 70 ? "sc-good" : s >= 45 ? "sc-average" : "sc-poor");

const scoreLabel = (s) => (s >= 80 ? "Excellent" : s >= 70 ? "Good" : s >= 45 ? "Average" : "Needs Work");

const ACCENTS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-GB", label: "English (UK)" },
];

// ─── Structured Feedback Renderer ──────────────────────────────────────────
const ScoreBar = ({ label, score }) => {
  if (!hasScore(score)) return null;
  return (
    <div className="score-bar-row">
      <div className="score-bar-head">
        <span>{label}</span>
        <strong className={scoreClass(score)}>{score}/100</strong>
      </div>
      <div className="score-bar-bg">
        <div className={`score-bar-fill ${scoreClass(score)}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
};

const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  return (
    <div className="score-ring">
      <svg viewBox="0 0 130 130" width="150" height="150">
        <circle className="ring-bg" cx="65" cy="65" r={radius} />
        <circle
          className={`ring-fill ${scoreClass(score)}`}
          cx="65"
          cy="65"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
        />
      </svg>
      <div className="ring-center">
        <span className={`ring-value ${scoreClass(score)}`}>{score}</span>
        <span className="ring-max">/100</span>
      </div>
    </div>
  );
};

const FeedbackReport = ({ feedback, questions = [], answers = [] }) => {
  if (!feedback) return null;

  // Legacy: plain string
  if (typeof feedback === "string") {
    return (
      <div className="feedback-box">
        <h3>AI Analysis & Feedback</h3>
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{feedback}</p>
      </div>
    );
  }

  const {
    overallFeedback,
    strengths = [],
    improvements = [],
    technicalScore,
    communicationScore,
    confidenceScore,
    overallScore,
  } = feedback;

  return (
    <div className="feedback-report">
      {/* Overall Score */}
      {hasScore(overallScore) && (
        <div className="overall-score-block">
          <ScoreRing score={overallScore} />
          <div className="overall-meta">
            <span className={`rating-pill ${scoreClass(overallScore)}`}>{scoreLabel(overallScore)}</span>
            <div className="overall-label">Overall Score</div>
          </div>
        </div>
      )}

      {/* Summary */}
      {overallFeedback && (
        <div className="feedback-box">
          <h3>Overall Assessment</h3>
          <p>{overallFeedback}</p>
        </div>
      )}

      {/* Score Bars */}
      {(hasScore(technicalScore) || hasScore(communicationScore) || hasScore(confidenceScore)) && (
        <div className="feedback-box">
          <h3>Score Breakdown</h3>
          <ScoreBar label="Technical Knowledge" score={technicalScore} />
          <ScoreBar label="Communication" score={communicationScore} />
          <ScoreBar label="Confidence" score={confidenceScore} />
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="feedback-box accent-green">
          <h3 className="green">
            <FaThumbsUp /> Strengths
          </h3>
          <ul>
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <div className="feedback-box accent-amber">
          <h3 className="amber">
            <FaExclamationCircle /> Areas to Improve
          </h3>
          <ul>
            {improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Question-by-question review */}
      {questions.length > 0 && (
        <div className="feedback-box">
          <h3>
            <FaListUl /> Question Review
          </h3>
          <div className="review-list">
            {questions.map((q, i) => (
              <details className="review-item" key={i}>
                <summary>
                  <span className="review-num">Q{i + 1}</span>
                  <span className="review-q">{q}</span>
                </summary>
                <div className="review-answer">
                  <strong>Your answer</strong>
                  <p>{answers[i] && answers[i].trim() ? answers[i] : "No answer recorded."}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Interview Room ─────────────────────────────────────────────────────
const MockInterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { company, role, difficulty, questions: rawQuestions, interviewType, questionCount } = location.state || {};

  // Use exactly the number of questions chosen on the setup page
  // (the backend may return more than requested)
  const requestedCount = parseInt(questionCount, 10);
  const questions = useMemo(() => {
    if (!Array.isArray(rawQuestions)) return rawQuestions;
    return requestedCount > 0 ? rawQuestions.slice(0, requestedCount) : rawQuestions;
  }, [rawQuestions, requestedCount]);

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);

  const [userAnswers, setUserAnswers] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [analysisFailed, setAnalysisFailed] = useState(false);

  // New professional features
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [accent, setAccent] = useState("en-US");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [notice, setNotice] = useState("");

  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef("");
  const answersRef = useRef([]);
  const voiceEnabledRef = useRef(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const noticeTimer = useRef(null);

  const totalQuestions = questions?.length || 0;

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate("/mock-interview-setup");
    }
  }, [questions, navigate]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const showNotice = useCallback((text) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  }, []);

  // ── Speech recognition setup ──
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        // keep anything already captured / typed before this recording session
        const base = baseTranscriptRef.current;
        setCurrentTranscript((base ? base + " " : "") + transcript.trim() + " ");
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          showNotice("Microphone permission was denied. Allow mic access or type your answer instead.");
        }
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearTimeout(noticeTimer.current);
    };
  }, [showNotice]);

  // Keep recognition language in sync with the accent selector
  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = accent;
  }, [accent]);

  // ── Interview timers ──
  useEffect(() => {
    if (!interviewStarted || interviewEnded) return undefined;
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
      setQuestionElapsed((q) => q + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [interviewStarted, interviewEnded]);

  // ── Warn before accidentally closing the tab mid-interview ──
  useEffect(() => {
    if (!interviewStarted || interviewEnded) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [interviewStarted, interviewEnded]);

  // ── Attach camera stream to the <video> element whenever it mounts ──
  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraOn) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn, interviewStarted, interviewEnded]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
      return;
    }
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera unavailable or permission denied.");
    }
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window && voiceEnabledRef.current) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.lang = "en-US";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop the AI voice so the mic doesn't pick it up
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      baseTranscriptRef.current = currentTranscript.trim(); // resume — don't wipe earlier speech
      try {
        recognitionRef.current.lang = accent;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    }
  };

  const clearTranscript = () => {
    if (isListening) recognitionRef.current?.stop();
    baseTranscriptRef.current = "";
    setCurrentTranscript("");
  };

  const handleTranscriptEdit = (e) => {
    setCurrentTranscript(e.target.value);
    baseTranscriptRef.current = e.target.value.trim();
  };

  const startInterview = () => {
    setInterviewStarted(true);
    if (questions?.length > 0) speakText(questions[0]);
  };

  const replayQuestion = () => {
    if (!voiceEnabled) setVoiceEnabled(true);
    speakText(questions[currentQuestionIndex]);
    voiceEnabledRef.current = true;
  };

  const goToNext = (answerText) => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const newAnswers = [...userAnswers, answerText];
    setUserAnswers(newAnswers);
    answersRef.current = newAnswers;
    setCurrentTranscript("");
    baseTranscriptRef.current = "";
    setQuestionElapsed(0);

    if (currentQuestionIndex >= questions.length - 1) {
      endInterview(newAnswers);
    } else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      speakText(questions[nextIndex]);
    }
  };

  const submitAnswer = () => goToNext(currentTranscript);

  const skipQuestion = () => goToNext("");

  const endInterview = async (finalAnswers) => {
    setInterviewEnded(true);
    setIsAnalyzing(true);
    setAnalysisFailed(false);
    stopCamera();
    speakText("Interview completed. Please wait while I analyze your answers.");

    try {
      const response = await API.post("/mock-interview/analyze", {
        questions,
        answers: finalAnswers,
        role,
        difficulty,
      });
      // response.data.feedback is a structured object
      setFeedback(response.data.feedback);
      speakText("Analysis complete. Here is your feedback.");
    } catch (err) {
      console.error(err);
      setAnalysisFailed(true);
      setFeedback("Sorry, an error occurred while analyzing your responses.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retryAnalysis = () => endInterview(answersRef.current);

  const confirmExit = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    stopCamera();
    navigate("/dashboard");
  };

  const downloadReport = () => {
    const lines = [];
    lines.push("AI MOCK INTERVIEW REPORT");
    lines.push("=".repeat(40));
    lines.push(`Role: ${role || "-"}`);
    lines.push(`Company: ${company || "-"}`);
    lines.push(`Difficulty: ${difficulty || "-"}`);
    if (interviewType) lines.push(`Type: ${interviewType}`);
    lines.push(`Duration: ${formatTime(elapsed)}`);
    lines.push(`Date: ${new Date().toLocaleString()}`);
    lines.push("");

    if (feedback && typeof feedback === "object") {
      if (hasScore(feedback.overallScore)) lines.push(`Overall Score: ${feedback.overallScore}/100`);
      if (hasScore(feedback.technicalScore)) lines.push(`Technical: ${feedback.technicalScore}/100`);
      if (hasScore(feedback.communicationScore)) lines.push(`Communication: ${feedback.communicationScore}/100`);
      if (hasScore(feedback.confidenceScore)) lines.push(`Confidence: ${feedback.confidenceScore}/100`);
      lines.push("");
      if (feedback.overallFeedback) {
        lines.push("Overall Assessment:");
        lines.push(feedback.overallFeedback);
        lines.push("");
      }
      if (feedback.strengths?.length) {
        lines.push("Strengths:");
        feedback.strengths.forEach((s) => lines.push(` - ${s}`));
        lines.push("");
      }
      if (feedback.improvements?.length) {
        lines.push("Areas to Improve:");
        feedback.improvements.forEach((s) => lines.push(` - ${s}`));
        lines.push("");
      }
    } else if (typeof feedback === "string") {
      lines.push(feedback, "");
    }

    lines.push("QUESTIONS & ANSWERS");
    lines.push("-".repeat(40));
    (questions || []).forEach((q, i) => {
      lines.push(`Q${i + 1}. ${q}`);
      lines.push(`A: ${answersRef.current[i] && answersRef.current[i].trim() ? answersRef.current[i].trim() : "No answer recorded."}`);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-interview-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ctrl/Cmd + Enter submits the current answer
  useEffect(() => {
    if (!interviewStarted || interviewEnded) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (currentTranscript.trim() || isListening) {
          e.preventDefault();
          submitAnswer();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStarted, interviewEnded, currentTranscript, isListening, currentQuestionIndex, userAnswers]);

  if (!questions) return null;

  const wordCount = countWords(currentTranscript);
  const progressPercent = interviewStarted ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const estimatedMinutes = totalQuestions * 2;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  // ── Feedback / End Screen ────────────────────────────────────────────────
  if (interviewEnded) {
    return (
      <div className="room-page ended-state">
        <div className="room-panel room-center report-panel">
          {isAnalyzing ? (
            <div className="analyzing-block">
              <FaSpinner className="spinner-icon room-spin" />
              <h2>AI is analyzing your responses...</h2>
              <p className="room-muted">Evaluating your technical skills and communication.</p>
              <div className="analyzing-steps">
                <span>Reviewing answers</span>
                <span>Scoring skills</span>
                <span>Writing feedback</span>
              </div>
            </div>
          ) : (
            <>
              <FaCheckCircle className={`success-icon ${analysisFailed ? "failed" : ""}`} />
              <h2>{analysisFailed ? "Interview Completed" : "Interview Completed!"}</h2>

              <div className="session-summary">
                <div>
                  <span>Role</span>
                  <strong>{role || "-"}</strong>
                </div>
                <div>
                  <span>Questions</span>
                  <strong>{totalQuestions}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{formatTime(elapsed)}</strong>
                </div>
                <div>
                  <span>Level</span>
                  <strong>{difficulty || "-"}</strong>
                </div>
              </div>

              <FeedbackReport feedback={feedback} questions={questions} answers={answersRef.current} />

              <div className="report-actions">
                {analysisFailed && (
                  <button className="btn-secondary" onClick={retryAnalysis}>
                    <FaSyncAlt /> Retry Analysis
                  </button>
                )}
                <button className="btn-secondary" onClick={downloadReport}>
                  <FaDownload /> Download Report
                </button>
                <button className="btn-secondary" onClick={() => navigate("/mock-interview-setup")}>
                  <FaRedo /> New Interview
                </button>
                <button className="btn-primary" onClick={() => navigate("/dashboard")}>
                  <FaHome /> Return to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Interview Room ───────────────────────────────────────────────────────
  return (
    <div className="room-page">
      <div className="room-header">
        <div className="room-brand">
          <FaRobot className="robot-icon" /> AI Voice Interviewer
        </div>
        <div className="meta-info">
          <span className="room-badge">
            {role} @ {company}
          </span>
          <span className="room-badge difficulty">{difficulty}</span>
          {interviewType && <span className="room-badge type">{interviewType}</span>}
          {interviewStarted && (
            <span className="room-badge timer" title="Total elapsed time">
              <FaClock /> {formatTime(elapsed)}
            </span>
          )}
          <button className="exit-btn" onClick={() => setShowExitModal(true)}>
            <FaSignOutAlt /> Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {interviewStarted && (
        <div className="room-progress" aria-label="Interview progress">
          <div className="room-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {notice && (
        <div className="room-notice" role="alert">
          <FaExclamationTriangle /> {notice}
        </div>
      )}

      <div className="main-content center-content">
        {!interviewStarted ? (
          /* ───────── Pre-interview lobby ───────── */
          <div className="ai-section room-panel">
            <div className="start-prompt">
              <div className="ai-avatar large">
                <FaRobot />
              </div>
              <h2>Ready to begin?</h2>
              <p>
                The AI will ask you questions based on your CV using voice. Click the microphone button to record
                your spoken answers.
              </p>

              <div className="lobby-stats">
                <div>
                  <strong>{totalQuestions || questionCount}</strong>
                  <span>Questions</span>
                </div>
                <div>
                  <strong>~{estimatedMinutes} min</strong>
                  <span>Estimated time</span>
                </div>
                <div>
                  <strong>{interviewType || "Mixed"}</strong>
                  <span>Interview type</span>
                </div>
              </div>

              {requestedCount > 0 && Array.isArray(questions) && questions.length < requestedCount && (
                <div className="count-note">
                  <FaExclamationTriangle />
                  <span>
                    You requested {requestedCount} questions, but only {questions.length} could be generated for this
                    CV and role.
                  </span>
                </div>
              )}

              <div className="readiness-card">
                <h4>System readiness</h4>
                <ul>
                  <li className={speechSupported ? "ok" : "bad"}>
                    {speechSupported ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {speechSupported
                      ? "Speech recognition supported"
                      : "Speech recognition not supported — use Google Chrome, or type your answers"}
                  </li>
                  <li className={"speechSynthesis" in window ? "ok" : "bad"}>
                    {"speechSynthesis" in window ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {"speechSynthesis" in window ? "AI voice available" : "AI voice not available in this browser"}
                  </li>
                  <li className={cameraOn ? "ok" : "neutral"}>
                    {cameraOn ? <FaCheckCircle /> : <FaVideo />}
                    {cameraOn ? "Camera preview on" : "Camera preview (optional)"}
                    <button type="button" className="inline-link" onClick={toggleCamera}>
                      {cameraOn ? "Turn off" : "Turn on"}
                    </button>
                  </li>
                </ul>
                {cameraError && <p className="field-error">{cameraError}</p>}

                {cameraOn && (
                  <div className="lobby-video">
                    <video ref={videoRef} autoPlay muted playsInline />
                  </div>
                )}

                <div className="accent-row">
                  <label htmlFor="accent-select">Speaking accent</label>
                  <select id="accent-select" value={accent} onChange={(e) => setAccent(e.target.value)}>
                    {ACCENTS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lobby-tips">
                <FaLightbulb />
                <span>Tip: structure answers with context, action and result, and aim for 30–90 seconds each.</span>
              </div>

              <button className="btn-primary start-room-btn" onClick={startInterview}>
                Start Interview Now <FaArrowRight />
              </button>
            </div>
          </div>
        ) : (
          /* ───────── Live interview ───────── */
          <div className="interview-layout">
            <div className="ai-section room-panel">
              <div className="question-prompt">
                <div className="question-header">
                  <h3>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </h3>
                  <div className="question-tools">
                    <span className="q-timer" title="Time on this question">
                      <FaClock /> {formatTime(questionElapsed)}
                    </span>
                    <button
                      className={`icon-btn ${voiceEnabled ? "" : "off"}`}
                      onClick={() => setVoiceEnabled((v) => !v)}
                      title={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
                    >
                      {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                    </button>
                    <button className="icon-btn" onClick={replayQuestion} title="Replay question">
                      <FaRedo />
                    </button>
                  </div>
                </div>

                <div className="interviewer-row">
                  <div className={`ai-avatar ${isSpeaking ? "speaking" : ""}`}>
                    <FaRobot />
                  </div>
                  <span className="interviewer-status">{isSpeaking ? "AI is speaking..." : "AI Interviewer"}</span>
                  {isSpeaking && (
                    <span className="sound-bars" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                  )}
                </div>

                <div className="question-box">
                  <p className="actual-question">"{questions[currentQuestionIndex]}"</p>
                </div>

                <div className="voice-answer-section">
                  <p className="voice-hint">
                    {isListening
                      ? "Listening... Speak your answer."
                      : speechSupported
                      ? "Click microphone to start answering."
                      : "Speech recognition isn't available — type your answer below."}
                  </p>
                  <button
                    onClick={toggleListening}
                    className={`mic-btn ${isListening ? "listening" : ""}`}
                    title={isListening ? "Stop Listening" : "Start Listening"}
                    disabled={!speechSupported}
                  >
                    {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  </button>
                </div>

                <div className="transcript-box">
                  <div className="transcript-head">
                    <strong>{isListening ? "Live transcription" : "Your answer"}</strong>
                    <div className="transcript-tools">
                      <span className="word-count">{wordCount} words</span>
                      {currentTranscript && (
                        <button type="button" className="inline-link" onClick={clearTranscript}>
                          <FaEraser /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={currentTranscript}
                    onChange={handleTranscriptEdit}
                    readOnly={isListening}
                    rows={4}
                    placeholder={
                      speechSupported
                        ? "Your spoken answer will appear here. You can also edit or type it."
                        : "Type your answer here..."
                    }
                  />
                  {wordCount > 0 && wordCount < 15 && !isListening && (
                    <span className="short-warning">Tip: try to give a more detailed answer.</span>
                  )}
                </div>

                <div className="action-footer">
                  <button
                    type="button"
                    className="skip-btn"
                    onClick={skipQuestion}
                    title="Skip this question (no answer recorded)"
                  >
                    <FaForward /> Skip
                  </button>
                  <button
                    className="btn-primary submit-btn"
                    onClick={submitAnswer}
                    disabled={!currentTranscript.trim() && !isListening}
                  >
                    {isLastQuestion ? "Finish Interview" : "Submit Answer & Next"}
                  </button>
                </div>
                <p className="shortcut-hint">Press Ctrl + Enter to submit</p>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="room-sidebar">
              <div className="side-card">
                <div className="side-card-head">
                  <h4>Camera</h4>
                  <button className="icon-btn small" onClick={toggleCamera} title="Toggle camera">
                    {cameraOn ? <FaVideo /> : <FaVideoSlash />}
                  </button>
                </div>
                {cameraOn ? (
                  <div className="self-view">
                    <video ref={videoRef} autoPlay muted playsInline />
                  </div>
                ) : (
                  <div className="self-view placeholder">
                    <FaVideoSlash />
                    <span>{cameraError || "Camera off"}</span>
                  </div>
                )}
              </div>

              <div className="side-card">
                <h4>Progress</h4>
                <ol className="question-dots">
                  {questions.map((_, i) => (
                    <li
                      key={i}
                      className={i < currentQuestionIndex ? "done" : i === currentQuestionIndex ? "current" : ""}
                    >
                      {i < currentQuestionIndex ? <FaCheckCircle /> : i + 1}
                    </li>
                  ))}
                </ol>
                <div className="side-stat">
                  <span>Answered</span>
                  <strong>
                    {userAnswers.filter((a) => a && a.trim()).length}/{totalQuestions}
                  </strong>
                </div>
              </div>

              <div className="side-card">
                <h4>Quick tips</h4>
                <ul className="tip-list">
                  <li>Speak clearly and at a steady pace.</li>
                  <li>Use real examples from your experience.</li>
                  <li>You can edit the transcript before submitting.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="room-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowExitModal(false)}>
          <div className="room-modal" role="dialog" aria-modal="true">
            <div className="modal-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Leave this interview?</h3>
            <p>
              {interviewStarted
                ? "Your progress will be lost and no feedback will be generated."
                : "You haven't started yet. You can come back any time."}
            </p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setShowExitModal(false)}>
                Stay
              </button>
              <button className="btn-danger" onClick={confirmExit}>
                Leave Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewRoom;
