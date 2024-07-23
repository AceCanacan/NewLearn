import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase'; // Adjust the path as needed
import { onAuthStateChanged } from 'firebase/auth'
import './FlashcardInput.css';

// Utility functions for Firestore operations
const loadFromFirestore = async (docPath, defaultValue) => {
  console.log("Loading data from Firestore document:", docPath);
  try {
    const docRef = doc(db, ...docPath.split('/'));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      return docSnap.data();
    } else {
      console.warn("No such document at:", docPath);
      return defaultValue;
    }
  } catch (error) {
    console.error("Error loading data from Firestore document:", docPath, error);
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    console.log(`Saving data to Firestore document: ${docPath}`, value);
    await setDoc(docRef, value);
    console.log(`Data saved to Firestore document: ${docPath}`);
  } catch (error) {
    console.error(`Error saving data to Firestore document: ${docPath}`, error);
  }
};

const removeFromFirestore = async (docPath) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    console.log(`Removing document from Firestore: ${docPath}`);
    await deleteDoc(docRef);
    console.log(`Document removed from Firestore: ${docPath}`);
  } catch (error) {
    console.error(`Error removing document from Firestore: ${docPath}`, error);
  }
};

const loadDeckFlashcards = async (userId, deckName) => {
  const docPath = `users/${userId}/decks/${deckName}`;
  console.log("Loading flashcards for user:", userId, "deck:", deckName);
  const deckData = await loadFromFirestore(docPath, { flashcards: [] });
  const flashcards = deckData.flashcards || [];
  console.log("Flashcards successfully loaded:", flashcards);
  return flashcards;
};

const saveDeckFlashcards = async (userId, deckName, flashcards) => {
  const deckData = { flashcards };
  console.log(`Preparing to save flashcards for user: ${userId}, deck: ${deckName}`, deckData);
  await saveToFirestore(`users/${userId}/decks/${deckName}`, deckData);
  console.log(`Flashcards successfully saved for user: ${userId}, deck: ${deckName}`, deckData);
};


const removeDeckFlashcards = async (userId, deckName) => {
  console.log(`Removing flashcards for user: ${userId}, deck: ${deckName}`);
  await removeFromFirestore(`users/${userId}/decks/${deckName}`);
  console.log(`Flashcards removed for user: ${userId}, deck: ${deckName}`);
};


