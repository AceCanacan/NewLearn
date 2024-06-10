import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FlashcardInput.css';

function FlashcardInput() {
  const { deckName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(savedFlashcards);
  }, [deckName]);

  const saveFlashcardsToLocalStorage = (cards) => {
    localStorage.setItem(deckName, JSON.stringify(cards));
    updateDeckTermsCount(deckName, cards.length);
  };

  const updateDeckTermsCount = (deckName, count) => {
    const decks = JSON.parse(localStorage.getItem('decks')) || {};
    decks[deckName] = decks[deckName] || [];
    decks[deckName].length = count;
    localStorage.setItem('decks', JSON.stringify(decks));
  };

  const handleSave = () => {
    setEditIndex(null);
    saveFlashcardsToLocalStorage(flashcards);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      const newFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(newFlashcards);
      saveFlashcardsToLocalStorage(newFlashcards);
    }
  };

  const handleRenameDeck = () => {
    if (newDeckName && newDeckName !== deckName) {
      const decks = JSON.parse(localStorage.getItem('decks')) || {};
      decks[newDeckName] = decks[deckName];
      delete decks[deckName];
      localStorage.setItem('decks', JSON.stringify(decks));
      localStorage.setItem(newDeckName, localStorage.getItem(deckName));
      localStorage.removeItem(deckName);
      setIsEditingDeck(false);
      navigate(`/deck/${newDeckName}`);
    }
  };

  const handleDeleteDeck = () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      const decks = JSON.parse(localStorage.getItem('decks')) || {};
      delete decks[deckName];
      localStorage.setItem('decks', JSON.stringify(decks));
      localStorage.removeItem(deckName);
      navigate('/');
    }
  };

  const handleAddFlashcard = () => {
    setFlashcards([...flashcards, { question: '', answer: '' }]);
    setEditIndex(flashcards.length);
  };

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
  };

  return (
    <div className="flashcard-input">
      <h3>
        {isEditingDeck ? (
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
          />
        ) : (
          newDeckName
        )}
      </h3>
      <div className="deck-actions">
        <button onClick={isEditingDeck ? handleRenameDeck : () => setIsEditingDeck(true)}>
          {isEditingDeck ? 'Save' : 'Edit Deck'}
        </button>
        {isEditingDeck && (
          <>
            <button onClick={handleDeleteDeck}>Delete Deck</button>
            <button onClick={() => setIsEditingDeck(false)}>Cancel</button>
          </>
        )}
      </div>
      <button className="add-button" onClick={handleAddFlashcard}>+ Add Flashcard</button>
      <div className="flashcard-list">
        {flashcards.map((flashcard, index) => (
          <div key={index} className="flashcard">
            <div className="flashcard-content">
              <div className="flashcard-question">
                <label>Question</label>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={flashcard.question}
                    onChange={(e) => handleInputChange(index, 'question', e.target.value)}
                  />
                ) : (
                  <p>{flashcard.question}</p>
                )}
              </div>
              <div className="vertical-line"></div>
              <div className="flashcard-answer">
                <label>Answer</label>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={flashcard.answer}
                    onChange={(e) => handleInputChange(index, 'answer', e.target.value)}
                  />
                ) : (
                  <p>{flashcard.answer}</p>
                )}
              </div>
              <div className="flashcard-buttons">
                <button
                  className="edit-button"
                  onClick={() => {
                    if (editIndex === index) {
                      handleSave();
                    } else {
                      handleEdit(index);
                    }
                  }}
                >
                  {editIndex === index ? 'Save' : 'Edit'}
                </button>
                {editIndex === index && (
                  <button className="delete-button" onClick={() => handleDelete(index)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link to={`/test/${deckName}`} className="test-link">
        <button>Test Yourself</button>
      </Link>
    </div>
  );
}

export default FlashcardInput;
