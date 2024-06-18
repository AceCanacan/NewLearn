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

    const HINT_DEDUCTION = 25;
    const WRONG_ATTEMPT_DEDUCTION = 10;

    const calculateScore = () => {
    let deduction = (hintsUsed * HINT_DEDUCTION) + (wrongAttempts * WRONG_ATTEMPT_DEDUCTION);
    return Math.max(100 - deduction, 0);
    };

    const calculateFinalScore = () => {
        const totalQuestions = flashcards.length;
        const possiblePoints = totalQuestions * 100;
        return (score / possiblePoints) * 100;
      };
      

    const updateScore = (isCorrect) => {
        if (isCorrect) {
          const currentQuestionScore = calculateScore();
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
        const searchParams = new URLSearchParams(location.search);
        const continueFlag = searchParams.get('continue');
      
        if (continueFlag) {
          setShowDisclaimer(false);
        } else {
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
      
          if (storedShuffled && storedCurrentIndex !== null && storedCorrectAnswers !== null && storedCorrectlyAnsweredQuestions.size > 0 && !storedFinished) {
            setShowDisclaimer(true);
          }
      
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
        }
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
                    saveProgress(); // Ensure progress is saved immediately after the correct answer is identified
                }
            } else {
                updateScore(false);
                setComparisonResult('Incorrect');
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
  
    saveProgress(); // Save progress after state updates
  };
  const handlePreviousCard = () => {
    let prevIndex = currentCardIndex;
    do {
      prevIndex = (prevIndex - 1 + shuffledFlashcards.length) % shuffledFlashcards.length;
    } while (correctlyAnsweredQuestions.has(prevIndex) && prevIndex !== currentCardIndex);
  
    if (prevIndex === currentCardIndex) {
      setFinished(true);
    } else {
      setCurrentCardIndex(prevIndex);
    }
  
    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setHintUsed(false);
    setShowFeedback(false);
    setHasFeedbackBeenProvided(false);
    setWasCorrect(false);
    setTypedAnswer('');
  
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
    localStorage.removeItem(`${deckName}-shuffled`);
    localStorage.removeItem(`${deckName}-currentIndex`);
    localStorage.removeItem(`${deckName}-finished`); // Clear the finished state
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
};

const saveProgressAndNavigate = () => {
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
    navigate(`/Deck/${deckName}`);
  };
  
    
  

  const provideFeedback = async () => {
    if (hasFeedbackBeenProvided && !newAnswerProvided) return;

    setFeedback('');
    setIsFeedbackLoading(true);

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${shuffledFlashcards[currentCardIndex].question}` },
      { role: 'user', content: `Original Answer: ${shuffledFlashcards[currentCardIndex].answer}` },
      { role: 'user', content: `The user's answer was correct. Provide praise and suggestions for improvement. Just one line` },
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
        setFeedback(data.choices[0].message.content.trim());
        setHasFeedbackBeenProvided(true);
        setNewAnswerProvided(false);
      } else {
        setFeedback('Error: No response from model');
      }
    } catch (error) {
      setFeedback(`Error: ${error.message}`);
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
  };

  return (
    <div className="test-yourself">
      <h3>{deckName}</h3>
      <button className="top-right-button" onClick={handleDone}>
        Done
      </button>
      <button onClick={handleShuffle}>Shuffle</button>
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
                  <button onClick={() => navigate('/')}>Home</button>
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
                            compareQuestion(
                              typedAnswer,
                              shuffledFlashcards,
                              currentCardIndex,
                              typingMode,
                              typedAnswer,
                              setCorrectAnswers,
                              correctlyAnsweredQuestions,
                              setCorrectlyAnsweredQuestions,
                              setComparisonResult,
                              setWasCorrect,
                              setIsLoading
                            ).finally(() => setIsLoading(false));
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
                    <button onClick={handlePreviousCard} className="secondary-button">Back</button>
                    {!wasCorrect && (
                      <button onClick={handleNextCard} className="secondary-button">Skip</button>
                    )}
                    <button onClick={handleShowAnswer} className="secondary-button">
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                  </div>
                </div>
                {isLoading && <p>Loading...</p>}
                <div className="comparison-result">
                  <p><strong>Result:</strong> {comparisonResult}</p>
                  {wasCorrect || comparisonResult === 'Correct' ? (
                    <>
                      {correctAnswers === totalCards && currentCardIndex === shuffledFlashcards.length - 1 ? (
                        <button onClick={handleFinish}>Finish</button>
                      ) : (
                        <button onClick={handleNextCard}>Next</button>
                      )}
                      <button 
                        onClick={() => { setShowFeedback(true); provideFeedback(); }} 
                        disabled={isFeedbackLoading || (hasFeedbackBeenProvided && !newAnswerProvided)}
                      >
                        {isFeedbackLoading ? 'Loading...' : hasFeedbackBeenProvided && !newAnswerProvided ? 'Feedback' : 'Get Feedback'}
                      </button>
                      {showFeedback && feedback && (
                        <div className="feedback-modal">
                          <p>{feedback}</p>
                          <button onClick={() => setShowFeedback(false)}>Close</button>
                        </div>
                      )}
                    </>
                  ) : null}
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
