import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FlashcardInput.css';

function FlashcardInput() {
  const { deckName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const navigate = useNavigate();
  const [shuffleEnabled, setShuffleEnabled] = useState(
    JSON.parse(localStorage.getItem(`${deckName}-shuffleEnabled`)) ?? false
  );  

  const [shuffledFlashcards, setShuffledFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [comparisonResult, setComparisonResult] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [hasFeedbackBeenProvided, setHasFeedbackBeenProvided] = useState(false);
  const [newAnswerProvided, setNewAnswerProvided] = useState(false);
  const [finished, setFinished] = useState(false);
  const [typingMode, setTypingMode] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);


  useEffect(() => {
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(storedFlashcards);
  
    const storedShuffled = localStorage.getItem(`${deckName}-shuffled`);
    const storedCurrentIndex = localStorage.getItem(`${deckName}-currentIndex`);
    const storedCorrectAnswers = localStorage.getItem(`${deckName}-correctAnswers`);
    const storedCorrectlyAnsweredQuestions = localStorage.getItem(`${deckName}-correctlyAnsweredQuestions`);
  
    if (storedShuffled && storedCurrentIndex !== null && storedCorrectAnswers !== null && storedCorrectlyAnsweredQuestions) {
      setShowDisclaimer(true);
    }
  
    // Add this log to print all questions and answers
    console.log('Loaded flashcards:', storedFlashcards);
    storedFlashcards.forEach((card, index) => {
      console.log(`Flashcard ${index + 1}: Question - ${card.question}, Answer - ${card.answer}`);
    });
  }, [deckName]);
  
  
  const handleTestYourself = () => {
    console.log('handleTestYourself called'); // Debug log
    if (shuffleEnabled) {
      const shuffled = shuffleArray(flashcards);
      console.log('Shuffling flashcards:', shuffled); // Debug log
      localStorage.setItem(`${deckName}-shuffled`, JSON.stringify(shuffled));
      setShuffledFlashcards(shuffled);
    } else {
      localStorage.setItem(`${deckName}-shuffled`, JSON.stringify(flashcards)); // Ensure non-shuffled flashcards are saved
      setShuffledFlashcards(flashcards);
    }
    setCurrentCardIndex(0); // Reset current index to 0
    navigate(`/test/${deckName}`);
  };
  
  
  
  
  
  useEffect(() => {
    localStorage.setItem(`${deckName}-shuffleEnabled`, JSON.stringify(shuffleEnabled));
  }, [shuffleEnabled]);
  
  

  const startOver = () => {
    localStorage.removeItem(`${deckName}-currentIndex`);
    localStorage.removeItem(`${deckName}-correctAnswers`);
    localStorage.removeItem(`${deckName}-correctlyAnsweredQuestions`);
    localStorage.removeItem(`${deckName}-shuffled`);
    localStorage.removeItem(`${deckName}-hintUsed`);
    localStorage.removeItem(`${deckName}-typedAnswer`);
    localStorage.removeItem(`${deckName}-wasCorrect`);
    localStorage.removeItem(`${deckName}-comparisonResult`);
    localStorage.removeItem(`${deckName}-feedback`);
    localStorage.removeItem(`${deckName}-showAnswer`);
    localStorage.removeItem(`${deckName}-finished`); // Clear the finished state
    setShowDisclaimer(false);
    navigate(`/test/${deckName}`);
  };
  

  const continueTest = () => {
    setShowDisclaimer(false);
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    const storedShuffled = JSON.parse(localStorage.getItem(`${deckName}-shuffled`)) || storedFlashcards;
    const storedCurrentIndex = parseInt(localStorage.getItem(`${deckName}-currentIndex`), 10) || 0;
    const storedCorrectlyAnsweredQuestions = new Set(JSON.parse(localStorage.getItem(`${deckName}-correctlyAnsweredQuestions`)) || []);
    const storedCorrectAnswers = JSON.parse(localStorage.getItem(`${deckName}-correctAnswers`)) || 0;
    const storedHintUsed = JSON.parse(localStorage.getItem(`${deckName}-hintUsed`)) || false;
    const storedTypedAnswer = localStorage.getItem(`${deckName}-typedAnswer`) || '';
    const storedWasCorrect = JSON.parse(localStorage.getItem(`${deckName}-wasCorrect`));
    const storedComparisonResult = localStorage.getItem(`${deckName}-comparisonResult`) || '';
    const storedFeedback = localStorage.getItem(`${deckName}-feedback`) || '';
    const storedShowAnswer = JSON.parse(localStorage.getItem(`${deckName}-showAnswer`));
    const storedIsRecording = JSON.parse(localStorage.getItem(`${deckName}-isRecording`));
    const storedLastCorrectAnswer = localStorage.getItem(`${deckName}-lastCorrectAnswer`) || '';
    const storedShowFeedback = JSON.parse(localStorage.getItem(`${deckName}-showFeedback`));
    const storedIsFeedbackLoading = JSON.parse(localStorage.getItem(`${deckName}-isFeedbackLoading`));
    const storedHasFeedbackBeenProvided = JSON.parse(localStorage.getItem(`${deckName}-hasFeedbackBeenProvided`));
    const storedNewAnswerProvided = JSON.parse(localStorage.getItem(`${deckName}-newAnswerProvided`));
    const storedFinished = JSON.parse(localStorage.getItem(`${deckName}-finished`));
    const storedTypingMode = JSON.parse(localStorage.getItem(`${deckName}-typingMode`));
    const storedScore = JSON.parse(localStorage.getItem(`${deckName}-score`)) || 0;
    const storedHintsUsed = JSON.parse(localStorage.getItem(`${deckName}-hintsUsed`)) || 0;
    const storedWrongAttempts = JSON.parse(localStorage.getItem(`${deckName}-wrongAttempts`)) || 0;

    setFlashcards(storedFlashcards);
    setShuffledFlashcards(storedShuffled);
    setCurrentCardIndex(storedCurrentIndex);
    setCorrectlyAnsweredQuestions(storedCorrectlyAnsweredQuestions);
    setCorrectAnswers(storedCorrectAnswers);
    setHintUsed(storedHintUsed);
    setTypedAnswer(storedTypedAnswer);
    setWasCorrect(storedWasCorrect);
    setComparisonResult(storedComparisonResult);
    setFeedback(storedFeedback);
    setShowAnswer(storedShowAnswer);
    setIsRecording(storedIsRecording);
    setLastCorrectAnswer(storedLastCorrectAnswer);
    setShowFeedback(storedShowFeedback);
    setIsFeedbackLoading(storedIsFeedbackLoading);
    setHasFeedbackBeenProvided(storedHasFeedbackBeenProvided);
    setNewAnswerProvided(storedNewAnswerProvided);
    setFinished(storedFinished);
    setTypingMode(storedTypingMode);
    setScore(storedScore);
    setHintsUsed(storedHintsUsed);
    setWrongAttempts(storedWrongAttempts);

    navigate(`/test/${deckName}`); // Directly navigate to the test page
};



const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};


const saveFlashcardsToLocalStorage = (cards) => {
  localStorage.setItem(deckName, JSON.stringify(cards));
  const decks = JSON.parse(localStorage.getItem('decks')) || {};
  decks[deckName] = cards.length; // Save the count directly
  localStorage.setItem('decks', JSON.stringify(decks));
  
  // Save other states to local storage
  localStorage.setItem(`${deckName}-shuffled`, JSON.stringify(shuffledFlashcards));
  localStorage.setItem(`${deckName}-currentIndex`, currentCardIndex);
  localStorage.setItem(`${deckName}-correctAnswers`, JSON.stringify(correctAnswers));
  localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...correctlyAnsweredQuestions]));
  localStorage.setItem(`${deckName}-hintUsed`, JSON.stringify(hintUsed));
  localStorage.setItem(`${deckName}-typedAnswer`, typedAnswer);
  localStorage.setItem(`${deckName}-wasCorrect`, JSON.stringify(wasCorrect));
  localStorage.setItem(`${deckName}-comparisonResult`, comparisonResult);
  localStorage.setItem(`${deckName}-feedback`, feedback);
  localStorage.setItem(`${deckName}-showAnswer`, JSON.stringify(showAnswer));
  localStorage.setItem(`${deckName}-isRecording`, JSON.stringify(isRecording));
  localStorage.setItem(`${deckName}-lastCorrectAnswer`, lastCorrectAnswer);
  localStorage.setItem(`${deckName}-showFeedback`, JSON.stringify(showFeedback));
  localStorage.setItem(`${deckName}-isFeedbackLoading`, JSON.stringify(isFeedbackLoading));
  localStorage.setItem(`${deckName}-hasFeedbackBeenProvided`, JSON.stringify(hasFeedbackBeenProvided));
  localStorage.setItem(`${deckName}-newAnswerProvided`, JSON.stringify(newAnswerProvided));
  localStorage.setItem(`${deckName}-finished`, JSON.stringify(finished));
  localStorage.setItem(`${deckName}-typingMode`, JSON.stringify(typingMode));
  localStorage.setItem(`${deckName}-score`, JSON.stringify(score));
  localStorage.setItem(`${deckName}-hintsUsed`, JSON.stringify(hintsUsed));
  localStorage.setItem(`${deckName}-wrongAttempts`, JSON.stringify(wrongAttempts));
};


  const updateDeckTermsCount = (deckName, count) => {
    const decks = JSON.parse(localStorage.getItem('decks')) || {};
    decks[deckName] = decks[deckName] || [];
    decks[deckName].length = count;
    localStorage.setItem('decks', JSON.stringify(decks));
  };

  const handleSave = () => {
    saveFlashcardsToLocalStorage(flashcards);
    setEditIndex(null);
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
    const newFlashcards = [...flashcards, { question: '', answer: '' }];
    setFlashcards(newFlashcards);
    setEditIndex(newFlashcards.length - 1);
    localStorage.setItem(deckName, JSON.stringify(newFlashcards)); // Save to local storage
  };
  
  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
    localStorage.setItem(deckName, JSON.stringify(newFlashcards)); // Save to local storage
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
  <label>
    <input 
      type="checkbox" 
      checked={shuffleEnabled} 
      onChange={(e) => setShuffleEnabled(e.target.checked)} 
    />
    Shuffle Cards
  </label>
</div>

      {showDisclaimer ? (
        <div className="disclaimer-modal">
          <p>You have a test in progress. Would you like to continue or start over?</p>
          <button onClick={startOver}>Start Over</button>
          <button onClick={continueTest}>Continue</button>
        </div>
      ) : (
        <>
          <Link to={`/test/${deckName}`} className="test-link">
            <button onClick={handleTestYourself}>Test Yourself</button>
          </Link>
          <Link to={`/review/${deckName}`} className="test-link">
            <button>Review</button>
          </Link>
        </>
      )}
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
      <button className="add-button" onClick={handleAddFlashcard}>+ Add Flashcard</button>
    </div>
  );
}

export default FlashcardInput;
