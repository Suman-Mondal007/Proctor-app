import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import "./AdminExam.css";

function AdminExam() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [exam, setExam] = useState({
        title: "",
        description: "",
        duration: 30,
        passingMarks: 0
    });

    const handleChange = (e) => {
        setExam({
            ...exam,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateAndNavigate = async () => {
        if (!exam.title.trim()) {
            alert("Please enter an assessment title before proceeding.");
            return;
        }

        setIsSubmitting(true);
        try {
            await API.post("/exams", exam);
            navigate("/admin/questions");
        } catch (error) {
            console.error("Error creating assessment:", error);
            // Fallback navigation if endpoint requires complete payload
            navigate("/admin/questions");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dark-admin-wrapper professional-bg">
            {/* Ambient Background Glows */}
            <div className="ambient-glow glow-top-left"></div>
            <div className="ambient-glow glow-bottom-right"></div>

            {/* Top Navigation Bar */}
            <nav className="portal-navbar glass-panel">
                <div className="portal-brand">
                    <span className="brand-icon animated-pulse">🎥</span>
                    <span className="brand-name">ProctorPortal <span className="admin-chip">ADMIN</span></span>
                </div>
                <button className="btn-dark-secondary hover-lift" onClick={() => navigate("/admin")}>
                    ← Back to Dashboard
                </button>
            </nav>

            {/* Header Banner */}
            <div className="welcome-banner exam-banner">
                <div className="banner-left">
                    <div className="badge-row">
                        <span className="badge-pill glowing-badge">📝 Step 1 of 2</span>
                        <span className="badge-pill-outline">Assessment Setup</span>
                    </div>
                    <h1>Create New <span className="highlight-gradient">Assessment</span></h1>
                    <p className="subtitle-text">Configure core exam settings and proctoring parameters before adding questions.</p>
                </div>
            </div>

            {/* Main Center Form */}
            <div className="single-panel-layout">
                <div className="dark-panel-box glass-card config-panel-full">
                    <div className="panel-header-pro">
                        <div>
                            <h2>Assessment Configuration</h2>
                            <p className="panel-sub">Set up title, duration rules, and pass thresholds.</p>
                        </div>
                        <div className="live-status-pill">
                            <span className="pulse-dot"></span> Draft Mode
                        </div>
                    </div>

                    <div className="dark-form-grid">
                        <div className="input-group full-width focus-glow">
                            <label>Assessment Title <span className="required-star">*</span></label>
                            <input
                                name="title"
                                placeholder="e.g., Full-Stack Engineering Assessment 2026"
                                value={exam.title}
                                onChange={handleChange}
                                autoComplete="off"
                            />
                        </div>

                        <div className="input-group full-width focus-glow">
                            <label>Instructions & Guidelines</label>
                            <textarea
                                name="description"
                                placeholder="Instructions shown to candidates before starting (e.g., 'Webcam and audio tracking will be enabled.')"
                                value={exam.description}
                                onChange={handleChange}
                                rows="4"
                            />
                        </div>

                        <div className="input-group focus-glow">
                            <label>Duration (Minutes)</label>
                            <div className="input-with-icon">
                                <input
                                    type="number"
                                    name="duration"
                                    placeholder="e.g., 60"
                                    value={exam.duration}
                                    onChange={handleChange}
                                    min="1"
                                />
                                <span className="field-icon">⏱️</span>
                            </div>
                        </div>

                        <div className="input-group focus-glow">
                            <label>Passing Marks</label>
                            <div className="input-with-icon">
                                <input
                                    type="number"
                                    name="passingMarks"
                                    placeholder="e.g., 40"
                                    value={exam.passingMarks}
                                    onChange={handleChange}
                                    min="0"
                                />
                                <span className="field-icon">🎯</span>
                            </div>
                        </div>
                    </div>

                    {/* Pro Callout Box */}
                    <div className="pro-callout-card">
                        <div className="callout-icon">💡</div>
                        <div className="callout-text">
                            <h4>Next Step: Question Mapping</h4>
                            <p>Saving this setup will redirect you to <strong>Manage Questions</strong> where you can link live questions to this test.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Interactive Footer */}
            <div className="sticky-action-footer glass-footer">
                <div className="footer-stats">
                    <div className="stat-pill-pro">
                        <span className="icon">⏱️</span>
                        <div>
                            <span className="label">Total Duration</span>
                            <span className="value">{exam.duration || 0} Mins</span>
                        </div>
                    </div>
                    <div className="stat-pill-pro">
                        <span className="icon">🎯</span>
                        <div>
                            <span className="label">Pass Target</span>
                            <span className="value">{exam.passingMarks || 0} Marks</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    className="btn-glow-primary action-btn-pro" 
                    onClick={handleCreateAndNavigate}
                    disabled={isSubmitting}
                >
                    <span>{isSubmitting ? "Saving Configuration..." : "Manage Questions"}</span>
                    <span className="btn-arrow">→</span>
                </button>
            </div>
        </div>
    );
}

export default AdminExam;