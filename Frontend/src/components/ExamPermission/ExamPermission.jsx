import React, { useState } from "react";
import {
  FaShieldAlt,
  FaCamera,
  FaMicrophone,
  FaExclamationTriangle,
  FaCheckCircle,
  FaMobileAlt,
  FaExternalLinkAlt,
  FaCopy,
  FaEye,
  FaArrowRight,
  FaSpinner
} from "react-icons/fa";
import "./ExamPermission.css";

function ExamPermission({ onSuccess, examTitle }) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requestPermission = async () => {
    if (!agreed) return;

    try {
      setLoading(true);
      setErrorMessage("");

      // Request media stream for proctoring verification
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Stop tracks immediately after checking access so hardware turns off until exam starts
      stream.getTracks().forEach((track) => track.stop());

      setLoading(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Permission error:", error);
      setErrorMessage(
        "Camera and Microphone access are mandatory for this proctored examination. Please grant permissions in your browser settings to proceed."
      );
      setLoading(false);
    }
  };

  return (
    <div className="permission-page">
      <div className="permission-backdrop-glow"></div>

      <div className="permission-card">
        {/* Header Header Banner */}
        <div className="permission-header">
          <div className="badge-wrapper">
            <FaShieldAlt className="shield-icon" />
            <span>Proctoring Verification System</span>
          </div>
          <h2>{examTitle || "Assessment Pre-Check & Rules"}</h2>
          <p>Review the proctoring parameters and grant hardware access to start.</p>
        </div>

        {/* Requirements Grid */}
        <div className="requirements-grid">
          <div className="req-item">
            <div className="req-icon-box">
              <FaCamera />
            </div>
            <div className="req-text">
              <h4>Webcam Active</h4>
              <p>Continuous video monitoring required</p>
            </div>
          </div>

          <div className="req-item">
            <div className="req-icon-box">
              <FaMicrophone />
            </div>
            <div className="req-text">
              <h4>Microphone Active</h4>
              <p>Ambient noise detection enabled</p>
            </div>
          </div>
        </div>

        {/* Guidelines & Proctored Rules Container */}
        <div className="rules-container">
          <div className="rules-header">
            <FaExclamationTriangle className="warning-badge-icon" />
            <h3>Proctoring Guidelines & Rules</h3>
          </div>

          <div className="rules-grid">
            <div className="rule-card">
              <FaExternalLinkAlt className="rule-icon" />
              <div>
                <strong>Tab & Window Switches</strong>
                <p>Leaving full-screen or switching browser tabs triggers an automatic violation penalty.</p>
              </div>
            </div>

            <div className="rule-card">
              <FaMobileAlt className="rule-icon" />
              <div>
                <strong>Mobile & Object Detection</strong>
                <p>Use of smartphones, notes, secondary screens, or extra personnel is strictly prohibited.</p>
              </div>
            </div>

            <div className="rule-card">
              <FaCopy className="rule-icon" />
              <div>
                <strong>Copying & Pasting</strong>
                <p>Clipboard shortcuts, context menus, and text selection are completely disabled.</p>
              </div>
            </div>

            <div className="rule-card">
              <FaEye className="rule-icon" />
              <div>
                <strong>Off-Screen Gazing</strong>
                <p>Looking away from the screen for prolonged periods will flag an automated alert.</p>
              </div>
            </div>
          </div>

          {/* Warning Counter Banner */}
          <div className="warning-threshold-banner">
            <FaExclamationTriangle className="alert-icon" />
            <span>
              <strong>Warning Limit:</strong> A maximum of <strong>5 warnings</strong> are allowed. Exceeding this limit will result in <strong>automatic exam termination</strong>.
            </span>
          </div>
        </div>

        {/* Permission Error Box */}
        {errorMessage && (
          <div className="permission-error-box">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Agreement Checkbox */}
        <label className="consent-checkbox-label">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            I have read and understand all examination rules, proctoring penalties, and warning limits.
          </span>
        </label>

        {/* Action Button */}
        <button
          className="start-exam-btn"
          onClick={requestPermission}
          disabled={!agreed || loading}
        >
          {loading ? (
            <>
              <FaSpinner className="spinner-icon" />
              <span>Verifying Media Devices...</span>
            </>
          ) : (
            <>
              <span>Allow Access & Start Exam</span>
              <FaArrowRight className="btn-arrow" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ExamPermission;