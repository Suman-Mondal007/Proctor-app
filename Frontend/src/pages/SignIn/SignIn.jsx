import React from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();

  return (
    <div className="signin-container">
      {/* Background ambient glow effect */}
      <div className="ambient-glow"></div>

      <div className="signin-wrapper">
        <header className="signin-header">
          <div className="logo-icon-box">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1>
            Choose <span className="text-gradient">Portal Type</span>
          </h1>
          <p className="signin-subtitle">
            Select your account role to proceed to the secure assessment platform
          </p>
        </header>

        <div className="login-options">
          {/* Candidate Card */}
          <div
            className="login-card"
            onClick={() => navigate("/login")}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-wrapper">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>Candidate</h2>
            <p>Access active examinations, proctored environments, and results</p>

            <ul className="card-feature-list">
              <li>Live camera &amp; mic proctoring</li>
              <li>Instant score reports</li>
              <li>Exam history &amp; certificates</li>
            </ul>

            <div className="card-action">
              <span>Login as Candidate</span>
              <span className="arrow">&rarr;</span>
            </div>
          </div>

          {/* Admin Card */}
          <div
            className="login-card admin-card"
            onClick={() => navigate("/admin-login")}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-wrapper">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h2>Administrator</h2>
            <p>Manage exam schedules, review violation telemetry, and configure tests</p>

            <ul className="card-feature-list">
              <li>Question bank &amp; scheduling</li>
              <li>Violation &amp; audit dashboards</li>
              <li>Candidate management tools</li>
            </ul>

            <div className="card-action">
              <span>Admin Dashboard</span>
              <span className="arrow">&rarr;</span>
            </div>
          </div>
        </div>

        <p className="security-note">
          🔒 All sessions are encrypted end-to-end. Your credentials and proctoring data are never shared with third parties.
        </p>

        <button className="back-home-btn" onClick={() => navigate("/")}>
          &larr; Back to Home
        </button>
      </div>
    </div>
  );
}

export default SignIn;