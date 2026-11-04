import React from 'react';
import { Link } from 'react-router-dom';
import { FaRobot, FaArrowRight } from 'react-icons/fa';

const MockInterviewCard = () => {
  return (
    <section className="exam-start-card" style={{ background: 'linear-gradient(120deg, var(--blue-500), var(--blue-400) 55%, var(--blue-300))', marginTop: '20px' }}>
      <div className="exam-card-content">
        <span className="live-tag">
          <span className="pulse-dot"></span> AI Powered
        </span>
        <h2>Practice Mock Interview</h2>
        <p className="exam-topics">Upload your CV and practice customized interview questions for your desired role.</p>

        <div className="exam-meta">
          <div className="meta-chip">
            <span>Tailored for:</span> <strong>Your Target Role</strong>
          </div>
          <div className="meta-chip">
            <span>Feedback:</span> <strong>Instant AI Review</strong>
          </div>
        </div>
      </div>

      <div className="exam-card-cta">
        <Link to="/mock-interview-setup" className="launch-btn">
          Setup Interview <FaArrowRight />
        </Link>
      </div>
    </section>
  );
};

export default MockInterviewCard;
