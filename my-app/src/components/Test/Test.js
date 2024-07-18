import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Test.css';



// Helper function to shuffle an array
const shuffleArray = (array) => {
  let shuffledArray = array.slice();
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [flashcards, setFlashcards] = useState([]);
  const [shuffledFlashcards, setShuffledFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState('');
  const [hint, setHint] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbacks, setFeedbacks] = useState({});
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [hasFeedbackBeenProvided, setHasFeedbackBeenProvided] = useState(false);
  const [newAnswerProvided, setNewAnswerProvided] = useState(false);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState(new Set());
  const [finished, setFinished] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState({});
  const [feedbackButtonDisabled, setFeedbackButtonDisabled] = useState({});
  const [questionStates, setQuestionStates] = useState({});
  const [sendButtonDisabled, setSendButtonDisabled] = useState(false);

  const [report, setReport] = useState({
    hintsUsed: 0,
    answersShown: 0,
    multipleAttempts: 0,
    answeredPerfectly: 0,
  });

  const HINT_DEDUCTION = 25;
  const WRONG_ATTEMPT_DEDUCTION = 10;

  useEffect(() => {
    const storedFlashcards = loadFromLocalStorage(deckName, []);
    const storedShuffled = loadFromLocalStorage(`${deckName}-shuffled`, storedFlashcards);
    const storedCurrentIndex = loadFromLocalStorage(`${deckName}-currentIndex`, 0);
    const storedCorrectlyAnsweredQuestions = new Set(loadFromLocalStorage(`${deckName}-correctlyAnsweredQuestions`, []));
    const storedCorrectAnswers = loadFromLocalStorage(`${deckName}-correctAnswers`, 0);
    const storedHintUsed = loadFromLocalStorage(`${deckName}-hintUsed`, false);
    const storedHint = loadFromLocalStorage(`${deckName}-hint`, '');
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
    const storedFeedbacks = loadFromLocalStorage(`${deckName}-feedbacks`, {});
    const storedShowFeedbacks = loadFromLocalStorage(`${deckName}-showFeedbacks`, {});
    const storedFeedbackButtonDisabled = loadFromLocalStorage(`${deckName}-feedbackButtonDisabled`, {});
    const storedQuestionStates = loadFromLocalStorage(`${deckName}-questionStates`, {});
    const storedSendButtonDisabled = loadFromLocalStorage(`${deckName}-sendButtonDisabled`, false);

    setFlashcards(storedFlashcards);
    setShuffledFlashcards(storedShuffled);
    setCurrentCardIndex(storedCurrentIndex);
    setCorrectlyAnsweredQuestions(storedCorrectlyAnsweredQuestions);
    setCorrectAnswers(storedCorrectAnswers);
    setHintUsed(storedHintUsed);
    setHint(storedHint);
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
    setFeedbacks(storedFeedbacks);
    setShowFeedbacks(storedShowFeedbacks);
    setFeedbackButtonDisabled(storedFeedbackButtonDisabled);
    setQuestionStates(storedQuestionStates);
    loadQuestionState(storedCurrentIndex);
    setTypedAnswer(storedTypedAnswer);
    setSendButtonDisabled(storedSendButtonDisabled);

  }, [deckName, location.pathname, navigate]);



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

  const updateQuestionStates = (deckName, questionStates) => {
    saveToLocalStorage(`${deckName}-questionStates`, questionStates);
  };

  const updateCorrectlyAnsweredQuestions = (deckName, correctlyAnsweredQuestions) => {
    saveToLocalStorage(`${deckName}-correctlyAnsweredQuestions`, [...correctlyAnsweredQuestions]);
  };

  const loadTypedAnswer = (deckName, index) => {
    return loadFromLocalStorage(`$${deckName}-typedAnswer-$${index}`, '');
  };


  const localStorageKeys = {
    currentCardIndex: 0,
    correctAnswers: 0,
    correctlyAnsweredQuestions: new Set(),
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
    feedbackButtonDisabled: {},
    feedbacks: {},
    showFeedbacks: {},
    questionStates: {},
    sendButtonDisabled: false,
    testInProgress: false
  };


  const saveProgress = () => {
    console.log("saveProgress called");
  
    const dataToSave = {
      currentCardIndex,
      correctAnswers,
      correctlyAnsweredQuestions: [...correctlyAnsweredQuestions],
      hintUsed,
      typedAnswer,
      wasCorrect,
      comparisonResult,
      feedback,
      showAnswer,
      isRecording,
      lastCorrectAnswer,
      showFeedback,
      isFeedbackLoading,
      hasFeedbackBeenProvided,
      newAnswerProvided,
      finished,
      typingMode,
      score,
      hintsUsed,
      wrongAttempts,
      feedbackButtonDisabled,
      feedbacks,
      showFeedbacks,
      questionStates,
      sendButtonDisabled,
      testInProgress: true
    };
  
    // Save progress data to local storage
    saveMultipleToLocalStorage(deckName, dataToSave, currentCardIndex);
  
    console.log("Progress saved");
  };

  const resetState = () => {
    Object.keys(localStorageKeys).forEach(key => {
      const setterFunction = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof window[setterFunction] === 'function') {
        window[setterFunction](localStorageKeys[key]);
      }
    });
  };

  const saveMultipleToLocalStorage = (deckName, data, currentCardIndex) => {
    Object.keys(data).forEach(key => {
      localStorage.setItem(`${deckName}-${key}`, JSON.stringify(data[key]));
    });
    localStorage.setItem(`$${deckName}-typedAnswer-$${currentCardIndex}`, JSON.stringify(data['typedAnswer']));
  };

  const removeMultipleFromLocalStorage = (deckName) => {
    Object.keys(localStorageKeys).forEach(key => removeFromLocalStorage(`${deckName}-${key}`));
  };
  
  const saveProgressAndNavigate = () => {
    saveProgress();
    navigate(`/deck/${deckName}`);
  };

  const wipeProgressAndNavigate = () => {
    removeMultipleFromLocalStorage(deckName);
  
    shuffledFlashcards.forEach((_, index) => {
      removeFromLocalStorage(`$${deckName}-typedAnswer-$${index}`);
    });
  
    navigate(`/deck/${deckName}`);
  };


  const handleFinish = () => {
    if (correctlyAnsweredQuestions.size === shuffledFlashcards.length) {
      const finalScore = calculateFinalScore();
      const scoreEntry = {
        score: finalScore,
        date: new Date().toISOString(),
        report: {
          hintsUsed: report.hintsUsed,
          answersShown: report.answersShown,
          multipleAttempts: report.multipleAttempts,
          answeredPerfectly: report.answeredPerfectly,
        }
      };
  
      setFinished(true);
  
      // Save the final score with details
      const storedScores = loadFromLocalStorage('scores', {});
      const updatedScores = {
        ...storedScores,
        [deckName]: [...(storedScores[deckName] || []), scoreEntry]
      };
      saveToLocalStorage('scores', updatedScores);
  
      // Clear related local storage items
      Object.keys(localStorageKeys).forEach(key => removeFromLocalStorage(`${deckName}-${key}`));
  
      generateReportContent();
    } else {
      alert("You need to answer all questions correctly before finishing the test.");
    }
  };

  const questionKeysSliceIndices = {
    start: 8,
    end: 17
  };
  
  const getSetterFunction = (key) => `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
  
  const resetKeys = (keys, state, defaultValues = {}) => {
    keys.forEach(key => {
      const setterFunction = getSetterFunction(key);
      if (typeof window[setterFunction] === 'function') {
        window[setterFunction](state ? (state[key] || defaultValues[key] || '') : (key in defaultValues ? defaultValues[key] : false));
      }
    });
  };
  
  const loadQuestionState = (index) => {
    const state = questionStates[index];
    const questionKeys = Object.keys(localStorageKeys).slice(questionKeysSliceIndices.start, questionKeysSliceIndices.end);
    const defaultValues = { hintsUsed: 0, wrongAttempts: 0 };
  
    if (state) {
      resetKeys(questionKeys, state, defaultValues);
      setTypedAnswer(loadFromLocalStorage(`$${deckName}-typedAnswer-$${index}`, ''));
    } else {
      resetKeys(questionKeys, null, defaultValues);
      setTypedAnswer('');
    }
  };
  
  const preserveCurrentQuestionState = () => {
    const currentQuestionState = {};
    const questionKeys = Object.keys(localStorageKeys).slice(questionKeysSliceIndices.start, questionKeysSliceIndices.end);
  
    questionKeys.forEach(key => {
      currentQuestionState[key] = window[key];
    });
  
    const updatedQuestionStates = { ...questionStates, [currentCardIndex]: currentQuestionState };
    setQuestionStates(updatedQuestionStates);
    saveToLocalStorage(`${deckName}-questionStates`, updatedQuestionStates);
  };
  
  const retakeTest = () => {
    removeMultipleFromLocalStorage(deckName);
  
    flashcards.forEach((_, index) => {
      removeFromLocalStorage(`$${deckName}-typedAnswer-$${index}`);
      removeFromLocalStorage(`${deckName}-feedbackButtonDisabled-${index}`);
      removeFromLocalStorage(`${deckName}-showFeedbacks-${index}`);
      removeFromLocalStorage(`${deckName}-questionStates-${index}`);
    });
  
    resetState();
    setFlashcards([]);
    setShuffledFlashcards([]);
  
    const storedFlashcards = loadFromLocalStorage(deckName, []);
    const shuffled = shuffleArray(storedFlashcards);
    setFlashcards(storedFlashcards);
    setShuffledFlashcards(shuffled);
  
    setTimeout(() => {
      resetState();
      setLastCorrectAnswer('');
    }, 0);
  
    saveProgress();
    setCurrentCardIndex(0);
    loadQuestionState(0);
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


const navigateToCard = (index) => {
  preserveCurrentQuestionState();
  setCurrentCardIndex(index);
  loadQuestionState(index);
  const storedTypedAnswer = loadTypedAnswer(deckName, index);
  setTypedAnswer(storedTypedAnswer);
  setWasCorrect(false); // Reset wasCorrect state
  setComparisonResult(''); // Reset comparisonResult state
  saveProgress();
};

  const compareQuestion = async (userQuestion) => {
    const originalQuestion = shuffledFlashcards[currentCardIndex].question;
    const originalAnswer = shuffledFlashcards[currentCardIndex].answer;
    const userAnswer = typingMode ? typedAnswer : userQuestion;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant. You will be provided with an original question, its correct answer, and a user-provided answer. Your task is to determine if the user-provided answer is correct. Answer strictly with "yes" or "no".' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `User Answer: ${userAnswer}` },
      { role: 'user', content: 'Does the user-provided answer correctly answer the original question? Answer strictly "yes" or "no".' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const result = choice.message.content.trim().replace('.', '').toLowerCase();

      const currentQuestionState = questionStates[currentCardIndex] || { attempts: 0, correct: false, hintUsed: false, skipped: false, multipleAttempts: false, firstAttemptIncorrect: false };
      const isFirstAttempt = currentQuestionState.attempts === 0;
      const isFirstAttemptIncorrect = isFirstAttempt && result === 'no';

      const updatedQuestionState = {
        ...currentQuestionState,
        attempts: currentQuestionState.attempts + 1,
        correct: result === 'yes',
        hintUsed: false,
        hint: '',
        multipleAttempts: currentQuestionState.attempts > 0 || result === 'no',
        firstAttemptIncorrect: isFirstAttemptIncorrect || currentQuestionState.firstAttemptIncorrect
      };

      setQuestionStates(prevStates => {
        const updatedStates = {
          ...prevStates,
          [currentCardIndex]: updatedQuestionState
        };

        updateQuestionStates(deckName, updatedStates);
        return updatedStates;
      });

      if (result === 'yes') {
        setCorrectlyAnsweredQuestions(prevQuestions => {
          const updatedQuestions = new Set(prevQuestions).add(currentCardIndex);
          updateCorrectlyAnsweredQuestions(deckName, updatedQuestions);
          return updatedQuestions;
        });

        updateScore(true);
        setComparisonResult('Correct');
        setWasCorrect(true);
        setNewAnswerProvided(true);
        setHasFeedbackBeenProvided(prev => ({
          ...prev,
          [currentCardIndex]: false
        }));
        setLastCorrectAnswer(userAnswer);

        setReport(prevReport => {
          const updatedReport = { ...prevReport };
          if (!updatedQuestionState.firstAttemptIncorrect) {
            updatedReport.answeredPerfectly += 1;
          }
          return updatedReport;
        });

        setSendButtonDisabled(prev => ({
          ...prev,
          [currentCardIndex]: true
        }));

        setHintUsed(false);
        setHint('');
      } else {
        updateScore(false);
        setComparisonResult('Incorrect');

        setReport(prevReport => ({
          ...prevReport,
          multipleAttempts: currentQuestionState.attempts === 0 ? prevReport.multipleAttempts + 1 : prevReport.multipleAttempts,
        }));
      }

    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      saveProgress();
    }
  };

  const handleShowAnswer = () => {
    if (!showAnswer) {
      setShowAnswer(true);
      updateScore(false);
      setCorrectlyAnsweredQuestions(prev => new Set(prev).add(currentCardIndex));

      setQuestionStates(prevStates => {
        const updatedStates = {
          ...prevStates,
          [currentCardIndex]: {
            ...prevStates[currentCardIndex],
            skipped: true,
            showAnswer: true
          }
        };
        updateQuestionStates(deckName, updatedStates);
        return updatedStates;
      });

      setReport(prevReport => ({
        ...prevReport,
        answersShown: prevReport.answersShown + 1,
      }));

      saveProgress();
    }
  };


  const getHint = async () => {
    if (hintUsed) return;

    setIsLoading(true);
    setHint('');
    const originalQuestion = shuffledFlashcards[currentCardIndex].question;
    const originalAnswer = shuffledFlashcards[currentCardIndex].answer;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: 'Provide a hint that will help the user get closer to the answer but does not directly reveal it.' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 50
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const newHint = data.choices[0].message.content.trim();
        setHint(newHint);
        setHintUsed(true);
        setHintsUsed(prevHintsUsed => prevHintsUsed + 1);

        setQuestionStates(prevStates => {
          const updatedStates = {
            ...prevStates,
            [currentCardIndex]: {
              ...prevStates[currentCardIndex],
              hintUsed: true,
              hint: newHint,
              firstAttemptIncorrect: true
            }
          };
          updateQuestionStates(deckName, updatedStates);
          return updatedStates;
        });

        setReport(prevReport => ({
          ...prevReport,
          hintsUsed: prevReport.hintsUsed + 1,
        }));
      } else {
        setHint('Error: No response from model');
      }
    } catch (error) {
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      saveProgress();
    }
  };



  const generateReportContent = () => (
    <>
      <p>Hints Used: {report.hintsUsed}</p>
      <p>Answers Shown: {report.answersShown}</p>
      <p>Multiple Attempts: {report.multipleAttempts}</p>
      <p>Perfectly Answered: {report.answeredPerfectly}</p>
    </>
  );

  const handleDone = () => {
    setShowSaveProgressModal(true);
  };

  const calculateScoreForCurrentQuestion = () => {
    const deduction = (hintUsed ? HINT_DEDUCTION : 0) + (wrongAttempts * WRONG_ATTEMPT_DEDUCTION);
    return Math.max(100 - deduction, 0);
  };

  const calculateFinalScore = () => {
    const totalScore = flashcards.length * 100;
    return Math.min((score / totalScore) * 100, 100);
  };

  const updateScore = (isCorrect) => {
    if (isCorrect) {
      if (!correctlyAnsweredQuestions.has(currentCardIndex)) {
        const currentQuestionScore = calculateScoreForCurrentQuestion();
        setScore(prevScore => prevScore + currentQuestionScore);
        setCorrectAnswers(prevCorrectAnswers => prevCorrectAnswers + 1);
      }
    } else {
      setWrongAttempts(prevWrongAttempts => prevWrongAttempts + 1);
    }
  };

  const handleNextCard = () => {
    preserveCurrentQuestionState();
    let nextIndex = currentCardIndex;
  
    do {
      nextIndex = (nextIndex + 1) % shuffledFlashcards.length;
    } while (correctlyAnsweredQuestions.has(nextIndex) && nextIndex !== currentCardIndex);
  
    setCurrentCardIndex(nextIndex);
    loadQuestionState(nextIndex);
    setWasCorrect(false); // Reset wasCorrect state
    setComparisonResult(''); // Reset comparisonResult state
    saveProgress();
  };

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      const audioBlob = event.data;
      processRecording(audioBlob);
    };

    recorder.start();
  };

  const finishRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        setIsRecording(false);
        setIsLoading(true);
        saveProgress();
      };
      mediaRecorder.stop();
    }
  };

  const processRecording = async (audioBlob) => {
    const formData = new FormData();
    formData.append('model', 'whisper-1');
    formData.append('file', new Blob([audioBlob], { type: 'audio/mp3' }), 'audio/mp3');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      const data = await response.json();
      compareQuestion(data.text);
    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
      setIsLoading(false);
      saveProgress();
    }
  };


  useEffect(() => {
    console.log("Question States:", questionStates);
    console.log("Report:", report);
  }, [questionStates, report]);

  const renderSendButton = () => (
    <button
      className="send-button"
      onClick={() => {
        setIsLoading(true);
        compareQuestion(typedAnswer).finally(() => setIsLoading(false));
      }}
      disabled={sendButtonDisabled[currentCardIndex] || !typedAnswer.trim() || isLoading}
    >
      {isLoading ? 'Loading...' : 'Send'}
    </button>
  );

  const provideFeedback = async () => {
    if (feedbackButtonDisabled[currentCardIndex]) {
      console.log("Feedback button disabled, conditions not met:", {
        isFeedbackLoading,
        feedbackButtonDisabled: feedbackButtonDisabled[currentCardIndex],
      });
      return;
    }

    setIsFeedbackLoading(true);

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${shuffledFlashcards[currentCardIndex].question}` },
      { role: 'user', content: `Original Answer: ${shuffledFlashcards[currentCardIndex].answer}` },
      { role: 'user', content: 'The user\'s answer was correct. Provide praise and suggestions for improvement.' },
      { role: 'user', content: `User's Correct Answer: ${lastCorrectAnswer}` }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 50
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      const data = await response.json();
      const newFeedback = data.choices[0].message.content.trim();

      setFeedbacks(prev => ({
        ...prev,
        [currentCardIndex]: newFeedback
      }));
      setShowFeedbacks(prev => ({
        ...prev,
        [currentCardIndex]: true
      }));
      setFeedbackButtonDisabled(prev => ({
        ...prev,
        [currentCardIndex]: true
      }));
      setHasFeedbackBeenProvided(prev => ({
        ...prev,
        [currentCardIndex]: true
      }));
    } catch (error) {
      setFeedbacks(prev => ({
        ...prev,
        [currentCardIndex]: `Error: ${error.message}`
      }));
    } finally {
      setIsFeedbackLoading(false);
      saveProgress();
    }
  };
  
