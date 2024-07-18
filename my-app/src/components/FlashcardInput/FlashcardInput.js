// FlashcardInput.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './FlashcardInput.css';

// Utility functions for local storage operations
const loadFromLocalStorage = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const saveToLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const removeFromLocalStorage = (key) => {
  localStorage.removeItem(key);
};

const loadDeckFlashcards = (deckName) => {
  return loadFromLocalStorage(deckName, []);
};

const saveDeckFlashcards = (deckName, flashcards) => {
  saveToLocalStorage(deckName, flashcards);
  const decks = loadFromLocalStorage('decks', {});
  decks[deckName] = flashcards.length;
  saveToLocalStorage('decks', decks);
};

const removeDeckFlashcards = (deckName) => {
  removeFromLocalStorage(deckName);
  const decks = loadFromLocalStorage('decks', {});
  delete decks[deckName];
  saveToLocalStorage('decks', decks);
};

function FlashcardInput() {
  const { deckName } = useParams();
  const navigate = useNavigate();

  // Flashcard-related state
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  // Deck-related state
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);

  // Test-related state
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(loadFromLocalStorage(`${deckName}-shuffleEnabled`, false));
  const [testState, setTestState] = useState({
    shuffledFlashcards: [],
    currentCardIndex: 0,
    correctlyAnsweredQuestions: new Set(),
    correctAnswers: 0,
    hintUsed: false,
    typedAnswer: '',
    wasCorrect: false,
    comparisonResult: '',
    feedback: '',
    showAnswer: false,
    isRecording: false,
    lastCorrectAnswer: '',
    showFeedback: false,
    isFeedbackLoading: false,
    hasFeedbackBeenProvided: false,
    newAnswerProvided: false,
    finished: false,
    typingMode: false,
    score: 0,
    hintsUsed: 0,
    wrongAttempts: 0,
    questionStates: {},
    testInProgress: false,
  });

  // Load flashcards and test progress
  useEffect(() => {
    const storedFlashcards = loadDeckFlashcards(deckName);
    setFlashcards(storedFlashcards);

    const testProgress = loadFromLocalStorage(`${deckName}-testInProgress`, false);
    setTestState((prevState) => ({ ...prevState, testInProgress: testProgress }));
  }, [deckName]);

  // Save shuffleEnabled to local storage
  useEffect(() => {
    saveToLocalStorage(`${deckName}-shuffleEnabled`, shuffleEnabled);
  }, [shuffleEnabled, deckName]);

  const startOver = () => {
    const keysToRemove = [
      `${deckName}-shuffled`,
      `${deckName}-currentIndex`,
      `${deckName}-correctAnswers`,
      `${deckName}-correctlyAnsweredQuestions`,
      `${deckName}-hintUsed`,
      `${deckName}-typedAnswer`,
      `${deckName}-wasCorrect`,
      `${deckName}-comparisonResult`,
      `${deckName}-feedback`,
      `${deckName}-showAnswer`,
      `${deckName}-isRecording`,
      `${deckName}-lastCorrectAnswer`,
      `${deckName}-showFeedback`,
      `${deckName}-isFeedbackLoading`,
      `${deckName}-hasFeedbackBeenProvided`,
      `${deckName}-newAnswerProvided`,
      `${deckName}-finished`,
      `${deckName}-typingMode`,
      `${deckName}-score`,
      `${deckName}-hintsUsed`,
      `${deckName}-wrongAttempts`,
      `${deckName}-feedbacks`,
      `${deckName}-showFeedbacks`,
      `${deckName}-feedbackButtonDisabled`,
      `${deckName}-questionStates`,
      `${deckName}-sendButtonDisabled`,
      `${deckName}-testInProgress`,
    ];

    keysToRemove.forEach(removeFromLocalStorage);

    setShowDisclaimer(false);
    setTestState({
      shuffledFlashcards: [],
      currentCardIndex: 0,
      correctlyAnsweredQuestions: new Set(),
      correctAnswers: 0,
      hintUsed: false,
      typedAnswer: '',
      wasCorrect: false,
      comparisonResult: '',
      feedback: '',
      showAnswer: false,
      isRecording: false,
      lastCorrectAnswer: '',
      showFeedback: false,
      isFeedbackLoading: false,
      hasFeedbackBeenProvided: false,
      newAnswerProvided: false,
      finished: false,
      typingMode: false,
      score: 0,
      hintsUsed: 0,
      wrongAttempts: 0,
      questionStates: {},
      testInProgress: false,
    });

    const storedFlashcards = loadDeckFlashcards(deckName);
    setFlashcards(storedFlashcards);
    setTestState((prevState) => ({ ...prevState, shuffledFlashcards: storedFlashcards }));
    saveToLocalStorage(`${deckName}-shuffled`, storedFlashcards);
    saveToLocalStorage(`${deckName}-currentIndex`, 0);

    navigate(`/test/${deckName}`);
  };

  const continueTest = () => {
    setShowDisclaimer(false);
    const storedFlashcards = loadDeckFlashcards(deckName);
    const storedShuffled = loadFromLocalStorage(`${deckName}-shuffled`, storedFlashcards);
    const storedCurrentIndex = loadFromLocalStorage(`${deckName}-currentIndex`, 0);
    const storedCorrectlyAnsweredQuestions = new Set(loadFromLocalStorage(`${deckName}-correctlyAnsweredQuestions`, []));
    const storedCorrectAnswers = loadFromLocalStorage(`${deckName}-correctAnswers`, 0);
    const storedHintUsed = loadFromLocalStorage(`${deckName}-hintUsed`, false);
    const storedTypedAnswer = loadFromLocalStorage(`${deckName}-typedAnswer`, '');
    const storedWasCorrect = loadFromLocalStorage(`${deckName}-wasCorrect`, false);
    const storedComparisonResult = loadFromLocalStorage(`${deckName}-comparisonResult`, '');
    const storedFeedback = loadFromLocalStorage(`${deckName}-feedback`, '');
    const storedShowAnswer = loadFromLocalStorage(`${deckName}-showAnswer`, false);
    const storedIsRecording = loadFromLocalStorage(`${deckName}-isRecording`, false);
    const storedLastCorrectAnswer = loadFromLocalStorage(`${deckName}-lastCorrectAnswer`, '');
    const storedShowFeedback = loadFromLocalStorage(`${deckName}-showFeedback`, false);
    const storedIsFeedbackLoading = loadFromLocalStorage(`${deckName}-isFeedbackLoading`, false);
    const storedHasFeedbackBeenProvided = loadFromLocalStorage(`${deckName}-hasFeedbackBeenProvided`, false);
    const storedNewAnswerProvided = loadFromLocalStorage(`${deckName}-newAnswerProvided`, false);
    const storedFinished = loadFromLocalStorage(`${deckName}-finished`, false);
    const storedTypingMode = loadFromLocalStorage(`${deckName}-typingMode`, false);
    const storedScore = loadFromLocalStorage(`${deckName}-score`, 0);
    const storedHintsUsed = loadFromLocalStorage(`${deckName}-hintsUsed`, 0);
    const storedWrongAttempts = loadFromLocalStorage(`${deckName}-wrongAttempts`, 0);
    const storedQuestionStates = loadFromLocalStorage(`${deckName}-questionStates`, {});

    setFlashcards(storedFlashcards);
    setTestState((prevState) => ({
      ...prevState,
      shuffledFlashcards: storedShuffled,
      currentCardIndex: storedCurrentIndex,
      correctlyAnsweredQuestions: storedCorrectlyAnsweredQuestions,
      correctAnswers: storedCorrectAnswers,
      hintUsed: storedHintUsed,
      typedAnswer: storedTypedAnswer,
      wasCorrect: storedWasCorrect,
      comparisonResult: storedComparisonResult,
      feedback: storedFeedback,
      showAnswer: storedShowAnswer,
      isRecording: storedIsRecording,
      lastCorrectAnswer: storedLastCorrectAnswer,
      showFeedback: storedShowFeedback,
      isFeedbackLoading: storedIsFeedbackLoading,
      hasFeedbackBeenProvided: storedHasFeedbackBeenProvided,
      newAnswerProvided: storedNewAnswerProvided,
      finished: storedFinished,
      typingMode: storedTypingMode,
      score: storedScore,
      hintsUsed: storedHintsUsed,
      wrongAttempts: storedWrongAttempts,
      questionStates: storedQuestionStates,
      testInProgress: false,
    }));

    navigate(`/test/${deckName}`);
  };

  const handleTestYourself = () => {
    if (shuffleEnabled) {
      const shuffled = shuffleArray(flashcards);
      saveToLocalStorage(`${deckName}-shuffled`, shuffled);
      setTestState((prevState) => ({ ...prevState, shuffledFlashcards: shuffled }));
    } else {
      saveToLocalStorage(`${deckName}-shuffled`, flashcards);
      setTestState((prevState) => ({ ...prevState, shuffledFlashcards: flashcards }));
    }
    setTestState((prevState) => ({ ...prevState, currentCardIndex: 0 }));
    navigate(`/test/${deckName}`);
  };

// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^
// with backend ^^^^

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const handleSave = () => {
    saveDeckFlashcards(deckName, flashcards);
    setEditIndex(null);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      const newFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(newFlashcards);
      saveDeckFlashcards(deckName, newFlashcards);
    }
  };

  const handleRenameDeck = () => {
    if (newDeckName && newDeckName !== deckName) {
      const flashcards = loadDeckFlashcards(deckName);
      removeDeckFlashcards(deckName);
      saveDeckFlashcards(newDeckName, flashcards);
      setIsEditingDeck(false);
      navigate(`/deck/${newDeckName}`);
    }
  };

  const handleDeleteDeck = () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      removeDeckFlashcards(deckName);
      navigate('/');
    }
  };

  const handleAddFlashcard = () => {
    const newFlashcards = [...flashcards, { question: '', answer: '' }];
    setFlashcards(newFlashcards);
    setEditIndex(newFlashcards.length - 1);
    saveDeckFlashcards(deckName, newFlashcards);
  };

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
    saveDeckFlashcards(deckName, newFlashcards);
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

      {(showDisclaimer || testState.testInProgress) ? (
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
          <Link to={`/score-report/${deckName}`} className="test-link">
            <button>View Scores</button>
          </Link>
          <button className="test-link" onClick={() => {
            if (localStorage.getItem(`${deckName}-generated`) === 'true') {
              alert('You have already used the QuizMaker feature for this deck.');
            } else {
              navigate(`/quizmaker/${deckName}`);
            }
          }}>Go to QuizMaker</button>
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
