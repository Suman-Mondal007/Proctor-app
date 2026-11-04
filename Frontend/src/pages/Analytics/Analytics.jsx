import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./Analytics.css";

function Analytics() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalCandidates: 0,
        totalExams: 0,
        totalQuestions: 0,
        activeExams: 0,
        avgScore: 0
    });

    const [examSets, setExamSets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for viewing questions inside a set
    const [selectedSet, setSelectedSet] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const [usersRes, resultsRes, questionsRes, examsRes] = await Promise.all([
                API.get("/users").catch(() => ({ data: [] })),
                API.get("/results").catch(() => ({ data: [] })),
                API.get("/questions").catch(() => ({ data: [] })),
                // Fetch exams endpoint used in student view
                API.get("/exams").catch(() => API.get("/admin/exams").catch(() => ({ data: [] })))
            ]);

            const rawUsers = usersRes.data?.users || usersRes.data?.candidates || usersRes.data?.data || usersRes.data || [];
            const rawResults = resultsRes.data?.results || resultsRes.data?.data || resultsRes.data || [];
            const rawQuestions = questionsRes.data?.questions || questionsRes.data?.data || questionsRes.data || [];
            
            // Normalize exams list format
            let rawExams = examsRes.data?.exams || examsRes.data?.data || examsRes.data || [];
            if (!Array.isArray(rawExams) && typeof rawExams === "object") {
                rawExams = rawExams.exams || [];
            }

            const allUsers = Array.isArray(rawUsers) ? rawUsers : [];
            const allResults = Array.isArray(rawResults) ? rawResults : [];
            const allQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];
            let allExams = Array.isArray(rawExams) ? rawExams : [];

            // Calculate average score across finished exams
            const totalScoreSum = allResults.reduce((acc, curr) => acc + (curr.score || 0), 0);
            const averageScore = allResults.length > 0 ? (totalScoreSum / allResults.length).toFixed(1) : 0;

            const candidateUsers = allUsers.filter(user => (user.role || "").toLowerCase() !== "admin");

            setStats({
                totalCandidates: candidateUsers.length || allUsers.length,
                totalExams: allResults.length,
                totalQuestions: allQuestions.length,
                activeExams: allResults.filter(item => (item.status || "").toUpperCase() === "RUNNING").length,
                avgScore: averageScore
            });

            setExamSets(allExams);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle Published status on/off
    const handleToggleSetVisibility = async (e, examId, currentStatus) => {
        // Prevent opening the detail modal when clicking the toggle switch
        e.stopPropagation();
        
        try {
            const updatedStatus = !currentStatus;
            
            // Optimistically update local UI state immediately
            setExamSets(prev =>
                prev.map(item => {
                    const id = item._id || item.id;
                    return id === examId ? { ...item, isActive: updatedStatus } : item;
                })
            );

            // Call API endpoint to update exam visibility / active status
            await API.patch(`/exams/${examId}`, { isActive: updatedStatus })
                .catch(() => API.put(`/exams/${examId}`, { isActive: updatedStatus }))
                .catch(() => null);

        } catch (error) {
            console.error("Failed to toggle status:", error);
        }
    };

    // Delete Exam / Question Set
    const handleDeleteSet = async (e, examId) => {
        // Prevent opening the detail modal when clicking delete
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this exam set?")) return;

        try {
            await API.delete(`/exams/${examId}`).catch(() => null);
            setExamSets(prev => prev.filter(item => (item._id || item.id) !== examId));
        } catch (error) {
            console.error("Failed to delete exam set:", error);
        }
    };

    // Open detail modal to inspect questions inside the exam set
    const handleOpenSetDetails = async (examItem) => {
        const examId = examItem._id || examItem.id;
        setSelectedSet(examItem);
        setModalLoading(true);

        try {
            if (!examItem.questions || examItem.questions.length === 0 || typeof examItem.questions[0] === "string") {
                const res = await API.get(`/exams/${examId}`).catch(() => null);
                if (res && res.data) {
                    setSelectedSet(res.data?.exam || res.data?.data || res.data);
                }
            }
        } catch (error) {
            console.error("Error opening exam details:", error);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="analytics-page-wrapper">
            {/* Top Navigation */}
            <nav className="portal-navbar">
                <div className="portal-brand">
                    <span className="brand-icon">📈</span>
                    <span className="brand-name">ProctorPortal Analytics</span>
                </div>
                <div className="navbar-actions">
                    <button className="btn-light-secondary" onClick={() => navigate("/admin")}>
                        ← Back to Admin Control
                    </button>
                </div>
            </nav>

            {/* Banner Header */}
            <div className="welcome-banner">
                <div className="banner-left">
                    <span className="badge-pill">📊 System Insights & Test Management</span>
                    <h1>Test Set & Exam <span className="highlight-text">Analytics</span></h1>
                    <p className="subtitle-text">
                        Inspect active test sets, toggle student portal visibility, or purge old assessments.
                    </p>
                </div>
                <div className="banner-actions">
                    <button className="btn-glow-primary" onClick={() => navigate("/admin/questions")}>
                        + Create New Question Set
                    </button>
                </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="light-stats-grid">
                <div className="light-stat-card">
                    <div className="stat-card-icon blue-glow">📁</div>
                    <div className="stat-card-details">
                        <span className="stat-label">AVAILABLE TEST SETS</span>
                        <div className="stat-value">{loading ? "..." : examSets.length}</div>
                        <span className="stat-subtext">Configured question banks</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon green-glow">🎯</div>
                    <div className="stat-card-details">
                        <span className="stat-label">AVERAGE SCORE</span>
                        <div className="stat-value">{loading ? "..." : stats.avgScore}</div>
                        <span className="stat-subtext">Across evaluated submissions</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon purple-glow">📋</div>
                    <div className="stat-card-details">
                        <span className="stat-label">TOTAL SUBMISSIONS</span>
                        <div className="stat-value">{loading ? "..." : stats.totalExams}</div>
                        <span className="stat-subtext">Completed candidate tests</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon orange-glow">⚡</div>
                    <div className="stat-card-details">
                        <span className="stat-label">LIVE SESSIONS</span>
                        <div className="stat-value">{loading ? "..." : stats.activeExams}</div>
                        <span className="stat-subtext">Currently active exams</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="light-panel-box">
                <div className="panel-header">
                    <div>
                        <h2>Available Assessment Test Sets</h2>
                        <p className="panel-sub">Manage set visibility for students, view question content, or delete obsolete sets.</p>
                    </div>
                    <span className="tag-pill">{examSets.length} Total Sets</span>
                </div>

                <div className="question-sets-container">
                    {loading ? (
                        <div className="empty-state text-center-muted">Loading available sets...</div>
                    ) : examSets.length === 0 ? (
                        <div className="empty-state text-center-muted">
                            <p>No question sets are available for administration.</p>
                        </div>
                    ) : (
                        examSets.map((item) => {
                            const itemId = item._id || item.id;
                            const count = item.totalQuestions || item.questionsCount || item.questions?.length || 0;
                            const isPublished = item.isActive !== false;

                            return (
                                <div
                                    key={itemId}
                                    className="set-card-row clickable-card"
                                    onClick={() => handleOpenSetDetails(item)}
                                >
                                    <div className="set-meta">
                                        <div className="set-title-row">
                                            <span className="doc-icon">📑</span>
                                            <h4>{item.title || item.name || item.examName || "Assessment Test Set"}</h4>
                                        </div>
                                        <div className="set-tags">
                                            <span className="tag-pill">{count} Questions Included</span>
                                            {item.duration && <span className="tag-pill">⏱️ {item.duration} Mins</span>}
                                            {item.totalMarks && <span className="tag-pill">🎯 {item.totalMarks} Marks</span>}
                                            <span className="tag-pill">Click to Inspect Content</span>
                                        </div>
                                    </div>

                                    <div className="set-control-actions" onClick={(e) => e.stopPropagation()}>
                                        <label className="light-toggle" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isPublished}
                                                onChange={(e) => handleToggleSetVisibility(e, itemId, isPublished)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                        <span className={`visibility-badge ${isPublished ? "active" : "hidden"}`}>
                                            {isPublished ? "Published" : "Hidden"}
                                        </span>
                                        <button
                                            className="btn-icon-delete"
                                            title="Delete Test Set"
                                            onClick={(e) => handleDeleteSet(e, itemId)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Test Set Detail / PDF Preview Modal */}
            {selectedSet && (
                <div className="pdf-modal-overlay" onClick={() => setSelectedSet(null)}>
                    <div className="pdf-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="pdf-modal-header">
                            <div className="pdf-modal-title">
                                <span className="pdf-badge">TEST SET INSPECTOR</span>
                                <h2>{selectedSet.title || selectedSet.name || "Question Set Details"}</h2>
                            </div>
                            <button className="pdf-close-btn" onClick={() => setSelectedSet(null)}>✕</button>
                        </div>

                        <div className="pdf-modal-body">
                            {modalLoading ? (
                                <div className="pdf-loading">Loading Test Questions...</div>
                            ) : selectedSet.questions && selectedSet.questions.length > 0 ? (
                                selectedSet.questions.map((q, idx) => (
                                    <div key={q._id || idx} className="pdf-question-block">
                                        <div className="pdf-question-header">
                                            <span className="q-num">Q{idx + 1}.</span>
                                            <p className="q-text">{q.questionText || q.question || q.title || "Question Text"}</p>
                                        </div>
                                        {q.options && Array.isArray(q.options) && (
                                            <div className="pdf-options-list">
                                                {q.options.map((opt, oIdx) => {
                                                    const optionText = typeof opt === "string" ? opt : opt.text;
                                                    const isCorrect = typeof opt === "object" ? opt.isCorrect : (q.correctAnswer === oIdx || q.answer === optionText);
                                                    return (
                                                        <div key={oIdx} className={`pdf-option-item ${isCorrect ? "correct" : ""}`}>
                                                            <span className="opt-bullet">{String.fromCharCode(65 + oIdx)}.</span>
                                                            <span className="opt-text">{optionText}</span>
                                                            {isCorrect && <span className="correct-tag">✓ Correct Answer</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="pdf-empty-state">
                                    <p>No questions found inside this test set.</p>
                                </div>
                            )}
                        </div>

                        <div className="pdf-modal-footer">
                            <button className="btn-light-secondary" onClick={() => setSelectedSet(null)}>
                                Close Modal
                            </button>
                            <button className="btn-glow-primary" onClick={() => window.print()}>
                                🖨️ Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Analytics;