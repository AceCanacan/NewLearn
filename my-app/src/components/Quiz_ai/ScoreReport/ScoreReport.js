// src/components/Quiz_ai/ScoreReport.js

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase/firebase";
import "./ScoreReport.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import TestResults from "../Test/TestResults";

const loadFromFirestore = async (docPath, defaultValue) => {
  try {
    const docRef = doc(db, ...docPath.split("/"));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return defaultValue;
    }
  } catch (error) {
    console.error(
      `Error loading data from Firestore document: ${docPath}`,
      error
    );
    return defaultValue;
  }
};

const deleteScoreFromFirestore = async (userId, deckName, index) => {
  const docRef = doc(db, `users/${userId}/settings/scores`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data[deckName]) {
      data[deckName].splice(index, 1); // Remove the score entry at the specified index
      await updateDoc(docRef, {
        [deckName]: data[deckName],
      });
    }
  }
};

const AttemptCard = ({ scoreEntry, index, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    setTestResults(scoreEntry.testResult); // The saved test result is passed here
  }, [scoreEntry]);

  return (
    <div className={`attempt-card ${isExpanded ? "expanded" : ""}`}>
      <div
        className="attempt-summary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="summary-left">
          <p>
            <strong>Score:</strong> {scoreEntry.score.toFixed(2)}%
          </p>
          <p>
            <strong>Date:</strong> {new Date(scoreEntry.date).toLocaleString()}
          </p>
        </div>
        <div className="summary-right">{isExpanded ? "▲" : "▼"}</div>
      </div>
      {isExpanded && testResults && (
        <div className="attempt-details">
          <TestResults
            results={testResults.results}
            flashcards={testResults.flashcards}
            deckName={testResults.deckName}
            onRetake={() => {
              // Optional: Implement retake functionality if needed
              // For example, navigate to the test page with the deckName
            }}
          />
        </div>
      )}
      <button className="delete-button" onClick={() => onDelete(index)}>
        Delete
      </button>
    </div>
  );
};

const ScoreReport = () => {
  const { deckName } = useParams();
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      const user = auth.currentUser;
      if (user) {
        const storedScores = await loadFromFirestore(
          `users/${user.uid}/settings/scores`,
          {}
        );
        if (storedScores[deckName]) {
          setScores(storedScores[deckName]);
        }
      }
    };
    fetchScores();
  }, [deckName]);

  const handleDelete = async (index) => {
    const user = auth.currentUser;
    if (user) {
      await deleteScoreFromFirestore(user.uid, deckName, index);
      setScores((prevScores) => prevScores.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="score-report">
      <button
        className="st-back-button"
        onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
      >
        <i className="fas fa-arrow-left"></i>
      </button>
      <h2>Score Report for "{deckName}"</h2>
      {scores.length === 0 ? (
        <p>No scores available for this deck.</p>
      ) : (
        <div className="attempts-list">
          {scores.map((scoreEntry, index) => (
            <AttemptCard
              key={index}
              scoreEntry={scoreEntry}
              index={index}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreReport;
