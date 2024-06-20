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



    const HINT_DEDUCTION = 25;
    const WRONG_ATTEMPT_DEDUCTION = 10;

    const calculateScoreForCurrentQuestion = () => {
      const deduction = (hintUsed ? HINT_DEDUCTION : 0) + (wrongAttempts * WRONG_ATTEMPT_DEDUCTION);
      return Math.max(100 - deduction, 0);
    };
    
    const calculateFinalScore = () => {
      const totalScore = flashcards.length * 100;
      return (score / totalScore) * 100;
    };
    
      

      const updateScore = (isCorrect) => {
        if (isCorrect) {
          const currentQuestionScore = calculateScoreForCurrentQuestion();
          setScore(prevScore => prevScore + currentQuestionScore);
          setCorrectAnswers(prevCorrectAnswers => prevCorrectAnswers + 1);
        } else {
          setWrongAttempts(prevWrongAttempts => prevWrongAttempts + 1);
        }
      };
      

    const resetTest = () => {
        setScore(0);
        setHintsUsed(0);
        setWrongAttempts(0);
        setCorrectAnswers(0);
        setCurrentCardIndex(0);
        setFinished(false);
      };
      

  
      useEffect(() => {
        const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
        const storedShuffled = JSON.parse(localStorage.getItem(`${deckName}-shuffled`)) || storedFlashcards;
        const storedCurrentIndex = parseInt(localStorage.getItem(`${deckName}-currentIndex`), 10);
        const storedCorrectlyAnsweredQuestions = new Set(JSON.parse(localStorage.getItem(`${deckName}-correctlyAnsweredQuestions`)) || []);
        const storedCorrectAnswers = JSON.parse(localStorage.getItem(`${deckName}-correctAnswers`)) || 0;
        const storedHintUsed = JSON.parse(localStorage.getItem(`${deckName}-hintUsed`)) || false;
        const storedHint = localStorage.getItem(`${deckName}-hint`) || '';
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
        const storedFeedbacks = JSON.parse(localStorage.getItem(`${deckName}-feedbacks`)) || {};
        const storedShowFeedbacks = JSON.parse(localStorage.getItem(`${deckName}-showFeedbacks`)) || {};
        const storedFeedbackButtonDisabled = JSON.parse(localStorage.getItem(`${deckName}-feedbackButtonDisabled`)) || {};        
    
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


    }, [deckName, location.search]);
    

      
      
  
  
      const handleDone = () => {
        setShowSaveProgressModal(true);
      };
      
      

  
  const totalCards = flashcards.length;

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };


  const handleShuffle = () => {
    const shuffled = shuffleArray(flashcards);
    setShuffledFlashcards(shuffled);
    setCurrentCardIndex(0); // Reset to the first card
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
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 10
        })
      });
  
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }
  
      const data = await response.json();
  
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        const result = choice.message.content.trim().replace('.', '').toLowerCase();
  
        if (result === 'yes') {
          if (!correctlyAnsweredQuestions.has(currentCardIndex)) {
            setCorrectlyAnsweredQuestions(prevQuestions => {
              const updatedQuestions = new Set(prevQuestions).add(currentCardIndex);
              localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...updatedQuestions]));
              return updatedQuestions;
            });
  
            updateScore(true);
            setComparisonResult('Correct');
            setWasCorrect(true);
            setNewAnswerProvided(true);  // Mark a new correct answer as provided
            setFeedbackButtonDisabled(prev => ({
              ...prev,
              [currentCardIndex]: false
            }));
            saveProgress(); // Ensure progress is saved immediately after the correct answer is identified
          }
        } else {
          updateScore(false);
          setComparisonResult('Incorrect');
          setFeedbackButtonDisabled(prev => ({
            ...prev,
            [currentCardIndex]: true  // Disable feedback button because the answer was incorrect
          }));
        }
      } else {
        setComparisonResult('Error: No response from model');
      }
    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      saveProgress(); // Save progress immediately after comparison
    }
  };
  
  
  
  





  
  

  const handleNextCard = () => {
    let nextIndex = currentCardIndex;
    do {
        nextIndex = (nextIndex + 1) % shuffledFlashcards.length;
    } while (correctlyAnsweredQuestions.has(nextIndex) && nextIndex !== currentCardIndex);

    if (nextIndex === currentCardIndex) {
        setFinished(true);
    } else {
        setCurrentCardIndex(nextIndex);
        setHasMovedPastFirstCard(true);
    }

    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setHintUsed(false);
    setShowFeedback(false);
    setHasFeedbackBeenProvided(false);
    setWasCorrect(false);
    setTypedAnswer('');
    setHintsUsed(0);
    setWrongAttempts(0);
    setNewAnswerProvided(false);
    setFeedbackButtonDisabled(prev => {
        console.log('Updating feedbackButtonDisabled for next card', { 
            currentCardIndex: nextIndex, 
            prevState: prev[nextIndex] !== undefined ? prev[nextIndex] : false 
        });
        return {
            ...prev,
            [nextIndex]: prev[nextIndex] !== undefined ? prev[nextIndex] : false
        };
    });

    saveProgress();
};

  
  
  const handlePreviousCard = () => {
    const prevIndex = (currentCardIndex - 1 + shuffledFlashcards.length) % shuffledFlashcards.length;
    setCurrentCardIndex(prevIndex);
    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setHintUsed(false);
    setShowFeedback(false);
    setHasFeedbackBeenProvided(false);
    setWasCorrect(false);
    setTypedAnswer('');
    setHintsUsed(0); // Reset hints used for the new question
    setWrongAttempts(0); // Reset wrong attempts for the new question
    setNewAnswerProvided(false); // Reset new answer provided for the previous question
    setFeedbackButtonDisabled(prev => ({
        ...prev,
        [prevIndex]: feedbackButtonDisabled[prevIndex] !== undefined ? feedbackButtonDisabled[prevIndex] : false
    }));
  
    saveProgress(); // Save progress after state updates
  };
  

  
  const handleFinish = () => {
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
    localStorage.setItem(`${deckName}-finished`, JSON.stringify(true)); // Ensure finished state is saved
  };
  
  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
    saveProgress();
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
          model: 'gpt-4o',
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
        setHint(data.choices[0].message.content.trim());
        setHintUsed(true);
        setHintsUsed(prevHintsUsed => prevHintsUsed + 1); // Update hints used state
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
  
  const retakeTest = () => {
    setCorrectAnswers(0);
    setCurrentCardIndex(0);
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
    saveProgress();
  };
  
  

