import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Test() {
  const { deckName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Retrieve flashcards from localStorage for the specific deck
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(storedFlashcards);
  }, [deckName]);

  const handleNextCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  return (
    <div className="test-yourself">
      <h3>Test Yourself: {deckName}</h3>
      {flashcards.length > 0 ? (
        <div className="flashcard">
          <p><strong>Q:</strong> {flashcards[currentCardIndex].question}</p>
          {showAnswer && (
            <p><strong>A:</strong> {flashcards[currentCardIndex].answer}</p>
          )}
          {!showAnswer && (
            <button onClick={handleShowAnswer}>Show Answer</button>
          )}
          <button onClick={handleNextCard}>Next</button>
        </div>
      ) : (
        <p>No flashcards available in this deck.</p>
      )}
    </div>
  );
}

export default Test;
