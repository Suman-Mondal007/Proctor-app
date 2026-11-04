import React, { useState } from "react";
import {
  FaClock,
  FaQuestionCircle,
  FaAward,
  FaShieldAlt,
  FaArrowRight,
  FaTrash,
  FaCalendarAlt
} from "react-icons/fa";
import API from "../../services/api";
import "./ExamCard.css";

function ExamCard({ exam, onStart, onDeleteSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const title = exam.title || exam.examTitle || "Untitled Examination";
  const description = exam.description || "No specific instructions provided for this exam.";
  const duration = exam.duration || exam.timeLimit || 30;
  const questionsCount = exam.questionsCount ?? exam.questions?.length ?? 0;
  const category = exam.category || exam.subject || "General";
  const difficulty = exam.difficulty || "Intermediate";
  
  // Dynamic total marks calculation
  const totalMarks = exam.totalMarks || (questionsCount * 10);

  // Format Date and Time for sorting / display
  const rawDate = exam.createdAt || exam.date || exam.created_at;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Date N/A";

  // Handle Exam Deletion from Database
  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevents triggering card clicks or start exam

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title}"? This will permanently remove it from the database.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const examId = exam._id || exam.id;
      await API.delete(`/exams/${examId}`);
      alert("Exam deleted successfully.");
      
      // Notify parent component to update state/refresh list
      if (onDeleteSuccess) {
        onDeleteSuccess(examId);
      }
    } catch (error) {
      console.error("Failed to delete exam:", error);
      alert("Failed to delete exam from database. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`exam-card ${isDeleting ? "card-deleting" : ""}`}>
      {/* Top Corner Delete Action Button */}
      <button
        type="button"
        className="delete-card-btn hover-lift"
        onClick={handleDelete}
        title="Delete Exam from Database"
        disabled={isDeleting}
      >
        <FaTrash className="trash-icon" />
      </button>

      {/* Top Meta Badges Header */}
      <div className="card-top-bar">
        <span className="category-tag">{category}</span>
        <span className={`difficulty-badge ${difficulty.toLowerCase()}`}>
          {difficulty}
        </span>
      </div>

      {/* Main Content Info */}
      <h2>{title}</h2>
      <p>{description}</p>

      {/* Primary Metrics Grid */}
      <div className="exam-info">
        <span>
          <FaClock className="info-icon" />
          {duration} Mins
        </span>
        <span>
          <FaQuestionCircle className="info-icon" />
          {questionsCount} Questions
        </span>
        <span>
          <FaAward className="info-icon" />
          {totalMarks} Marks
        </span>
      </div>

      {/* Security / Proctored Notice Indicator */}
      <div className="proctor-status">
        <FaShieldAlt className="proctor-icon" />
        <span>AI Proctored Assessment</span>
      </div>

      {/* Interactive Action Button */}
      <button 
        type="button" 
        className="btn-start-exam" 
        onClick={() => onStart(exam)}
        disabled={isDeleting}
      >
        <span>Start Exam</span>
        <FaArrowRight className="btn-arrow" />
      </button>

      {/* Footer Timestamp for Future Sorting */}
      <div className="card-footer-date">
        <FaCalendarAlt className="date-icon" />
        <span>Created: {formattedDate}</span>
      </div>
    </div>
  );
}

export default ExamCard;