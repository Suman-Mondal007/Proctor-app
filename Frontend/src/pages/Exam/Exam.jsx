import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaClock,
  FaShieldAlt,
  FaExclamationTriangle,
  FaBookmark,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaVideo,
  FaMicrophone,
  FaLayerGroup
} from "react-icons/fa";

import MobileDetection from "../../components/MobileDetection/MobileDetection";
import API from "../../services/api";
import Timer from "../../components/Timer/Timer";
import Webcam from "../../components/Webcam/Webcam";
import QuestionCard from "../../components/QuestionCard/QuestionCard";
import WarningPopup from "../../components/WarningPopup/WarningPopup";
import ExamPermission from "../../components/ExamPermission/ExamPermission";
import TabDetection from "../../components/TabDetection/TabDetection";

import { useViolation } from "../../context/ViolationContext";
import { useAuth } from "../../context/AuthContext";
import "./Exam.css";

function Exam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();
  const { user } = useAuth();
  const { addViolation, violations } = useViolation();

  const [examData, setExamData] = useState(location.state?.examData || null);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Synchronized warning counter
  const [violationCount, setViolationCount] = useState(0);

  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});

  const [warning, setWarning] = useState({
    show: false,
    message: ""
  });

  const [timeTaken, setTimeTaken] = useState(0);

  const warningTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const MAX_VIOLATIONS = 5;

  const normalizeQuestions = (rawQuestions) => {
    if (!Array.isArray(rawQuestions)) return [];

    return rawQuestions
      .map((q) => {
        if (typeof q === "string") return null;
        return {
          ...q,
          _id: q._id || q.id,
          questionText: q.question || q.questionText || q.title || q.statement || "",
          options: q.options || q.choices || q.answers || []
        };
      })
      .filter(Boolean);
  };

  // ============================
  // LOAD QUESTIONS & METADATA
  // ============================
  const fetchQuestions = async () => {
    try {
      setLoading(true);

      if (
        location.state?.examData?.questions &&
        Array.isArray(location.state.examData.questions) &&
        location.state.examData.questions.length > 0 &&
        typeof location.state.examData.questions[0] === "object"
      ) {
        setExamData(location.state.examData);
        setQuestions(normalizeQuestions(location.state.examData.questions));
        return;
      }

      let examResponseData = null;
      let rawQuestions = [];

      try {
        const res = await API.get(`/exams/${examId}`);
        examResponseData = res.data;
        rawQuestions = res.data.questions || [];
      } catch (err) {
        console.warn("API GET /exams/:id fallback...");
      }

      if (!examResponseData || rawQuestions.length === 0) {
        try {
          const res = await API.get(`/question-sets/${examId}`);
          examResponseData = res.data;
          rawQuestions = res.data.questions || [];
        } catch (err) {
          console.warn("API GET /question-sets/:id fallback...");
        }
      }

      if (rawQuestions.length === 0 || (rawQuestions.length > 0 && typeof rawQuestions[0] === "string")) {
        try {
          const qRes = await API.get("/questions");
          const allGlobalQuestions = qRes.data?.data || qRes.data || [];
          if (Array.isArray(allGlobalQuestions) && allGlobalQuestions.length > 0) {
            rawQuestions = allGlobalQuestions;
          }
        } catch (err) {
          console.error("Global questions fallback failed:", err);
        }
      }

      setExamData(examResponseData || { title: "Technical Assessment", duration: 60 });
      setQuestions(normalizeQuestions(rawQuestions));
    } catch (error) {
      console.error("EXAM FETCH ERROR:", error);
      alert("Unable to load exam questions. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started && examId) {
      fetchQuestions();
    }
  }, [started, examId]);

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  // ============================
  // SUBMIT EXAM & FORCE DASHBOARD REDIRECT
  // ============================
  const submitExam = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const candidateId = user?._id || user?.id || "anonymous";

    const formattedAnswers = Object.keys(answers).map((index) => ({
      questionId: questions[index]?._id,
      selectedAnswer: answers[index],
      correctAnswer: questions[index]?.correctAnswer,
      isCorrect: answers[index] === questions[index]?.correctAnswer
    }));

    try {
      await API.post("/results", {
        candidate: candidateId,
        examId: examId,
        totalQuestions: questions.length,
        answers: formattedAnswers,
        violations: violations.map((v) => ({
          type: v.type || "GENERAL",
          message: v.message || String(v)
        })),
        duration: timeTaken
      });
    } catch (error) {
      console.error("API submission error (redirecting anyway):", error);
    } finally {
      // Guaranteed redirect regardless of API result
      alert("Assessment session ended. Redirecting to Dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [user, answers, questions, examId, violations, timeTaken, navigate]);

  // ============================
  // AUTO SUBMIT TRIGGER AT THRESHOLD (5)
  // ============================
  useEffect(() => {
    if (violationCount >= MAX_VIOLATIONS && !isSubmittingRef.current) {
      submitExam();
    }
  }, [violationCount, submitExam]);

  // ============================
  // CENTRAL WARNING DISPATCHER (CAP AT 5)
  // ============================
  const showWarning = useCallback((message, type) => {
    if (isSubmittingRef.current) return; // Prevent new warnings while submitting

    addViolation(type, message);

    setViolationCount((prevCount) => {
      if (prevCount >= MAX_VIOLATIONS) return prevCount; // Lock at MAX_VIOLATIONS
      const newCount = prevCount + 1;

      setWarning({
        show: true,
        message: `${message} (Warning ${newCount}/${MAX_VIOLATIONS})`
      });

      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }

      warningTimerRef.current = setTimeout(() => {
        setWarning({
          show: false,
          message: ""
        });
      }, 3000);

      return newCount;
    });
  }, [addViolation]);

  const selectAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };

  const toggleFlag = (index) => {
    setFlagged((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // Permission Screen
  if (!started) {
    return (
      <>
        <MobileDetection onWarning={showWarning} />
        <ExamPermission
          onSuccess={() => {
            setStarted(true);
          }}
        />
        <WarningPopup
          show={warning.show}
          message={warning.message}
          type="warning"
          onClose={() => setWarning({ show: false, message: "" })}
        />
      </>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="exam-loading-screen">
        <div className="spinner"></div>
        <h2>Initializing Secure Exam Environment...</h2>
        <p>Loading questions, encryption keys, and proctoring telemetry.</p>
      </div>
    );
  }

  // Fallback for Empty Questions
  if (questions.length === 0) {
    return (
      <div className="exam-empty-screen">
        <FaExclamationTriangle className="warn-icon" />
        <h2>No Assessment Questions Available</h2>
        <p>The exam package contains no questions or failed to render.</p>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          Return to Portal
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="exam-page">
      {/* Active Detector Components */}
      <TabDetection onViolation={(msg) => showWarning(msg, "TAB_SWITCH")} />
      <MobileDetection onWarning={showWarning} />

      {/* Top Telemetry Header */}
      <header className="exam-top-bar">
        <div className="bar-brand">
          <span className="live-badge">
            <span className="pulse-dot"></span> PROCTORED SESSION
          </span>
          <h1>{examData?.title || examData?.examTitle || "Technical Assessment"}</h1>
        </div>

        <div className="bar-center">
          <div className="progress-container">
            <div className="progress-label">
              <span>Overall Progress</span>
              <strong>{answeredCount} / {questions.length} Answered ({progressPercent}%)</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bar-timer">
          <FaClock className="timer-icon" />
          <Timer
            initialTime={
              examData?.duration ? examData.duration * 60 : 3600
            }
            onTimeUp={submitExam}
            onTick={(time) => setTimeTaken(time)}
          />
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="exam-workspace">
        {/* Left Column: Question Workspace */}
        <div className="question-workspace">
          <div className="workspace-header">
            <span className="q-badge">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <button
              className={`flag-btn ${flagged[currentQuestion] ? "active" : ""}`}
              onClick={() => toggleFlag(currentQuestion)}
            >
              <FaBookmark /> {flagged[currentQuestion] ? "Bookmarked" : "Bookmark Question"}
            </button>
          </div>

          <QuestionCard
            questionNumber={currentQuestion + 1}
            question={
              questions[currentQuestion]?.questionText ||
              questions[currentQuestion]?.question
            }
            options={questions[currentQuestion]?.options || []}
            selectedAnswer={answers[currentQuestion]}
            setSelectedAnswer={selectAnswer}
          />

          {/* Action Navigation Footer */}
          <div className="question-actions">
            <button
              className="action-btn prev-btn"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
            >
              <FaArrowLeft /> Previous
            </button>

            <div className="action-right">
              {currentQuestion === questions.length - 1 ? (
                <button className="action-btn submit-btn" onClick={submitExam}>
                  <FaCheckCircle /> Finalize & Submit
                </button>
              ) : (
                <button className="action-btn next-btn" onClick={nextQuestion}>
                  Next Question <FaArrowRight />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Proctoring Panel */}
        <div className="proctor-side-panel">
          <div className="panel-card webcam-card">
            <div className="card-header">
              <h3>
                <FaShieldAlt className="shield-icon" /> Active Video Stream
              </h3>
              <div className="status-indicators">
                <FaVideo className="stream-icon pass" />
                <FaMicrophone className="stream-icon pass" />
              </div>
            </div>

            <div className="webcam-viewport">
              <Webcam onWarning={(msg, type) => showWarning(msg, type)} />
            </div>

            <div className={`violation-meter ${violationCount > 0 ? "has-violations" : ""}`}>
              <div className="meter-info">
                <span>Violation Telemetry Flags:</span>
                <strong>{violationCount} / {MAX_VIOLATIONS} Warning(s)</strong>
              </div>
              <div className="meter-bar-bg">
                <div
                  className="meter-bar-fill"
                  style={{ width: `${Math.min((violationCount / MAX_VIOLATIONS) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question Matrix */}
          <div className="panel-card matrix-card">
            <div className="card-header">
              <h3>
                <FaLayerGroup /> Question Matrix
              </h3>
            </div>

            <div className="question-matrix">
              {questions.map((_, index) => {
                const isAnswered = answers.hasOwnProperty(index);
                const isCurrent = index === currentQuestion;
                const isFlagged = flagged[index];

                let statusClass = "unanswered";
                if (isCurrent) statusClass = "active";
                else if (isAnswered) statusClass = "answered";

                return (
                  <button
                    key={index}
                    className={`matrix-node ${statusClass} ${isFlagged ? "flagged" : ""}`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                    {isFlagged && <span className="flag-dot"></span>}
                  </button>
                );
              })}
            </div>

            <div className="matrix-legend">
              <div className="legend-item">
                <span className="dot current"></span> Active
              </div>
              <div className="legend-item">
                <span className="dot answered"></span> Answered
              </div>
              <div className="legend-item">
                <span className="dot unanswered"></span> Pending
              </div>
              <div className="legend-item">
                <span className="dot flagged"></span> Bookmarked
              </div>
            </div>

            <button className="btn-finish-sidebar" onClick={submitExam}>
              Submit Assessment
            </button>
          </div>
        </div>
      </div>

      <WarningPopup
        show={warning.show}
        message={warning.message}
        type="warning"
        onClose={() => setWarning({ show: false, message: "" })}
      />
    </div>
  );
}

export default Exam;