const saveProgress = () => {
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
    localStorage.setItem(`${deckName}-hint`, hint);
    localStorage.setItem(`${deckName}-hintUsed`, JSON.stringify(hintUsed));
    localStorage.setItem(`${deckName}-feedbacks`, JSON.stringify(feedbacks)); // Save feedbacks
    localStorage.setItem(`${deckName}-showFeedbacks`, JSON.stringify(showFeedbacks)); // Save feedback visibility
    localStorage.setItem(`${deckName}-feedbackButtonDisabled`, JSON.stringify(feedbackButtonDisabled)); // Save button state
};

const saveProgressAndNavigate = () => {
  console.log("Saving progress...");

  localStorage.setItem(`${deckName}-shuffled`, JSON.stringify(shuffledFlashcards));
  console.log(`${deckName}-shuffled:`, JSON.stringify(shuffledFlashcards));
  
  localStorage.setItem(`${deckName}-currentIndex`, currentCardIndex);
  console.log(`${deckName}-currentIndex:`, currentCardIndex);
  
  localStorage.setItem(`${deckName}-correctAnswers`, JSON.stringify(correctAnswers));
  console.log(`${deckName}-correctAnswers:`, correctAnswers);
  
  localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...correctlyAnsweredQuestions]));
  console.log(`${deckName}-correctlyAnsweredQuestions:`, JSON.stringify([...correctlyAnsweredQuestions]));
  
  localStorage.setItem(`${deckName}-hintUsed`, JSON.stringify(hintUsed));
  console.log(`${deckName}-hintUsed:`, hintUsed);
  
  localStorage.setItem(`${deckName}-typedAnswer`, typedAnswer);
  console.log(`${deckName}-typedAnswer:`, typedAnswer);
  
  localStorage.setItem(`${deckName}-wasCorrect`, JSON.stringify(wasCorrect));
  console.log(`${deckName}-wasCorrect:`, wasCorrect);
  
  localStorage.setItem(`${deckName}-comparisonResult`, comparisonResult);
  console.log(`${deckName}-comparisonResult:`, comparisonResult);
  
  localStorage.setItem(`${deckName}-feedback`, feedback);
  console.log(`${deckName}-feedback:`, feedback);
  
  localStorage.setItem(`${deckName}-showAnswer`, JSON.stringify(showAnswer));
  console.log(`${deckName}-showAnswer:`, showAnswer);
  
  localStorage.setItem(`${deckName}-isRecording`, JSON.stringify(isRecording));
  console.log(`${deckName}-isRecording:`, isRecording);
  
  localStorage.setItem(`${deckName}-lastCorrectAnswer`, lastCorrectAnswer);
  console.log(`${deckName}-lastCorrectAnswer:`, lastCorrectAnswer);
  
  localStorage.setItem(`${deckName}-showFeedback`, JSON.stringify(showFeedback));
  console.log(`${deckName}-showFeedback:`, showFeedback);
  
  localStorage.setItem(`${deckName}-isFeedbackLoading`, JSON.stringify(isFeedbackLoading));
  console.log(`${deckName}-isFeedbackLoading:`, isFeedbackLoading);
  
  localStorage.setItem(`${deckName}-hasFeedbackBeenProvided`, JSON.stringify(hasFeedbackBeenProvided));
  console.log(`${deckName}-hasFeedbackBeenProvided:`, hasFeedbackBeenProvided);
  
  localStorage.setItem(`${deckName}-newAnswerProvided`, JSON.stringify(newAnswerProvided));
  console.log(`${deckName}-newAnswerProvided:`, newAnswerProvided);
  
  localStorage.setItem(`${deckName}-finished`, JSON.stringify(finished));
  console.log(`${deckName}-finished:`, finished);
  
  localStorage.setItem(`${deckName}-typingMode`, JSON.stringify(typingMode));
  console.log(`${deckName}-typingMode:`, typingMode);
  
  localStorage.setItem(`${deckName}-score`, JSON.stringify(score));
  console.log(`${deckName}-score:`, score);
  
  localStorage.setItem(`${deckName}-hintsUsed`, JSON.stringify(hintsUsed));
  console.log(`${deckName}-hintsUsed:`, hintsUsed);
  
  localStorage.setItem(`${deckName}-wrongAttempts`, JSON.stringify(wrongAttempts));
  console.log(`${deckName}-wrongAttempts:`, wrongAttempts);

  console.log("Progress saved. Navigating to Deck...");
  navigate(`/Deck/${deckName}`);
};


