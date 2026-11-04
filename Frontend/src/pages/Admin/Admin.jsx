import "./Admin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

function Admin() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        candidates: 0,
        results: 0,
        questions: 0,
        active: 0
    });

    const [recentCandidates, setRecentCandidates] = useState([]);
    const [questionSets, setQuestionSets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time Clock State
    const [now, setNow] = useState(new Date());

    // State for Question Set Document/PDF Preview Modal
    const [selectedSet, setSelectedSet] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Live clock updater
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [usersRes, resultsRes, questionsRes, setsRes] = await Promise.all([
                API.get("/users").catch(() => ({ data: [] })),
                API.get("/results").catch(() => ({ data: [] })),
                API.get("/questions").catch(() => ({ data: [] })),
                API.get("/question-sets").catch(() => ({ data: [] }))
            ]);

            // Flexible array extraction to catch backend structure variations
            const rawUsers = usersRes.data?.users || usersRes.data?.candidates || usersRes.data?.data || usersRes.data || [];
            const rawResults = resultsRes.data?.results || resultsRes.data?.data || resultsRes.data || [];
            const rawQuestions = questionsRes.data?.questions || questionsRes.data?.data || questionsRes.data || [];
            let rawSets = setsRes.data?.questionSets || setsRes.data?.sets || setsRes.data?.data || setsRes.data || [];

            const allUsers = Array.isArray(rawUsers) ? rawUsers : [];
            const allResults = Array.isArray(rawResults) ? rawResults : [];
            const allQuestions = Array.isArray(rawQuestions) ? rawQuestions : [];
            let allSets = Array.isArray(rawSets) ? rawSets : [];

            // Fallback: Group questions into a default set if no sets exist
            if (allSets.length === 0 && allQuestions.length > 0) {
                allSets = [
                    {
                        _id: "default-live-set",
                        title: "General Assessment Question Set",
                        questionsCount: allQuestions.length,
                        isActive: true,
                        questions: allQuestions
                    }
                ];
            }

            // Filter out admin users to isolate candidate / student count
            const candidateUsers = allUsers.filter(user => {
                const role = (user.role || "").toLowerCase();
                return role !== "admin";
            });

            // Extract unique candidate identifiers directly from exam results as a fallback
            const uniqueCandidatesFromResults = new Set(
                allResults
                    .map(item => 
                        item.candidate?._id || 
                        item.candidate?.email || 
                        item.userEmail || 
                        item.email || 
                        item.userName || 
                        item.user?._id
                    )
                    .filter(Boolean)
            ).size;

            // Final candidate calculation hierarchy
            let finalCandidateCount = 0;
            if (candidateUsers.length > 0) {
                finalCandidateCount = candidateUsers.length;
            } else if (allUsers.length > 0) {
                finalCandidateCount = allUsers.length;
            } else {
                finalCandidateCount = uniqueCandidatesFromResults;
            }

            setStats({
                candidates: finalCandidateCount,
                results: allResults.length,
                questions: allQuestions.length,
                active: allResults.filter(item => (item.status || "").toUpperCase() === "RUNNING").length
            });

            setRecentCandidates(allResults.slice(0, 5));
            setQuestionSets(allSets);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle set visibility
    const handleToggleSetVisibility = async (e, setId, currentStatus) => {
        e.stopPropagation();
        try {
            const updatedStatus = !currentStatus;
            await API.patch(`/question-sets/${setId}`, { isActive: updatedStatus }).catch(() => null);
            
            setQuestionSets(prevSets =>
                prevSets.map(set =>
                    (set._id === setId || set.id === setId) ? { ...set, isActive: updatedStatus } : set
                )
            );
        } catch (error) {
            console.error("Failed to update set visibility:", error);
        }
    };

    // Delete question set
    const handleDeleteSet = async (e, setId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this question set?")) return;

        try {
            await API.delete(`/question-sets/${setId}`).catch(() => null);
            setQuestionSets(prevSets => prevSets.filter(set => set._id !== setId && set.id !== setId));
        } catch (error) {
            console.error("Failed to delete question set:", error);
        }
    };

    // Open set detail modal
    const handleOpenSetDetails = async (set) => {
        const setId = set._id || set.id;
        setSelectedSet(set);
        setModalLoading(true);

        try {
            if (!set.questions || typeof set.questions[0] === 'string') {
                const res = await API.get(`/question-sets/${setId}`).catch(() => null);
                if (res && res.data) {
                    setSelectedSet(res.data?.data || res.data);
                }
            }
        } catch (error) {
            console.error("Error fetching set details:", error);
        } finally {
            setModalLoading(false);
        }
    };

    const getCandidateName = (item) => item.candidate?.name || item.name || item.userName || item.user?.name || "N/A";
    const getCandidateEmail = (item) => item.candidate?.email || item.email || item.userEmail || item.user?.email || "N/A";

    return (
        <div className="light-blue-admin-wrapper">
            {/* Top Navigation Bar */}
            <nav className="portal-navbar">
                <div className="portal-brand">
                    <span className="brand-icon">🎥</span>
                    <span className="brand-name">ProctorPortal</span>
                </div>
                <div className="navbar-actions">
                    <div className="user-badge">
                        <span className="user-avatar">A</span>
                        <span className="user-name">Admin Control</span>
                    </div>
                </div>
            </nav>

            {/* Header Banner */}
            <div className="welcome-banner">
                <div className="banner-left">
                    <span className="badge-pill">⚙️ Admin Control Center</span>
                    <h1>Welcome back, <span className="highlight-text">Administrator</span></h1>
                    <div className="timestamp-info">
                        <span>📅 {currentDate}</span>
                        <span>•</span>
                        <span className="live-clock">⏰ {currentTime}</span>
                    </div>
                    <p className="subtitle-text">Manage exams, preview question sets, proctoring metrics, and system analytics.</p>
                </div>
                <div className="banner-actions">
                    <button className="btn-glow-primary" onClick={() => navigate("/admin/questions")}>
                        Manage Questions →
                    </button>
                    <button className="btn-light-secondary" onClick={() => navigate("/")}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="light-stats-grid">
                <div className="light-stat-card">
                    <div className="stat-card-icon blue-glow">👥</div>
                    <div className="stat-card-details">
                        <span className="stat-label">TOTAL CANDIDATES</span>
                        <div className="stat-value">{loading ? "..." : stats.candidates}</div>
                        <span className="stat-subtext">Registered candidates</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon purple-glow">📋</div>
                    <div className="stat-card-details">
                        <span className="stat-label">TOTAL EXAMS</span>
                        <div className="stat-value">{loading ? "..." : stats.results}</div>
                        <span className="stat-subtext">Evaluated test submissions</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon green-glow">❓</div>
                    <div className="stat-card-details">
                        <span className="stat-label">TOTAL QUESTIONS</span>
                        <div className="stat-value">{loading ? "..." : stats.questions}</div>
                        <span className="stat-subtext">Active question bank</span>
                    </div>
                </div>

                <div className="light-stat-card">
                    <div className="stat-card-icon orange-glow">⚡</div>
                    <div className="stat-card-details">
                        <span className="stat-label">RUNNING EXAMS</span>
                        <div className="stat-value">{loading ? "..." : stats.active}</div>
                        <span className="stat-subtext">Active proctored sessions</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Layout */}
            <div className="dashboard-layout">
                <div className="primary-column">
                    
                    {/* Student Portal Question Sets */}
                    <div className="light-panel-box">
                        <div className="panel-header">
                            <div>
                                <span className="status-dot-active">• LIVE ON PORTAL</span>
                                <h2>Student Portal Question Sets</h2>
                                <p className="panel-sub">Click on any card to view set contents like a document</p>
                            </div>
                            <button className="btn-glow-sm" onClick={() => navigate("/admin/questions")}>
                                + Create New Set
                            </button>
                        </div>
                        <div className="question-sets-container">
                            {questionSets.length === 0 ? (
                                <div className="empty-state text-center-muted">
                                    <p>No active question sets found.</p>
                                </div>
                            ) : (
                                questionSets.map((set) => {
                                    const setId = set._id || set.id;
                                    return (
                                        <div 
                                            key={setId} 
                                            className="set-card-row clickable-card"
                                            onClick={() => handleOpenSetDetails(set)}
                                        >
                                            <div className="set-meta">
                                                <div className="set-title-row">
                                                    <span className="doc-icon">📄</span>
                                                    <h4>{set.title || set.name || "Live Exam Question Set"}</h4>
                                                </div>
                                                <div className="set-tags">
                                                    <span className="tag-pill">{set.questionsCount || set.questions?.length || stats.questions} Questions</span>
                                                    <span className="tag-pill">Tap to Preview PDF View</span>
                                                </div>
                                            </div>
                                            <div className="set-control-actions">
                                                <label className="light-toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!set.isActive}
                                                        onChange={(e) => handleToggleSetVisibility(e, setId, set.isActive)}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                                <span className={`visibility-badge ${set.isActive ? "active" : "hidden"}`}>
                                                    {set.isActive ? "Published" : "Hidden"}
                                                </span>
                                                <button 
                                                    className="btn-icon-delete"
                                                    title="Delete Question Set"
                                                    onClick={(e) => handleDeleteSet(e, setId)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Candidates Table */}
                    <div className="light-panel-box">
                        <div className="panel-header">
                            <h2>Recent Candidates</h2>
                            <button className="btn-link-glow" onClick={() => navigate("/admin/results")}>
                                View All Results →
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="light-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center-muted">Loading candidate logs...</td></tr>
                                    ) : recentCandidates.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center-muted">No recent records found.</td></tr>
                                    ) : (
                                        recentCandidates.map((candidate, idx) => (
                                            <tr key={candidate._id || candidate.id || idx}>
                                                <td className="candidate-name-cell">{getCandidateName(candidate)}</td>
                                                <td className="candidate-email-cell">{getCandidateEmail(candidate)}</td>
                                                <td>
                                                    <span className="light-score-pill">
                                                        {candidate.score ?? 0} / {candidate.totalQuestions ?? 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`light-status-tag ${(candidate.status || "").toLowerCase()}`}>
                                                        {candidate.status || "N/A"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Sidebar Quick Actions */}
                <div className="secondary-column">
                    <div className="light-panel-box quick-actions-panel">
                        <h2>Quick Actions</h2>
                        <div className="quick-buttons-stack">
                            <button onClick={() => navigate("/admin/results")}>
                                <span className="q-icon">📊</span> View Results
                            </button>
                            <button onClick={() => navigate("/admin/exams")}>
                                <span className="q-icon">📝</span> Manage Exams
                            </button>
                            <button onClick={() => navigate("/reports")}>
                                <span className="q-icon">📑</span> Reports
                            </button>
                            <button onClick={() => navigate("/analytics")}>
                                <span className="q-icon">📈</span> Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document / PDF Preview Modal */}
            {selectedSet && (
                <div className="pdf-modal-overlay" onClick={() => setSelectedSet(null)}>
                    <div className="pdf-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="pdf-modal-header">
                            <div className="pdf-modal-title">
                                <span className="pdf-badge">PDF DOCUMENT VIEW</span>
                                <h2>{selectedSet.title || "Question Set Details"}</h2>
                            </div>
                            <button className="pdf-close-btn" onClick={() => setSelectedSet(null)}>✕</button>
                        </div>

                        <div className="pdf-modal-body">
                            {modalLoading ? (
                                <div className="pdf-loading">Loading Document Contents...</div>
                            ) : selectedSet.questions && selectedSet.questions.length > 0 ? (
                                selectedSet.questions.map((q, idx) => (
                                    <div key={q._id || idx} className="pdf-question-block">
                                        <div className="pdf-question-header">
                                            <span className="q-num">Q{idx + 1}.</span>
                                            <p className="q-text">{q.questionText || q.question || q.title || "Question Content"}</p>
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
                                                            {isCorrect && <span className="correct-tag">✓ Correct</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="pdf-empty-state">
                                    <p>No individual questions found inside this set context.</p>
                                </div>
                            )}
                        </div>

                        <div className="pdf-modal-footer">
                            <button className="btn-light-secondary" onClick={() => setSelectedSet(null)}>
                                Close Preview
                            </button>
                            <button className="btn-glow-primary" onClick={() => window.print()}>
                                🖨️ Print / Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;