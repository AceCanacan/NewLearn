import React from "react";
import { useNavigate } from "react-router-dom";
import "./TestResults.css";

const TestResults = ({ results, flashcards, onRetake, deckName }) => {
  const navigate = useNavigate();

  const correctCount = results.filter((result) => result.correct).length;
  const totalQuestions = flashcards.length;

  return (
    <div className="test-results">
      <h2>Test Results</h2>
      <p className="summary">
        You answered <strong>{correctCount}</strong> out of{" "}
        <strong>{totalQuestions}</strong> questions correctly.
      </p>
      <div className="results-list">
        {results.map((result, index) => (
          <div key={index} className="result-card">
            <div className="result-card-header">
              <h3>Question {index + 1}</h3>
              <p
                className={`result-status ${
                  result.correct
                    ? "correct"
                    : result.skipped
                    ? "skipped"
                    : "incorrect"
                }`}
              >
                {result.correct
                  ? "✔️ Correct"
                  : result.skipped
                  ? "⏭️ Skipped"
                  : "❌ Incorrect"}
              </p>
            </div>
            <div className="result-card-body">
              <p className="question-text">{flashcards[index].question}</p>
              <p
                className={`your-answer ${
                  result.correct ? "correct" : "incorrect"
                }`}
              >
                <strong>Your Answer:</strong> {result.userAnswer || "No Answer"}
              </p>
              <p className="correct-answer">
                <strong>Correct Answer:</strong> {flashcards[index].answer}
              </p>
              {result.hintUsed && <p className="hint-used">Hint Used</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="results-buttons">
        <button className="btn btn-primary" onClick={onRetake}>
          Retake Test
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
        >
          Back to Flashcard
        </button>
      </div>
    </div>
  );
};

export default TestResults;