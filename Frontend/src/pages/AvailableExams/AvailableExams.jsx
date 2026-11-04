import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaClipboardList,
  FaArrowLeft,
  FaLayerGroup,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaUserShield,
  FaSyncAlt,
  FaTimes,
  FaQuestionCircle,
  FaSortAmountDown,
  FaCamera,
  FaWifi,
  FaIdCard,
  FaHome,
} from "react-icons/fa";
import { getAllExams } from "../../services/examService";
import API from "../../services/api"; // API instance for fallback question fetching
import ExamCard from "../../components/ExamCard/ExamCard";
import "./AvailableExams.css";

const getExamId = (exam) => exam._id || exam.id;
const getExamTitle = (exam) => exam.title || exam.examTitle || "";
const getExamCategory = (exam) => exam.category || exam.subject || "";

function AvailableExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const toastTimer = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(toastTimer.current);
    };
  }, []);

  // Debounce search input (keeps filtering smooth on large lists)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 200);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const showToast = useCallback((message, type = "warning") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchExams = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      // 1. Primary Attempt: Fetch via examService
      const res = await getAllExams().catch(() => null);
      let rawData = res?.data || res || [];

      // 2. Fallback Attempt: If examService returns empty, try direct /question-sets
      if (!Array.isArray(rawData) || rawData.length === 0) {
        const setsRes = await API.get("/question-sets").catch(() => null);
        rawData = setsRes?.data || [];
      }

      if (!Array.isArray(rawData)) rawData = [];

      // Filter out unpublished sets if the backend hasn't already filtered them
      const activeData = rawData.filter((item) => item.isActive !== false);

      // Global questions are fetched at most once (not once per exam)
      let globalQuestionsPromise = null;
      const getGlobalQuestions = () => {
        if (!globalQuestionsPromise) {
          globalQuestionsPromise = API.get("/questions")
            .then((r) => r?.data?.data || r?.data || [])
            .catch(() => []);
        }
        return globalQuestionsPromise;
      };

      // 3. Hydrate/Verify questions for each set/exam
      const enrichedExams = await Promise.all(
        activeData.map(async (exam) => {
          let questions = exam.questions || [];

          // If questions is missing or only contains String ObjectIds, fetch detail
          if (questions.length === 0 || typeof questions[0] === "string") {
            try {
              const examId = getExamId(exam);
              const detailRes = await API.get(`/question-sets/${examId}`).catch(() => null);
              if (detailRes?.data?.questions) {
                questions = detailRes.data.questions;
              } else {
                // If question set has no questions attached, fall back to global active questions
                const allQuestions = await getGlobalQuestions();
                if (Array.isArray(allQuestions) && allQuestions.length > 0) {
                  questions = allQuestions;
                }
              }
            } catch (e) {
              console.error("Error hydrating questions for exam:", getExamId(exam), e);
            }
          }

          return {
            ...exam,
            questionsCount: questions.length,
            questions,
          };
        })
      );

      if (!isMounted.current) return;
      setExams(enrichedExams);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("EXAM FETCH ERROR:", err);
      if (!isMounted.current) return;
      setExams([]);
      setError("We couldn't load the examinations. Please check your connection and try again.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const startExam = (exam) => {
    // Check if questions exist before navigating
    if (!exam.questions || exam.questions.length === 0) {
      showToast(
        "This exam set currently has no questions assigned or published by the administrator.",
        "warning"
      );
      return;
    }
    navigate(`/exam/${getExamId(exam)}`, { state: { examData: exam } });
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  // Derive unique categories (with counts) dynamically from exams
  const categoryCounts = useMemo(() => {
    const counts = {};
    exams.forEach((e) => {
      const c = getExamCategory(e);
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const categories = useMemo(() => ["all", ...Object.keys(categoryCounts)], [categoryCounts]);

  // Filtering + sorting
  const filteredExams = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    const list = exams.filter((exam) => {
      const titleMatch = getExamTitle(exam).toLowerCase().includes(term);
      const topicMatch = (exam.description || "").toLowerCase().includes(term);
      const categoryMatch = selectedCategory === "all" || getExamCategory(exam) === selectedCategory;
      return (titleMatch || topicMatch) && categoryMatch;
    });

    if (sortBy === "title") {
      list.sort((a, b) => getExamTitle(a).localeCompare(getExamTitle(b)));
    } else if (sortBy === "questions") {
      list.sort((a, b) => (b.questionsCount || 0) - (a.questionsCount || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [exams, debouncedSearch, selectedCategory, sortBy]);

  const totalQuestions = useMemo(
    () => exams.reduce((sum, e) => sum + (e.questionsCount || 0), 0),
    [exams]
  );
  const hasFilters = searchTerm !== "" || selectedCategory !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("all");
  };

  return (
    <div className="available-exams-page">
      <div className="ambient-glow"></div>

      {/* Top bar (consistent with dashboard full-width shell) */}
      <nav className="page-topbar">
        <div className="page-topbar-inner">
          <div className="topbar-brand" onClick={() => navigate("/dashboard")}>
            <span className="topbar-logo">
              <FaUserShield />
            </span>
            <span>
              Proctor<strong>Portal</strong>
            </span>
          </div>
          <div className="topbar-right">
            <Link to="/dashboard" className="topbar-link">
              <FaHome /> Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="available-exams-container">
        {/* Navigation & Header Section */}
        <header className="page-header">
          <button className="back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back to Dashboard
          </button>

          <div className="header-row">
            <div className="header-title-block">
              <span className="badge">
                <FaClipboardList /> Assessment Portal
              </span>
              <h1>Available Examinations</h1>
              <p className="subtitle">
                Select an active assessment below to evaluate your technical competencies under proctored
                supervision.
              </p>
            </div>

            <button
              className="refresh-btn"
              onClick={() => fetchExams(true)}
              disabled={loading || refreshing}
              title="Refresh exam list"
            >
              <FaSyncAlt className={refreshing ? "spinning" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Summary stats */}
        {!loading && !error && exams.length > 0 && (
          <div className="stats-strip">
            <div className="stat-tile">
              <span className="stat-icon blue">
                <FaClipboardList />
              </span>
              <div>
                <strong>{exams.length}</strong>
                <span>Active exams</span>
              </div>
            </div>
            <div className="stat-tile">
              <span className="stat-icon purple">
                <FaQuestionCircle />
              </span>
              <div>
                <strong>{totalQuestions}</strong>
                <span>Total questions</span>
              </div>
            </div>
            <div className="stat-tile">
              <span className="stat-icon green">
                <FaLayerGroup />
              </span>
              <div>
                <strong>{Object.keys(categoryCounts).length || 1}</strong>
                <span>Categories</span>
              </div>
            </div>
          </div>
        )}

        {/* Pre-exam reminder */}
        <div className="info-banner">
          <div className="info-title">
            <FaExclamationTriangle /> Before you begin
          </div>
          <ul>
            <li>
              <FaCamera /> Allow camera &amp; microphone access
            </li>
            <li>
              <FaWifi /> Use a stable internet connection
            </li>
            <li>
              <FaIdCard /> Keep a valid photo ID nearby
            </li>
          </ul>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search exams by title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search exams"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="toolbar-right">
            {categories.length > 1 && (
              <div className="category-filters">
                <FaLayerGroup className="filter-icon" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-chip ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <span className="chip-count">{cat === "all" ? exams.length : categoryCounts[cat]}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="sort-wrap">
              <FaSortAmountDown className="sort-icon" />
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort exams"
              >
                <option value="default">Default order</option>
                <option value="newest">Newest first</option>
                <option value="title">Title (A–Z)</option>
                <option value="questions">Most questions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results meta */}
        {!loading && !error && exams.length > 0 && (
          <div className="results-meta">
            <span>
              Showing <strong>{filteredExams.length}</strong> of <strong>{exams.length}</strong> exam
              {exams.length === 1 ? "" : "s"}
            </span>
            {lastUpdated && <span className="updated-at">Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        )}

        {/* Dynamic Content States */}
        {loading ? (
          <div>
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Fetching available exams...</h3>
              <p>Verifying active assessment schedules</p>
            </div>
            <div className="exam-grid skeleton-grid" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <div className="skeleton-card" key={n}>
                  <div className="sk-line w40"></div>
                  <div className="sk-line w80 tall"></div>
                  <div className="sk-line w100"></div>
                  <div className="sk-line w60"></div>
                  <div className="sk-btn"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="empty-state error-state">
            <FaExclamationCircle className="empty-icon error" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="reset-btn" onClick={() => fetchExams()}>
              <FaSyncAlt /> Try Again
            </button>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="empty-state">
            <FaExclamationCircle className="empty-icon" />
            <h3>No Assessments Found</h3>
            <p>
              {hasFilters
                ? "No examinations match your search or filter criteria. Try resetting your search."
                : "There are currently no active examinations assigned to your portal."}
            </p>
            {hasFilters && (
              <button className="reset-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="exam-grid">
            {filteredExams.map((exam) => (
              <ExamCard key={getExamId(exam)} exam={exam} onStart={startExam} />
            ))}
          </div>
        )}

        <footer className="page-footer">
          <span>© {new Date().getFullYear()} ProctorPortal. All rights reserved.</span>
          <span>AI-assisted proctoring • Your session is monitored for exam integrity</span>
        </footer>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`toast ${toast.type}`} role="alert">
          <FaExclamationCircle />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss">
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
}

export default AvailableExams;