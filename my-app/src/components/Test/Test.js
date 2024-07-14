import React, { useState, useEffect } from 'react';
import { useParams, useNavigate,useLocation } from 'react-router-dom';
import './Test.css';

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
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [score, setScore] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);
    const [hasMovedPastFirstCard, setHasMovedPastFirstCard] = useState(false);
    const [showFeedbacks, setShowFeedbacks] = useState({});
    const [feedbackButtonDisabled, setFeedbackButtonDisabled] = useState({});
    const [feedbackProvided, setFeedbackProvided] = useState({});
    const [questionStates, setQuestionStates] = useState({});
    const [sendButtonDisabled, setSendButtonDisabled] = useState(false);
    const [testStarted, setTestStarted] = useState(false);

  
    useEffect(() => {
      const storedFlashcards = JSON.parse(localStorage.getItem(deckName) || '[]'); 
      const storedShuffled = JSON.parse(localStorage.getItem(`${deckName}-shuffled`) || '[]') || storedFlashcards;
      const storedCurrentIndex = parseInt(localStorage.getItem(`${deckName}-currentIndex`) || '0', 10);
      const storedCorrectlyAnsweredQuestions = new Set(JSON.parse(localStorage.getItem(`${deckName}-correctlyAnsweredQuestions`) || '[]'));
      const storedCorrectAnswers = JSON.parse(localStorage.getItem(`${deckName}-correctAnswers`) || '0');
      const storedHintUsed = JSON.parse(localStorage.getItem(`${deckName}-hintUsed`) || 'false');
      const storedHint = localStorage.getItem(`${deckName}-hint`) || '';
      const storedTypedAnswer = localStorage.getItem(`${deckName}-typedAnswer`) || '';
      const storedWasCorrect = JSON.parse(localStorage.getItem(`${deckName}-wasCorrect`) || 'false');
      const storedComparisonResult = localStorage.getItem(`${deckName}-comparisonResult`) || '';
      const storedFeedback = localStorage.getItem(`${deckName}-feedback`) || '';
      const storedShowAnswer = JSON.parse(localStorage.getItem(`${deckName}-showAnswer`) || 'false');
      const storedIsRecording = JSON.parse(localStorage.getItem(`${deckName}-isRecording`) || 'false');
      const storedLastCorrectAnswer = localStorage.getItem(`${deckName}-lastCorrectAnswer`) || '';
      const storedShowFeedback = JSON.parse(localStorage.getItem(`${deckName}-showFeedback`) || 'false');
      const storedIsFeedbackLoading = JSON.parse(localStorage.getItem(`${deckName}-isFeedbackLoading`) || 'false');
      const storedHasFeedbackBeenProvided = JSON.parse(localStorage.getItem(`${deckName}-hasFeedbackBeenProvided`) || 'false');
      const storedNewAnswerProvided = JSON.parse(localStorage.getItem(`${deckName}-newAnswerProvided`) || 'false');
      const storedFinished = JSON.parse(localStorage.getItem(`${deckName}-finished`) || 'false');
      const storedTypingMode = JSON.parse(localStorage.getItem(`${deckName}-typingMode`) || 'false');
      const storedScore = JSON.parse(localStorage.getItem(`${deckName}-score`) || '0');
      const storedHintsUsed = JSON.parse(localStorage.getItem(`${deckName}-hintsUsed`) || '0');
      const storedWrongAttempts = JSON.parse(localStorage.getItem(`${deckName}-wrongAttempts`) || '0');
      const storedFeedbacks = JSON.parse(localStorage.getItem(`${deckName}-feedbacks`) || '{}');
      const storedShowFeedbacks = JSON.parse(localStorage.getItem(`${deckName}-showFeedbacks`) || '{}');
      const storedFeedbackButtonDisabled = JSON.parse(localStorage.getItem(`${deckName}-feedbackButtonDisabled`) || '{}');
      const storedQuestionStates = JSON.parse(localStorage.getItem(`${deckName}-questionStates`) || '{}');
      const storedSendButtonDisabled = JSON.parse(localStorage.getItem(`${deckName}-sendButtonDisabled`) || '{}');
    
      setFlashcards(storedFlashcards);
      setShuffledFlashcards(storedShuffled);
      setCurrentCardIndex(storedCurrentIndex || 0);
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
      loadQuestionState(storedCurrentIndex || 0);
      setTypedAnswer(storedTypedAnswer);
      setSendButtonDisabled(storedSendButtonDisabled);
    
    }, [deckName, location.pathname, navigate]);
     

    const handleFinish = () => {
      if (correctlyAnsweredQuestions.size === shuffledFlashcards.length) {
        setFinished(true);
        localStorage.removeItem(`${deckName}-shuffled`);
        localStorage.removeItem(`${deckName}-currentIndex`);
        localStorage.removeItem(`${deckName}-correctAnswers`);
        localStorage.removeItem(`${deckName}-correctlyAnsweredQuestions`);
        localStorage.removeItem(`${deckName}-hintUsed`);
        localStorage.removeItem(`${deckName}-typedAnswer`);
        localStorage.removeItem(`${deckName}-wasCorrect`);
        localStorage.removeItem(`${deckName}-comparisonResult`);
        localStorage.removeItem(`${deckName}-feedback`);
        localStorage.removeItem(`${deckName}-showAnswer`);
        localStorage.removeItem(`${deckName}-isRecording`);
        localStorage.removeItem(`${deckName}-lastCorrectAnswer`);
        localStorage.removeItem(`${deckName}-showFeedback`);
        localStorage.removeItem(`${deckName}-isFeedbackLoading`);
        localStorage.removeItem(`${deckName}-hasFeedbackBeenProvided`);
        localStorage.removeItem(`${deckName}-newAnswerProvided`);
        localStorage.removeItem(`${deckName}-finished`);
        localStorage.removeItem(`${deckName}-typingMode`);
        localStorage.removeItem(`${deckName}-score`);
        localStorage.removeItem(`${deckName}-hintsUsed`);
        localStorage.removeItem(`${deckName}-wrongAttempts`);
        localStorage.removeItem(`${deckName}-feedbacks`);
        localStorage.removeItem(`${deckName}-showFeedbacks`);
        localStorage.removeItem(`${deckName}-feedbackButtonDisabled`);
        localStorage.removeItem(`${deckName}-questionStates`);
        localStorage.removeItem(`${deckName}-testInProgress`);
        generateReportContent();
      } else {
        alert("You need to answer all questions correctly before finishing the test.");
      }
    };
  
    
      
    
    const loadQuestionState = (index) => {
      const state = questionStates[index];
      if (state) {
        setShowAnswer(state.showAnswer);
        setComparisonResult(state.comparisonResult);
        setHint(state.hint);
        setHintUsed(state.hintUsed);
        setShowFeedback(state.showFeedback);
        setWasCorrect(state.wasCorrect);
        setTypedAnswer(state.typedAnswer);
        setHintsUsed(state.hintsUsed);
        setWrongAttempts(state.wrongAttempts);
        setNewAnswerProvided(state.newAnswerProvided);
        setHint(state.hint || '');
        setHintUsed(state.hintUsed || false);
        setTypedAnswer(localStorage.getItem(`$${deckName}-typedAnswer-$${index}`) || '');
        console.log("Loaded question state for index:", index, state);
      } else {
        setShowAnswer(false);
        setComparisonResult('');
        setHint('');
        setHintUsed(false);
        setShowFeedback(false);
        setWasCorrect(false);
        setTypedAnswer('');
        setHintsUsed(0);
        setWrongAttempts(0);
        setNewAnswerProvided(false);
        setHint('');
        setHintUsed(false);
        setTypedAnswer('');
        console.log("No saved question state for index:", index);

      }
    };
    
      

    const preserveCurrentQuestionState = () => {
      const currentQuestionState = {
        showAnswer,
        comparisonResult,
        hint,
        hintUsed,
        showFeedback,
        wasCorrect,
        typedAnswer,
        hintsUsed,
        wrongAttempts,
        newAnswerProvided,
      };
    
      const updatedQuestionStates = { ...questionStates, [currentCardIndex]: currentQuestionState };
      setQuestionStates(updatedQuestionStates);
      localStorage.setItem(`${deckName}-questionStates`, JSON.stringify(updatedQuestionStates));
      console.log("Preserved question state for index:", currentCardIndex, currentQuestionState);
    };
    
    const retakeTest = () => {
      // Clear all related local storage items
      localStorage.removeItem(`${deckName}-shuffled`);
      localStorage.removeItem(`${deckName}-currentIndex`);
      localStorage.removeItem(`${deckName}-correctAnswers`);
      localStorage.removeItem(`${deckName}-correctlyAnsweredQuestions`);
      localStorage.removeItem(`${deckName}-hintUsed`);
      localStorage.removeItem(`${deckName}-typedAnswer`);
      localStorage.removeItem(`${deckName}-wasCorrect`);
      localStorage.removeItem(`${deckName}-comparisonResult`);
      localStorage.removeItem(`${deckName}-feedback`);
      localStorage.removeItem(`${deckName}-showAnswer`);
      localStorage.removeItem(`${deckName}-isRecording`);
      localStorage.removeItem(`${deckName}-lastCorrectAnswer`);
      localStorage.removeItem(`${deckName}-showFeedback`);
      localStorage.removeItem(`${deckName}-isFeedbackLoading`);
      localStorage.removeItem(`${deckName}-hasFeedbackBeenProvided`);
      localStorage.removeItem(`${deckName}-newAnswerProvided`);
      localStorage.removeItem(`${deckName}-finished`);
      localStorage.removeItem(`${deckName}-typingMode`);
      localStorage.removeItem(`${deckName}-score`);
      localStorage.removeItem(`${deckName}-hintsUsed`);
      localStorage.removeItem(`${deckName}-wrongAttempts`);
      localStorage.removeItem(`${deckName}-feedbackButtonDisabled`);
      localStorage.removeItem(`${deckName}-showFeedbacks`);
      localStorage.removeItem(`${deckName}-questionStates`);
      localStorage.removeItem(`${deckName}-sendButtonDisabled`);
      localStorage.removeItem(`${deckName}-testInProgress`);
      localStorage.removeItem(`${deckName}-typedAnswer`);
      localStorage.removeItem(`${deckName}-hint`);
    
      // Clear individual question typed answers and related states
      flashcards.forEach((_, index) => {
        localStorage.removeItem(`$${deckName}-typedAnswer-$${index}`);
        localStorage.removeItem(`${deckName}-feedbackButtonDisabled-${index}`);
        localStorage.removeItem(`${deckName}-showFeedbacks-${index}`);
        localStorage.removeItem(`${deckName}-questionStates-${index}`);
      });
    
      // Reset all necessary state variables
      setFlashcards([]);  // Reset flashcards
      setShuffledFlashcards([]);
      setCurrentCardIndex(0);
      setCorrectAnswers(0);
      setComparisonResult('');
      setHint('');
      setShowAnswer(false);
      setTypedAnswer('');
      setTypingMode(false);
      setCorrectlyAnsweredQuestions(new Set());
      setFinished(false);
      setHintsUsed(0);
      setWrongAttempts(0);
      setScore(0);
      setQuestionStates({});
      setFeedbackButtonDisabled({});
      setShowFeedbacks({});
      setReport({
        hintsUsed: 0,
        answersShown: 0,
        multipleAttempts: 0,
        answeredPerfectly: 0,
      });
      setSendButtonDisabled({});
      setShowDisclaimer(true);
    
      // Fetch flashcards again
      const storedFlashcards = JSON.parse(localStorage.getItem(deckName) || '[]');
      const shuffled = shuffleArray(storedFlashcards); // Assuming you have a shuffleArray function
      setFlashcards(storedFlashcards);
      setShuffledFlashcards(shuffled);
    
      // Ensure the first card is properly reset
      setTimeout(() => {
        setShowAnswer(false);
        setComparisonResult('');
        setHint('');
        setHintUsed(false);
        setShowFeedback(false);
        setWasCorrect(false);
        setTypedAnswer('');
        setHintsUsed(0);
        setWrongAttempts(0);
        setNewAnswerProvided(false);
        setFeedback('');
        setFeedbackButtonDisabled(false);
        setShowFeedbacks({});
        setSendButtonDisabled(false);
        setLastCorrectAnswer('');
      }, 0);
    
      // Save progress and navigate to the start of the test
      saveProgress();
      setCurrentCardIndex(0);
      loadQuestionState(0);
    };
    
    // Helper function to shuffle an array
    const shuffleArray = (array) => {
      let shuffledArray = array.slice();
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
      }
      return shuffledArray;
    };
    
    

    const saveProgress = () => {
      console.log("saveProgress called");

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
      localStorage.setItem(`${deckName}-feedbackButtonDisabled`, JSON.stringify(feedbackButtonDisabled));
      localStorage.setItem(`${deckName}-feedbacks`, JSON.stringify(feedbacks)); 
      localStorage.setItem(`${deckName}-showFeedbacks`, JSON.stringify(showFeedbacks));
      localStorage.setItem(`${deckName}-questionStates`, JSON.stringify(questionStates));
      localStorage.setItem(`$${deckName}-typedAnswer-$${currentCardIndex}`, typedAnswer);
      localStorage.setItem(`${deckName}-hint`, hint);
      localStorage.setItem(`${deckName}-sendButtonDisabled`, JSON.stringify(sendButtonDisabled));
      localStorage.setItem(`${deckName}-testInProgress`, 'true');
      console.log("Progress saved");



    };
    
    const saveProgressAndNavigate = () => {
      saveProgress();
      navigate(`/deck/${deckName}`);
  };
    

  
  const wipeProgressAndNavigate = () => {
    // Remove keys related to overall test progress
    localStorage.removeItem(`${deckName}-shuffled`);
    localStorage.removeItem(`${deckName}-currentIndex`);
    localStorage.removeItem(`${deckName}-correctAnswers`);
    localStorage.removeItem(`${deckName}-correctlyAnsweredQuestions`);
    localStorage.removeItem(`${deckName}-hintUsed`);
    localStorage.removeItem(`${deckName}-wasCorrect`);
    localStorage.removeItem(`${deckName}-comparisonResult`);
    localStorage.removeItem(`${deckName}-feedback`);
    localStorage.removeItem(`${deckName}-showAnswer`);
    localStorage.removeItem(`${deckName}-isRecording`);
    localStorage.removeItem(`${deckName}-lastCorrectAnswer`);
    localStorage.removeItem(`${deckName}-showFeedback`);
    localStorage.removeItem(`${deckName}-isFeedbackLoading`);
    localStorage.removeItem(`${deckName}-hasFeedbackBeenProvided`);
    localStorage.removeItem(`${deckName}-newAnswerProvided`);
    localStorage.removeItem(`${deckName}-finished`);
    localStorage.removeItem(`${deckName}-typingMode`);
    localStorage.removeItem(`${deckName}-score`);
    localStorage.removeItem(`${deckName}-hintsUsed`);
    localStorage.removeItem(`${deckName}-wrongAttempts`);
    localStorage.removeItem(`${deckName}-feedbacks`);
    localStorage.removeItem(`${deckName}-showFeedbacks`);
    localStorage.removeItem(`${deckName}-feedbackButtonDisabled`);
    localStorage.removeItem(`${deckName}-questionStates`);
    localStorage.removeItem(`${deckName}-sendButtonDisabled`);
    localStorage.removeItem(`${deckName}-testInProgress`);
    localStorage.removeItem(`${deckName}-typedAnswer`);
    localStorage.removeItem(`${deckName}-hint`);
    
    // Remove keys related to individual question typed answers
    shuffledFlashcards.forEach((_, index) => {
      localStorage.removeItem(`$${deckName}-typedAnswer-$${index}`);
    });
  
    navigate(`/deck/${deckName}`);
  };
  

  const [report, setReport] = useState({
    hintsUsed: 0,
    answersShown: 0,
    multipleAttempts: 0,
    answeredPerfectly: 0,
  });    
  
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

  const HINT_DEDUCTION = 25;
  const WRONG_ATTEMPT_DEDUCTION = 10;

  const calculateScoreForCurrentQuestion = () => {
    const deduction = (hintUsed ? HINT_DEDUCTION : 0) + (wrongAttempts * WRONG_ATTEMPT_DEDUCTION);
    return Math.max(100 - deduction, 0);
  };
  
  const calculateFinalScore = () => {
    const totalScore = flashcards.length * 100;
    return Math.min((score / totalScore) * 100, 100); // Ensure the score does not exceed 100%
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

  
  const totalCards = flashcards.length;
  
const handleNextCard = () => {
  preserveCurrentQuestionState();
  let nextIndex = currentCardIndex;

  do {
    nextIndex = (nextIndex + 1) % shuffledFlashcards.length;
  } while (correctlyAnsweredQuestions.has(nextIndex) && nextIndex !== currentCardIndex);

  setCurrentCardIndex(nextIndex);
  loadQuestionState(nextIndex);
  saveProgress();
};

const navigateToCard = (index) => {
  preserveCurrentQuestionState();
  setCurrentCardIndex(index);
  loadQuestionState(index);
  const storedTypedAnswer = localStorage.getItem(`$${deckName}-typedAnswer-$${index}`) || '';
  setTypedAnswer(storedTypedAnswer);
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





const compareQuestion = async (userQuestion) => {
  const originalQuestion = shuffledFlashcards[currentCardIndex].question;
  const originalAnswer = shuffledFlashcards[currentCardIndex].answer;
  const userAnswer = typingMode ? typedAnswer : userQuestion;

  console.log("Original Question:", originalQuestion);
  console.log("Original Answer:", originalAnswer);
  console.log("User Answer:", userAnswer);

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

    console.log("Comparison Result from API:", result);

    setQuestionStates(prevStates => {
      const currentQuestionState = prevStates[currentCardIndex] || { attempts: 0, correct: false, hintUsed: false, skipped: false };
      const updatedQuestionState = {
        ...currentQuestionState,
        attempts: currentQuestionState.attempts + 1,
        correct: result === 'yes',
        hintUsed: false,
        hint: '',
      };

      const updatedStates = {
        ...prevStates,
        [currentCardIndex]: updatedQuestionState
      };

      console.log("Updated Question States:", updatedStates);
      localStorage.setItem(`${deckName}-questionStates`, JSON.stringify(updatedStates));
      return updatedStates;
    });

    const isFirstAttempt = questionStates[currentCardIndex]?.attempts === 1;
    const noHintUsed = !questionStates[currentCardIndex]?.hintUsed;
    const notSkipped = !questionStates[currentCardIndex]?.skipped;

    console.log("Current Question State:", questionStates[currentCardIndex]);
    console.log("Is First Attempt:", isFirstAttempt);
    console.log("No Hint Used:", noHintUsed);
    console.log("Not Skipped:", notSkipped);

    if (result === 'yes') {
      setCorrectlyAnsweredQuestions(prevQuestions => {
        const updatedQuestions = new Set(prevQuestions).add(currentCardIndex);
        console.log("Updated Correctly Answered Questions:", [...updatedQuestions]);
        localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...updatedQuestions]));
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
        const wasMultipleAttempt = questionStates[currentCardIndex]?.attempts > 1;
        console.log("Was Multiple Attempt:", wasMultipleAttempt);
        return {
          ...prevReport,
          answeredPerfectly: isFirstAttempt && noHintUsed && notSkipped ? prevReport.answeredPerfectly + 1 : prevReport.answeredPerfectly,
          multipleAttempts: wasMultipleAttempt ? prevReport.multipleAttempts + 1 : prevReport.multipleAttempts,
        };
      });

      setSendButtonDisabled(prev => ({
        ...prev,
        [currentCardIndex]: true
      }));

      setHintUsed(false);
      setHint('');
    } else {
      setHintUsed(false);
      setHint('');
      updateScore(false);
      setComparisonResult('Incorrect');

      setReport(prevReport => {
        const wasMultipleAttempt = questionStates[currentCardIndex]?.attempts > 1;
        console.log("Was Multiple Attempt:", wasMultipleAttempt);
        return {
          ...prevReport,
          multipleAttempts: wasMultipleAttempt ? prevReport.multipleAttempts + 1 : prevReport.multipleAttempts,
        };
      });
    }

  } catch (error) {
    setComparisonResult(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
    saveProgress();
  }
};




useEffect(() => {
  console.log("Question States:", questionStates);
  console.log("Report:", report);
}, [questionStates, report]);

const renderSendButton = () => {
  return (
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
};






  
const handleShowAnswer = () => {
  if (!showAnswer) {
    setShowAnswer(true);
    updateScore(false); // Set score to 0 for this question
    setCorrectlyAnsweredQuestions(prev => new Set(prev).add(currentCardIndex)); // Mark as correct for UI flow

    setQuestionStates(prevStates => {
      const updatedStates = {
        ...prevStates,
        [currentCardIndex]: {
          ...prevStates[currentCardIndex],
          skipped: true,
          showAnswer: true
        }
      };
      localStorage.setItem(`${deckName}-questionStates`, JSON.stringify(updatedStates));
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
          }
        };
        localStorage.setItem(`${deckName}-questionStates`, JSON.stringify(updatedStates));
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
      <button className="btn btn-secondary top-right-button" onClick={handleDone}>
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
