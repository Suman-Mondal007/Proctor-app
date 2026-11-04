import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both admin email and password.");
      return;
    }

    setLoading(true);

    // Hardcoded demo check / AuthContext integration
    if (email === "admin@gmail.com" && password === "admin123") {
      authLogin({
        email: "admin@gmail.com",
        role: "admin",
      });

      navigate("/admin");
    } else {
      setErrorMessage("Invalid Admin Credentials. Please check your details.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="ambient-glow"></div>

      <div className="admin-login-wrapper">
        <header className="admin-login-header">
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
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2>
            Administrator <span className="text-gradient">Portal</span>
          </h2>
          <p className="admin-subtitle">
            Secure system controls, monitoring telemetry, and assessment management
          </p>
        </header>

        <form className="admin-login-box" onSubmit={handleLogin}>
          <div className="admin-badge">
            <span className="pulse-dot"></span> Restricted Access
          </div>

          {errorMessage && (
            <div className="error-alert">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="admin-email"
                type="email"
                placeholder="     admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="admin-password">Password</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="     ••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span> Verifying Admin Privileges...
              </span>
            ) : (
              "Access Admin Dashboard"
            )}
          </button>

          <div className="security-notice">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p>
              Administrative sessions are recorded, multi-factor protected, and logged for continuous security auditing.
            </p>
          </div>
        </form>

        <button className="back-btn" onClick={() => navigate("/signin")}>
          &larr; Switch Portal Type
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;