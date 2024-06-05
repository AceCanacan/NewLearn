import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Deck.css';

function Deck() {
  const [decks, setDecks] = useState({});

  // Retrieve decks from localStorage on component mount
  useEffect(() => {
    const storedDecks = JSON.parse(localStorage.getItem('decks')) || {};
    setDecks(storedDecks);
  }, []);

  const saveDeck = (deckName) => {
    if (!decks[deckName]) {
      const newDecks = { ...decks, [deckName]: [] };
      setDecks(newDecks);
      localStorage.setItem('decks', JSON.stringify(newDecks));
    }
  };

  const handleCreateNewDeck = () => {
    const newDeckName = prompt("Enter the name for the new deck:");
    if (newDeckName) {
      saveDeck(newDeckName);
    }
  };

  return (
    <div>
      <h2>Deck Catalog</h2>
      <div className="deck-list">
        {Object.keys(decks).map((deckName) => (
          <Link to={`/deck/${deckName}`} key={deckName} className="deck">
            <h3>{deckName}</h3>
          </Link>
        ))}
      </div>
      <button onClick={handleCreateNewDeck}>Create New Deck</button>
    </div>
  );
}

export default Deck;