function FlashcardInput() {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Flashcard-related state
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  // Deck-related state
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);

  // Test-related state
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false); // Assuming default as false
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log('User signed in:', currentUser);
      } else {
        setUser(null);
        console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (user) {
        console.log("User ID:", user.uid);
        console.log("Deck Name:", deckName);
  
        // Fetch flashcards
        const storedFlashcards = await loadDeckFlashcards(user.uid, deckName);
        console.log("Fetched Flashcards:", storedFlashcards);
        setFlashcards(storedFlashcards);
  
        // Fetch test progress
        const testProgressPath = `users/${user.uid}/settings/${deckName}-progress`;
        console.log("Fetching test progress from:", testProgressPath);
        const testProgress = await loadFromFirestore(testProgressPath, { testInProgress: false });
        console.log("Fetched Test Progress:", testProgress);
        setTestState((prevState) => ({ ...prevState, ...testProgress }));
  
        // Show disclaimer if there is previous progress
        if (testProgress.testInProgress) {
          setShowDisclaimer(true);
        }
      }
    };
  
    if (user) {
      fetchFlashcards();
    }
  }, [deckName, user]);
  
  
  // Save shuffleEnabled to Firestore
  useEffect(() => {
    const saveShuffleEnabled = async () => {
      if (user) {
        await saveToFirestore(`users/${user.uid}/settings/${deckName}`, { shuffleEnabled });
      }
    };
    saveShuffleEnabled();
  }, [shuffleEnabled, deckName, user]);
  
   

  const startOver = async () => {
    if (user) {
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
  
      for (const key of keysToRemove) {
        await removeFromFirestore(`users/${user.uid}/settings`, key);
      }
  
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
  
      const storedFlashcards = await loadDeckFlashcards(user.uid, deckName);
      setFlashcards(storedFlashcards);
      setTestState((prevState) => ({ ...prevState, shuffledFlashcards: storedFlashcards }));
  
      await saveToFirestore(`users/${user.uid}/settings`, `${deckName}-shuffled`, { shuffled: storedFlashcards });
      await saveToFirestore(`users/${user.uid}/settings`, `${deckName}-currentIndex`, { currentIndex: 0 });
  
      navigate(`/test/${deckName}`);
    }
  };
  

  const continueTest = async () => {
    setShowDisclaimer(false);

    const storedFlashcards = await loadDeckFlashcards(deckName);
    const storedShuffled = await loadFromFirestore(`${deckName}-shuffled`, storedFlashcards);
    const storedCurrentIndex = await loadFromFirestore(`${deckName}-currentIndex`, 0);
    const storedCorrectlyAnsweredQuestions = new Set(await loadFromFirestore(`${deckName}-correctlyAnsweredQuestions`, []));
    const storedCorrectAnswers = await loadFromFirestore(`${deckName}-correctAnswers`, 0);
    const storedHintUsed = await loadFromFirestore(`${deckName}-hintUsed`, false);
    const storedTypedAnswer = await loadFromFirestore(`${deckName}-typedAnswer`, '');
    const storedWasCorrect = await loadFromFirestore(`${deckName}-wasCorrect`, false);
    const storedComparisonResult = await loadFromFirestore(`${deckName}-comparisonResult`, '');
    const storedFeedback = await loadFromFirestore(`${deckName}-feedback`, '');
    const storedShowAnswer = await loadFromFirestore(`${deckName}-showAnswer`, false);
    const storedIsRecording = await loadFromFirestore(`${deckName}-isRecording`, false);
    const storedLastCorrectAnswer = await loadFromFirestore(`${deckName}-lastCorrectAnswer`, '');
    const storedShowFeedback = await loadFromFirestore(`${deckName}-showFeedback`, false);
    const storedIsFeedbackLoading = await loadFromFirestore(`${deckName}-isFeedbackLoading`, false);
    const storedHasFeedbackBeenProvided = await loadFromFirestore(`${deckName}-hasFeedbackBeenProvided`, false);
    const storedNewAnswerProvided = await loadFromFirestore(`${deckName}-newAnswerProvided`, false);
    const storedFinished = await loadFromFirestore(`${deckName}-finished`, false);
    const storedTypingMode = await loadFromFirestore(`${deckName}-typingMode`, false);
    const storedScore = await loadFromFirestore(`${deckName}-score`, 0);
    const storedHintsUsed = await loadFromFirestore(`${deckName}-hintsUsed`, 0);
    const storedWrongAttempts = await loadFromFirestore(`${deckName}-wrongAttempts`, 0);
    const storedQuestionStates = await loadFromFirestore(`${deckName}-questionStates`, {});

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

  const handleTestYourself = async () => {
    if (shuffleEnabled) {
      const shuffled = shuffleArray(flashcards);
      await saveToFirestore('settings', `${deckName}-shuffled`, { shuffled });
      setTestState((prevState) => ({ ...prevState, shuffledFlashcards: shuffled }));
    } else {
      await saveToFirestore('settings', `${deckName}-shuffled`, { shuffled: flashcards });
      setTestState((prevState) => ({ ...prevState, shuffledFlashcards: flashcards }));
    }
    await saveToFirestore('settings', `${deckName}-currentIndex`, { currentIndex: 0 });
    setTestState((prevState) => ({ ...prevState, currentCardIndex: 0 }));
    navigate(`/test/${deckName}`);
  };

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const handleSave = () => {
    if (user) {
      saveDeckFlashcards(user.uid, deckName, flashcards);
      setEditIndex(null);
    }
  };  

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (user && window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.')) {
      const newFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(newFlashcards);
      saveDeckFlashcards(user.uid, deckName, newFlashcards);
    }
  };
  

  const handleRenameDeck = async () => {
    if (newDeckName && newDeckName !== deckName && user) {
      const flashcards = await loadDeckFlashcards(user.uid, deckName);
      await removeDeckFlashcards(user.uid, deckName);
      await saveDeckFlashcards(user.uid, newDeckName, flashcards);
      setIsEditingDeck(false);
      navigate(`/deck/${newDeckName}`);
    }
  };
  

  const handleDeleteDeck = async () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.') && user) {
      await removeDeckFlashcards(user.uid, deckName);
      navigate('/');
    }
  };

  const handleAddFlashcard = () => {
    const newFlashcards = [...flashcards, { question: '', answer: '' }];
    setFlashcards(newFlashcards);
    if (user) {
      saveDeckFlashcards(user.uid, deckName, newFlashcards);
    }
    setEditIndex(newFlashcards.length - 1);
  };
  

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
    // Remove the saveDeckFlashcards call from here
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
