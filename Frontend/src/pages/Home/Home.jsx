import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "How does the AI detect suspicious behavior during an assessment?",
      a: "The engine runs continuous light-weight spatial model tracking directly in the browser—monitoring gaze vectors, multi-person frame entry, unauthorized tab switching, and acoustic frequency spikes without sending high-bandwidth raw video feeds."
    },
    {
      q: "What hardware or browser extensions are required?",
      a: "Zero plugins or external downloads needed. Candidates only require a standard web browser (Chrome, Edge, Firefox, or Safari) with standard camera and microphone permissions enabled."
    },
    {
      q: "How are candidate privacy and biometric data handled?",
      a: "All monitoring telemetry and snapshot verification logs are encrypted end-to-end and stored in compliance with standard security frameworks. Session records auto-purge according to institutional retention policies."
    },
    {
      q: "Can administrators review flagged incidents post-exam?",
      a: "Yes. Once an assessment is completed, an automated integrity timeline is generated containing exact timestamps, violation severity ratings, and contextual snapshots for rapid human audit."
    }
  ];

  return (
    <div className="home">
      {/* Top Glass Navigation Bar */}
      <header className="home-navbar">
        <div className="logo-container">
          <div className="logo-icon-box">
            <svg
              width="20"
              height="20"
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
          <h2>
            AI<span className="text-gradient">Proctor</span>
          </h2>
        </div>

        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate("/signin")}>
            Sign In
          </button>
          <button className="btn-primary" onClick={() => navigate("/signin")}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <div className="badge">
            <span className="pulse-dot"></span> Next-Gen Assessment Integrity
          </div>
          <h1>
            Secure, Automated <br />
            <span className="text-gradient">Technical Assessment Engine</span>
          </h1>
          <p className="hero-subtitle">
            Conduct tamper-proof examinations with continuous facial verification,
            multi-person detection, active tab focus tracking, and real-time fraud mitigation.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary btn-large" onClick={() => navigate("/signin")}>
              Start Assessment Now
            </button>
            <a href="#how-it-works" className="btn-text">
              See How It Works <span>&rarr;</span>
            </a>
          </div>
        </div>

        {/* Live HUD Session Monitor Visual */}
        <div className="hero-visual">
          <div className="hud-panel">
            <span className="hud-corner tl"></span>
            <span className="hud-corner tr"></span>
            <span className="hud-corner bl"></span>
            <span className="hud-corner br"></span>

            <div className="hud-header">
              <div className="hud-live-tag">
                <span className="live-dot"></span> SESSION MONITOR #04471
              </div>
              <div className="hud-timer">00:24:16</div>
            </div>

            <div className="hud-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">FACIAL MATCH</span>
                <span className="metric-value status-pass">VERIFIED</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">SECOND FACE</span>
                <span className="metric-value status-clear">NONE DETECTED</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">FOCUS STATE</span>
                <span className="metric-value status-pass">EXAM TAB ACTIVE</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">ACOUSTIC LEVEL</span>
                <span className="metric-value status-clear">NORMAL (24dB)</span>
              </div>
            </div>

            <div className="hud-console">
              <div className="console-line">[00:00:01] Biometric identification completed.</div>
              <div className="console-line">[00:05:12] Tab focus verified. Zero unauthorized exits.</div>
              <div className="console-line highlight">[00:24:10] Continuous AI integrity score: 99.8%</div>
            </div>
          </div>
        </div>
      </main>

      {/* Platform Trust Metrics Bar */}
      <section className="metrics-banner">
        <div className="metric-card">
          <h3>99.9%</h3>
          <p>Uptime & Reliability</p>
        </div>
        <div className="metric-card">
          <h3>&lt; 50ms</h3>
          <p>Detection Latency</p>
        </div>
        <div className="metric-card">
          <h3>Zero</h3>
          <p>Plugin Downloads Needed</p>
        </div>
        <div className="metric-card">
          <h3>100%</h3>
          <p>Automated Audit Trails</p>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="quote-section">
        <div className="quote-card">
          <span className="quote-badge">// VERIFIED TRUST</span>
          <blockquote>
            "Integrity is doing the right thing, even when no one is watching. Our platform builds verified confidence into every score."
          </blockquote>
        </div>
      </section>

      {/* Platform Workflow Breakdown */}
      <section id="how-it-works" className="workflow-section">
        <div className="section-header">
          <h2>How Our Platform Executes Exams</h2>
          <p>Engineered for uncompromised security, automated proctoring, and high accuracy.</p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="step-number">STEP 01</div>
            <h3>Biometric Check</h3>
            <p>
              Candidates complete instant facial match identity verification and hardware permission checks prior to unlocking questions.
            </p>
          </div>

          <div className="workflow-card highlighted">
            <div className="step-number">STEP 02</div>
            <h3>Real-Time AI Monitoring</h3>
            <p>
              Continuous multi-face tracking, active tab focus detection, gaze monitoring, and acoustic analysis run live throughout the test.
            </p>
          </div>

          <div className="workflow-card">
            <div className="step-number">STEP 03</div>
            <h3>Automated Audit Report</h3>
            <p>
              Comprehensive integrity reports, violation timestamps, and flag logs are compiled automatically for immediate administrator review.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="faq-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about system requirements, AI accuracy, and privacy controls.</p>
        </div>

        <div className="faq-container">
          {faqData.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${openFaq === index ? "active" : ""}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <h3>{item.q}</h3>
                <span className="faq-icon">{openFaq === index ? "−" : "+"}</span>
              </div>
              {openFaq === index && (
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to secure your assessments?</h2>
          <p>Get started immediately with automated proctoring tailored for your institution or technical hiring workflow.</p>
          <button className="btn-primary btn-large" onClick={() => navigate("/signin")}>
            Create Assessment Session
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} AI Proctor Exam Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;