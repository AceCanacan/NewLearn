// src/components/FlashcardInput/FlashcardInput.js
import React, { useState } from 'react';
import './FlashcardInput.css';

function FlashcardInput({ addFlashcard, currentDeck }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question && answer && currentDeck) {
      addFlashcard({ deckName: currentDeck, question, answer });
      setQuestion('');
      setAnswer('');
    }
  };

  return (
    <div className="flashcard-input">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Answer</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
        </div>
        <button type="submit">Save Flashcard</button>
      </form>
    </div>
  );
}

export default FlashcardInput;