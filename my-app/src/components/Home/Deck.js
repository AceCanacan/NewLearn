// src/components/Deck/Deck.js
import React, { useState } from 'react';
import FlashcardInput from '../FlashcardInput/FlashcardInput';

function Deck() {
  const [decks, setDecks] = useState({});
  const [currentDeck, setCurrentDeck] = useState(null);

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
    setCurrentDeck(deckName);
  };

  return (
    <div>
      <FlashcardInput addFlashcard={addFlashcard} saveDeck={saveDeck} />
      <div className="deck-list">
        {Object.keys(decks).map((deckName) => (
          <div key={deckName} className="deck">
            <h3>{deckName}</h3>
            {decks[deckName].map((flashcard, index) => (
              <div key={index} className="flashcard">
                <p><strong>Q:</strong> {flashcard.question}</p>
                <p><strong>A:</strong> {flashcard.answer}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Deck;