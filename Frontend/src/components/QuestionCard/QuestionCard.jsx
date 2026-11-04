import React from "react";
import "./QuestionCard.css";

function QuestionCard({
  questionNumber,
  question,
  options = [],
  selectedAnswer,
  setSelectedAnswer
}) {
  const getOptionPrefix = (index) => String.fromCharCode(65 + index); // Generates A, B, C, D...

  return (
    <div className="question-card">
      <div className="question-header">
        <h3>Question {questionNumber}</h3>
        <span className="question-type-badge">MCQ</span>
      </div>

      <div className="question-text">
        <p>{question}</p>
      </div>

      <div className="options-container">
        {options.length > 0 ? (
          options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const inputId = `q${questionNumber}-option-${index}`;

            return (
              <div
                key={index}
                className={`option-tile ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedAnswer(option)}
              >
                <div className="option-prefix">{getOptionPrefix(index)}</div>

                <input
                  type="radio"
                  id={inputId}
                  name={`question-${questionNumber}`}
                  checked={isSelected}
                  onChange={() => setSelectedAnswer(option)}
                />

                <label htmlFor={inputId} className="option-label">
                  {option}
                </label>
              </div>
            );
          })
        ) : (
          <p className="no-options-text">No options available for this question.</p>
        )}
      </div>
    </div>
  );
}

export default QuestionCard;