import React, { useState, useEffect } from "react";
import "./Reports.css";

const API_URL = "http://localhost:5000/api/candidates";

function Reports() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setCandidates(data);
        } else if (data && Array.isArray(data.results)) {
          setCandidates(data.results);
        } else if (data && Array.isArray(data.candidates)) {
          setCandidates(data.candidates);
        } else {
          setCandidates([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching candidate data:", err);
        setError("Failed to load candidate reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Safe helper to extract displayable count for violations
  const getViolationCount = (violations) => {
    if (Array.isArray(violations)) return violations.length;
    if (typeof violations === "number") return violations;
    if (typeof violations === "object" && violations !== null) {
      return violations.count || violations.message || 1;
    }
    return 0;
  };

  // Dynamic calculations derived directly from safe primitive values
  const totalCandidates = candidates.length;
  
  const avgScore = totalCandidates
    ? Math.round(
        candidates.reduce((acc, curr) => {
          const scoreVal = typeof curr.score === "object" ? curr.score?.value || 0 : curr.score;
          return acc + Number(scoreVal || 0);
        }, 0) / totalCandidates
      )
    : 0;

  const totalViolations = candidates.reduce(
    (acc, curr) => acc + getViolationCount(curr.violations),
    0
  );

  const passCount = candidates.filter((c) => {
    const statusStr = typeof c.status === "object" ? c.status?.name : c.status;
    return String(statusStr || "").toLowerCase() === "passed";
  }).length;

  const passRate = totalCandidates
    ? Math.round((passCount / totalCandidates) * 100)
    : 0;

  // Helper to safely format any cell content so React never crashes on objects
  const renderSafeText = (val, fallback = "N/A") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string" || typeof val === "number") return val;
    if (typeof val === "boolean") return val ? "True" : "False";
    if (Array.isArray(val)) return `${val.length} items`;
    if (typeof val === "object") {
      // If object has common text properties, use them
      return val.name || val.title || val.message || val.type || JSON.stringify(val);
    }
    return String(val);
  };

  const handleView = (candidate) => {
    alert(`Viewing detailed report for ${renderSafeText(candidate.name)}`);
  };

  const handleDownload = (candidate) => {
    alert(`Downloading PDF report for ${renderSafeText(candidate.name)}`);
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>Exam Reports</h1>
        <p>Overview of candidate performance and proctoring metrics</p>
      </header>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="report-card">
          <h3>Total Candidates</h3>
          <h2>{loading ? "--" : totalCandidates}</h2>
        </div>

        <div className="report-card">
          <h3>Average Score</h3>
          <h2>{loading ? "--" : `${avgScore}%`}</h2>
        </div>

        <div className="report-card">
          <h3>Total Violations</h3>
          <h2>{loading ? "--" : totalViolations}</h2>
        </div>

        <div className="report-card">
          <h3>Pass Rate</h3>
          <h2>{loading ? "--" : `${passRate}%`}</h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="table-container">
        <h2>Candidate Details</h2>

        {loading && (
          <div className="status-message loading">
            Loading candidate data from backend...
          </div>
        )}

        {error && <div className="status-message error">{error}</div>}

        {!loading && !error && candidates.length === 0 && (
          <div className="status-message empty">
            No candidate reports found.
          </div>
        )}

        {!loading && !error && candidates.length > 0 && (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Violations</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => {
                  const candidateName = renderSafeText(candidate.name, "Unknown");
                  const examName = renderSafeText(candidate.exam, "General Exam");
                  const scoreVal = renderSafeText(candidate.score, 0);
                  const violationVal = getViolationCount(candidate.violations);
                  const riskLevel = renderSafeText(candidate.risk, "LOW").toUpperCase();
                  const statusVal = renderSafeText(candidate.status, "Pending");

                  return (
                    <tr key={candidate.id || candidate._id || index}>
                      <td className="candidate-name">{candidateName}</td>
                      <td>{examName}</td>
                      <td className="score-cell">{scoreVal}%</td>
                      <td>{violationVal}</td>
                      <td>
                        <span className={`risk-badge risk-${riskLevel.toLowerCase()}`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${statusVal.toLowerCase()}`}>
                          {statusVal}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-view"
                          onClick={() => handleView(candidate)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-download"
                          onClick={() => handleDownload(candidate)}
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;