const wipeProgressAndNavigate = () => {
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
  
  navigate(`/Deck/${deckName}`);
};


    
  

const provideFeedback = async () => {
  if (feedbackButtonDisabled[currentCardIndex] || (!newAnswerProvided && hasFeedbackBeenProvided)) return;

  setIsFeedbackLoading(true);

  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: `Original Question: ${shuffledFlashcards[currentCardIndex].question}` },
    { role: 'user', content: `Original Answer: ${shuffledFlashcards[currentCardIndex].answer}` },
    { role: 'user', content: `The user's answer was correct. Provide praise and suggestions for improvement.` },
    { role: 'user', content: `User's Correct Answer: ${lastCorrectAnswer}` }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      setHasFeedbackBeenProvided(true);
      setNewAnswerProvided(false); // Reset new answer provided flag after feedback
    } else {
      setFeedbacks(prev => ({
        ...prev,
        [currentCardIndex]: 'Error: No response from model'
      }));
    }
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
    localStorage.removeItem(`${deckName}-isRecording`);
    localStorage.removeItem(`${deckName}-lastCorrectAnswer`);
    localStorage.removeItem(`${deckName}-showFeedback`);
    localStorage.removeItem(`${deckName}-isFeedbackLoading`);
    localStorage.removeItem(`${deckName}-hasFeedbackBeenProvided`);
    localStorage.removeItem(`${deckName}-newAnswerProvided`);
    localStorage.removeItem(`${deckName}-finished`);
    localStorage.removeItem(`${deckName}-typingMode`);
    setShowDisclaimer(false);
    navigate(`/test/${deckName}`);
  };

const continueTest = () => {
    setShowDisclaimer(false);
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    const storedShuffled = JSON.parse(localStorage.getItem(`${deckName}-shuffled`)) || storedFlashcards;
    const storedCurrentIndex = parseInt(localStorage.getItem(`${deckName}-currentIndex`), 10);
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
    setCurrentCardIndex(storedCurrentIndex || 0);
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

    navigate(`/test/${deckName}`);

};


