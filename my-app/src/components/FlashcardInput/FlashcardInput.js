// src/components/FlashcardInput/FlashcardInput.js
import React, { useState } from 'react';
import './FlashcardInput.css';

function FlashcardInput({ addFlashcard, saveDeck }) {
  const [deckName, setDeckName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question && answer) {
      addFlashcard({ deckName, question, answer });
      setQuestion('');
      setAnswer('');
    }
  };

  const handleSaveDeck = () => {
    if (deckName) {
      saveDeck(deckName);
    }
  };

  return (
    <div className="flashcard-input">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Deck Name</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            required
          />
        </div>
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
        <button type="button" onClick={handleSaveDeck}>Save Deck</button>
      </form>
    </div>
  );
}

export default FlashcardInput;