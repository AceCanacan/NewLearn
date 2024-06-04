// src/components/Home/Deck.js
import React, { useState } from 'react';
import FlashcardInput from '../FlashcardInput/FlashcardInput';
import './Deck.css';

function Deck() {
  const [decks, setDecks] = useState({});
  const [currentDeck, setCurrentDeck] = useState(null);
  const [newDeckName, setNewDeckName] = useState('');

  const addFlashcard = ({ deckName, question, answer }) => {
    setDecks((prevDecks) => {
      const newDecks = { ...prevDecks };
      if (!newDecks[deckName]) {
        newDecks[deckName] = [];
      }
      newDecks[deckName].push({ question, answer });
      return newDecks;
    });
  };

  const saveDeck = (deckName) => {
    if (!decks[deckName]) {
      setDecks((prevDecks) => ({ ...prevDecks, [deckName]: [] }));
    }
    setCurrentDeck(deckName);
  };

  const handleDeckClick = (deckName) => {
    setCurrentDeck(deckName);
  };

  const handleNewDeckSubmit = (e) => {
    e.preventDefault();
    if (newDeckName) {
      saveDeck(newDeckName);
      setNewDeckName('');
    }
  };

  return (
    <div>
      <h2>Deck Catalog</h2>
      <div className="deck-list">
        {Object.keys(decks).map((deckName) => (
          <div key={deckName} className="deck" onClick={() => handleDeckClick(deckName)}>
            <h3>{deckName}</h3>
          </div>
        ))}
      </div>
      <form onSubmit={handleNewDeckSubmit}>
        <input
          type="text"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          placeholder="New Deck Name"
          required
        />
        <button type="submit">Create New Deck</button>
      </form>
      {currentDeck && (
        <div className="current-deck">
          <h3>Current Deck: {currentDeck}</h3>
          <FlashcardInput addFlashcard={addFlashcard} currentDeck={currentDeck} />
          {decks[currentDeck].map((flashcard, index) => (
            <div key={index} className="flashcard">
              <p><strong>Q:</strong> {flashcard.question}</p>
              <p><strong>A:</strong> {flashcard.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Deck;