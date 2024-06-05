import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './FlashcardInput.css';

function FlashcardInput() {
  const { deckName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    // Logic to fetch existing flashcards if necessary
    const savedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(savedFlashcards);
  }, [deckName]);

  const saveFlashcardsToLocalStorage = (cards) => {
    localStorage.setItem(deckName, JSON.stringify(cards));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newFlashcards = [...flashcards];
    if (editIndex !== null) {
      newFlashcards[editIndex] = { question, answer };
      setEditIndex(null);
    } else {
      newFlashcards.push({ question, answer });
    }
    setFlashcards(newFlashcards);
    saveFlashcardsToLocalStorage(newFlashcards);
    setQuestion('');
    setAnswer('');
  };

  const handleEdit = (index) => {
    setQuestion(flashcards[index].question);
    setAnswer(flashcards[index].answer);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const newFlashcards = flashcards.filter((_, i) => i !== index);
    setFlashcards(newFlashcards);
    saveFlashcardsToLocalStorage(newFlashcards);
  };

  return (
    <div className="flashcard-input">
      <h3>Deck: {deckName}</h3>
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
        <button type="submit">{editIndex !== null ? 'Update Flashcard' : 'Save Flashcard'}</button>
      </form>
      <div className="flashcard-list">
        {flashcards.map((flashcard, index) => (
          <div key={index} className="flashcard">
            <p><strong>Q:</strong> {flashcard.question}</p>
            <p><strong>A:</strong> {flashcard.answer}</p>
            <button onClick={() => handleEdit(index)}>Edit</button>
            <button onClick={() => handleDelete(index)}>Delete</button>
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