return (
  <div className="test-yourself">
    <h3>{deckName}</h3>
    {!finished && (
      <>
        <button className="top-right-button" onClick={handleDone}>
          Done
        </button>
        <button onClick={handleShuffle}>Shuffle</button>
      </>
    )}
    {showDisclaimer ? (
      <div className="disclaimer-modal">
        <p>You have a test in progress. Would you like to continue or start over?</p>
        <button onClick={startOver}>Start Over</button>
        <button onClick={continueTest}>Continue</button>
      </div>
    ) : (
      <>
        {shuffledFlashcards.length > 0 ? (
          finished ? (
            <div className="completion-message">
              <h2>Way to go! You've reviewed all {totalCards} cards.</h2>
              <div className="score-display">
                <p>Correct Answers: {correctAnswers}</p>
                <p>Hints Used: {hintsUsed}</p>
                <p>Wrong Attempts: {wrongAttempts}</p>
              </div>
              <div className="final-score">
                <h2>Final Score: {calculateFinalScore().toFixed(2)}%</h2>
                <button onClick={retakeTest}>Retake Test</button>
                <button onClick={wipeProgressAndNavigate}>Go Back</button>
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
                  <button onClick={() => setTypingMode(!typingMode)}>
                    {typingMode ? 'Voice Mode' : 'Type Mode'}
                  </button>
                  {!typingMode && !isRecording && !isLoading && comparisonResult !== 'Incorrect' && (
                    <button onClick={startRecording}>Start</button>
                  )}
                  {typingMode && (
                    <>
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => {
                          setTypedAnswer(e.target.value);
                          saveProgress();
                        }}
                        placeholder="Type your answer here"
                      />
                      <button
                        className="send-button"
                        onClick={() => {
                          setIsLoading(true);
                          compareQuestion(typedAnswer).finally(() => setIsLoading(false));
                        }}
                        disabled={!typedAnswer.trim() || isLoading}
                      >
                        {isLoading ? 'Loading...' : 'Send'}
                      </button>
                    </>
                  )}
                  {!typingMode && isRecording && (
                    <button onClick={finishRecording}>Finish</button>
                  )}
                  {comparisonResult === 'Incorrect' && !isRecording && !isLoading && (
                    <button onClick={startRecording}>Try Again</button>
                  )}
                  {comparisonResult !== 'Correct' && (
                    <>
                      <button onClick={getHint} disabled={hintUsed}>Get Hint</button>
                      {hint && <p><strong>Hint:</strong> {hint}</p>}
                    </>
                  )}
                </div>
                <div className="flashcard-secondary-buttons">
  {currentCardIndex > 0 && (
    <button onClick={handlePreviousCard} className="secondary-button">Back</button>
  )}
  <button onClick={handleShowAnswer} className="secondary-button">
    {showAnswer ? 'Hide Answer' : 'Show Answer'}
  </button>
  {(wasCorrect || comparisonResult === 'Correct' || correctlyAnsweredQuestions.has(currentCardIndex)) && (
    <>
      {currentCardIndex < shuffledFlashcards.length - 1 ? (
        <button onClick={handleNextCard} className="secondary-button">Next</button>
      ) : (
        <button onClick={handleFinish} className="secondary-button">Finish</button>
      )}
      <button 
        onClick={provideFeedback}
        disabled={isFeedbackLoading || feedbackButtonDisabled[currentCardIndex] || (!newAnswerProvided && hasFeedbackBeenProvided)}
      >
        {isFeedbackLoading ? 'Loading...' : 'Get Feedback'}
      </button>
    </>
  )}
</div>



              </div>
              {isLoading && <p>Loading...</p>}
              <div className="comparison-result">
  <p><strong>Result:</strong> {comparisonResult}</p>
  {(wasCorrect || correctlyAnsweredQuestions.has(currentCardIndex)) && (
    <>
      {currentCardIndex < shuffledFlashcards.length - 1 ? (
        <button onClick={handleNextCard}>Next</button>
      ) : (
        <button onClick={handleFinish}>Finish</button>
      )}
      <button
        onClick={() => { setShowFeedbacks(prev => ({ ...prev, [currentCardIndex]: true })); provideFeedback(); }}
        disabled={isFeedbackLoading || feedbackButtonDisabled[currentCardIndex]}
      >
        {isFeedbackLoading ? 'Loading...' : 'Get Feedback'}
      </button>
      {showFeedbacks[currentCardIndex] && feedbacks[currentCardIndex] && (
        <div className="feedback-modal">
          <p>{feedbacks[currentCardIndex]}</p>
          <button onClick={() => setShowFeedbacks(prev => ({ ...prev, [currentCardIndex]: false }))}>Close</button>
        </div>
      )}
    </>
  )}
</div>




              <div className="progress-tracker">
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${(correctAnswers / totalCards) * 100}%` }}></div>
                </div>
                <p>{correctAnswers} out of {totalCards} completed</p>
              </div>
            </>
          )
        ) : (
          <p>No flashcards available in this deck.</p>
        )}
      </>
    )}
    {showSaveProgressModal && (
      <div className="save-progress-modal">
        <p>Would you like to save your progress or wipe it?</p>
        <button onClick={saveProgressAndNavigate}>Save Progress</button>
        <button onClick={wipeProgressAndNavigate}>Wipe Progress</button>
        <button onClick={() => setShowSaveProgressModal(false)}>Cancel</button>
      </div>
    )}
  </div>
);
  
  };
  
  

export default Test;
