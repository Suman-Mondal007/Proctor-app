import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCandidateResult } from "../../services/resultService";
import "./Result.css";

function Result() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchResult = async () => {
        try {
            setLoading(true);
            if (!user?._id) return;

            const response = await getCandidateResult(user._id);

            if (response?.data?.length > 0) {
                setResult(response.data[0]);
            } else {
                setResult(null);
            }
        } catch (err) {
            console.error("Failed to fetch candidate result:", err);
            setError("Failed to load result. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchResult();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="result-page">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <h2>Loading Result...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="result-page">
                <div className="result-card error-card">
                    <h2>{error}</h2>
                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => navigate("/")}>
                            Back to Home
                        </button>
                        <button className="btn btn-primary" onClick={fetchResult}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="result-page">
                <div className="result-card">
                    <h2>No Result Found</h2>
                    <p>You haven't completed any candidate assessments yet.</p>
                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => navigate("/")}>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="result-page">
            <div className="result-card">
                <h1>Exam Result</h1>

                {/* Candidate Summary Header */}
                <div className="candidate-info">
                    <p className="candidate-name">{user?.name || "Candidate"}</p>
                    <p className="candidate-id">ID: {user?._id || "N/A"}</p>
                </div>

                {/* Metrics Grid */}
                <div className="metrics-grid">
                    <div className="metric-box score">
                        <h3>Score</h3>
                        <p>
                            {result.score} <span>/ {result.totalQuestions}</span>
                        </p>
                    </div>

                    <div className="metric-box percentage">
                        <h3>Percentage</h3>
                        <p>{result.percentage}%</p>
                    </div>
                </div>

                {/* Animated Pass/Fail Badge */}
                <div className={`status-badge ${result.status === "PASS" ? "pass" : "fail"}`}>
                    {result.status}
                </div>

                {/* Assessment Details */}
                <div className="details">
                    <p>
                        <span>Exam Date</span>
                        <strong>
                            {result.createdAt
                                ? new Date(result.createdAt).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                        </strong>
                    </p>
                    <p>
                        <span>Duration</span>
                        <strong>{result.duration} seconds</strong>
                    </p>
                    <p>
                        <span>Violations Detected</span>
                        <strong className={result.violations?.length > 0 ? "warning-text" : ""}>
                            {result.violations?.length || 0}
                        </strong>
                    </p>
                </div>

                {/* Action Controls */}
                <div className="action-buttons">
                    <button className="home-btn" onClick={() => navigate("/dashboard")}>
                        Back to Home
                    </button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        Download Report
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Result;