const totalCards = flashcards.length;

const NavigationBar = ({ totalCards, currentCardIndex, navigateToCard }) => (
  <div className="navigation-bar">
    {Array.from({ length: totalCards }).map((_, index) => (
      <button
        key={index}
        className={`nav-button ${index === currentCardIndex ? 'active' : ''}`}
        onClick={() => navigateToCard(index)}
      >
        {index + 1}
      </button>
    ))}
  </div>
);


return (
  <div className="test-yourself">
    <NavigationBar
      totalCards={shuffledFlashcards.length}
      currentCardIndex={currentCardIndex}
      navigateToCard={navigateToCard}
    />
    <h3>{deckName}</h3>
    {!finished && (
      <button className="btn btn-secondary" onClick={handleDone}>
        Done
      </button>
    )}
    {shuffledFlashcards.length > 0 ? (
      finished ? (
        <div className="completion-message">
          <h2>Way to go! You've reviewed all {totalCards} cards.</h2>
          <div className="score-display">
            {generateReportContent()}
          </div>
          <div className="final-score">
            <h2>Final Score: {calculateFinalScore().toFixed(2)}%</h2>
            <button className="btn btn-primary" onClick={retakeTest}>Retake Test</button>
            <button className="btn btn-secondary" onClick={wipeProgressAndNavigate}>Go Back</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flashcard">
            <p><strong>Q:</strong> {shuffledFlashcards[currentCardIndex].question}</p>
            {showAnswer && (
              <p><strong>A:</strong> {shuffledFlashcards[currentCardIndex].answer}</p>
            )}
<div className="flashcard-buttons">
  <button className="btn btn-secondary" onClick={() => setTypingMode(!typingMode)}>
    {typingMode ? 'Voice Mode' : 'Type Mode'}
  </button>
  {!typingMode && !isRecording && !isLoading && comparisonResult !== 'Incorrect' && (
    <button className="btn btn-primary" onClick={startRecording}>Start</button>
  )}
  {typingMode && (
    <>
      <input
        type="text"
        value={typedAnswer}
        onChange={(e) => {
          setTypedAnswer(e.target.value);
          localStorage.setItem(`$${deckName}-typedAnswer-$${currentCardIndex}`, e.target.value);
        }}
        placeholder="Type your answer here"
      />
      {renderSendButton()}
    </>
  )}
  {!typingMode && isRecording && (
    <button className="btn btn-danger" onClick={finishRecording}>Finish</button>
  )}
  {comparisonResult === 'Incorrect' && !isRecording && !isLoading && (
    <button className="btn btn-primary" onClick={startRecording}>Try Again</button>
  )}
  {comparisonResult !== 'Correct' && !showAnswer && (
    <button
      className="btn btn-secondary"
      onClick={getHint} 
      disabled={hintUsed || questionStates[currentCardIndex]?.hintUsed}
    >
      Get Hint
    </button>
  )}
  <button
    className="btn btn-warning"
    onClick={handleShowAnswer}
  >
    Show Answer
  </button>
</div>

            {(hint || questionStates[currentCardIndex]?.hint) && (
              <p className="hint"><strong>Hint:</strong> {hint || questionStates[currentCardIndex]?.hint}</p>
            )}
          </div>
          {isLoading && <p>Loading...</p>}
          <div className="comparison-result">
            <p><strong>Result:</strong> {comparisonResult === 'Correct' && questionStates[currentCardIndex]?.skipped ? 'Correct (Skipped)' : comparisonResult}</p>
            {questionStates[currentCardIndex]?.skipped && (
              <p><em>Note: This question was skipped, and the result does not count towards your score.</em></p>
            )}
            {(showAnswer || wasCorrect || correctlyAnsweredQuestions.has(currentCardIndex)) && (
              <>
                {currentCardIndex < shuffledFlashcards.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleNextCard}>Next</button>
                ) : (
                  <button className="btn btn-success" onClick={handleFinish}>Finish</button>
                )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowFeedbacks(prev => ({ ...prev, [currentCardIndex]: true }));
                      provideFeedback();
                    }}
                    disabled={isFeedbackLoading || (feedbackButtonDisabled[currentCardIndex] && hasFeedbackBeenProvided[currentCardIndex])}
                  >
                    {isFeedbackLoading ? 'Loading...' : 'Get Feedback'}
                  </button>
                {showFeedbacks[currentCardIndex] && feedbacks[currentCardIndex] && (
                  <div className="feedback-modal">
                    <p>{feedbacks[currentCardIndex]}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="progress-tracker">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${(correctlyAnsweredQuestions.size / totalCards) * 100}%` }}></div>
            </div>
            <p>{correctlyAnsweredQuestions.size} out of {totalCards} completed</p>
          </div>
        </>
      )
    ) : (
      <p>No flashcards available in this deck.</p>
    )}
{showSaveProgressModal && (
  <div className="modal">
    <div className="modal-content">
      <p>Would you like to save your progress or wipe it?</p>
      <button className="btn btn-primary" onClick={saveProgressAndNavigate}>Save Progress</button>
      <button className="btn btn-secondary" onClick={wipeProgressAndNavigate}>Wipe Progress</button>
      <button className="btn btn-danger" onClick={() => setShowSaveProgressModal(false)}>Cancel</button>
    </div>
  </div>
)}
  </div>
);  };
  
  

export default Test;