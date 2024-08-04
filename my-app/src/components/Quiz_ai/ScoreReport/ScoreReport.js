import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../../../firebase/firebase';
import './ScoreReport.css';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const loadFromFirestore = async (docPath, defaultValue) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading data from Firestore document: ${docPath}`, error);
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
        [deckName]: data[deckName]
      });
    }
  }
};

const ScoreReport = () => {
  const { deckName } = useParams();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      const user = auth.currentUser;
      if (user) {
        const storedScores = await loadFromFirestore(`users/${user.uid}/settings/scores`, {});
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
      <h2>Score Report for {deckName}</h2>
      {scores.length === 0 ? (
        <p>No scores available for this deck.</p>
      ) : (
        <ul>
          {scores.map((scoreEntry, index) => (
            <li key={index}>
              <div className="score-entry">
                <p><strong>Score:</strong> {scoreEntry.score.toFixed(2)}%</p>
                <p><strong>Date:</strong> {new Date(scoreEntry.date).toLocaleString()}</p>
                <p><strong>Report:</strong></p>
                <ul>
                  <li><strong>Hints Used:</strong> {scoreEntry.report.hintsUsed}</li>
                  <li><strong>Answers Shown:</strong> {scoreEntry.report.answersShown}</li>
                  <li><strong>Multiple Attempts:</strong> {scoreEntry.report.multipleAttempts}</li>
                  <li><strong>Perfectly Answered:</strong> {scoreEntry.report.answeredPerfectly}</li>
                </ul>
                <button onClick={() => handleDelete(index)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/deck/${deckName}`}>Back</Link>
    </div>
  );
};

export default ScoreReport;
