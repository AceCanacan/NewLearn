// src/components/Quiz_ai/Test/TestResults.js

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TestResults.css";

const TestResults = ({ results: propResults, flashcards: propFlashcards, deckName: propDeckName, onRetake }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use props if provided; otherwise, use location.state
  const results = propResults || (location.state && location.state.results);
  const flashcards = propFlashcards || (location.state && location.state.flashcards);
  const deckNameFinal = propDeckName || (location.state && location.state.deckName);

  if (!results || !flashcards || !deckNameFinal) {
    return <p>No test results available.</p>;
  }

  const correctCount = results.filter((result) => result.correct).length;
  const totalQuestions = flashcards.length;
  
  return (
    <div className="test-results">
      <h2>Test Results</h2>
      <p className="summary">
        You answered <strong>{correctCount}</strong> out of{" "}
        <strong>{totalQuestions}</strong> questions correctly.
      </p>

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

      <div className="results-buttons">
        {onRetake && (
          <button className="btn btn-primary" onClick={onRetake}>
            Retake Test
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/deck/${deckNameFinal}/flashcard-input`)}
        >
          Back to Flashcard
        </button>
      </div>
    </div>
  );
};

export default TestResults;
