import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Test.css';

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    const storedShuffled = JSON.parse(localStorage.getItem(`${deckName}-shuffled`)) || storedFlashcards;
    const storedCurrentIndex = parseInt(localStorage.getItem(`${deckName}-currentIndex`), 10);
    const storedCorrectlyAnsweredQuestions = new Set(JSON.parse(localStorage.getItem(`${deckName}-correctlyAnsweredQuestions`)) || []);
    const storedCorrectAnswers = parseInt(localStorage.getItem(`${deckName}-correctAnswers`), 10) || 0;
    const storedHintUsed = JSON.parse(localStorage.getItem(`${deckName}-hintUsed`)) || false;
    const storedTypedAnswer = localStorage.getItem(`${deckName}-typedAnswer`) || '';
    const storedWasCorrect = localStorage.getItem(`${deckName}-wasCorrect`) === 'true';
    const storedComparisonResult = localStorage.getItem(`${deckName}-comparisonResult`) || '';
    const storedFeedback = localStorage.getItem(`${deckName}-feedback`) || '';
    const storedShowAnswer = localStorage.getItem(`${deckName}-showAnswer`) === 'true';
    const storedIsRecording = localStorage.getItem(`${deckName}-isRecording`) === 'true';
    const storedLastCorrectAnswer = localStorage.getItem(`${deckName}-lastCorrectAnswer`) || '';
    const storedShowFeedback = localStorage.getItem(`${deckName}-showFeedback`) === 'true';
    const storedIsFeedbackLoading = localStorage.getItem(`${deckName}-isFeedbackLoading`) === 'true';
    const storedHasFeedbackBeenProvided = localStorage.getItem(`${deckName}-hasFeedbackBeenProvided`) === 'true';
    const storedNewAnswerProvided = localStorage.getItem(`${deckName}-newAnswerProvided`) === 'true';
    const storedFinished = localStorage.getItem(`${deckName}-finished`) === 'true';
    const storedTypingMode = localStorage.getItem(`${deckName}-typingMode`) === 'true';

    if (storedShuffled && storedCurrentIndex !== null && storedCorrectAnswers !== null && storedCorrectlyAnsweredQuestions.size > 0) {
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
  }, [deckName]);

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
            setCorrectAnswers(prev => prev + 1);
            const newCorrectlyAnsweredQuestions = new Set(correctlyAnsweredQuestions).add(currentCardIndex);
            setCorrectlyAnsweredQuestions(newCorrectlyAnsweredQuestions);
            localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...newCorrectlyAnsweredQuestions]));
          }
          setComparisonResult('Correct');
          setWasCorrect(true);
        } else {
          setComparisonResult('Incorrect');
        }
      } else {
        setComparisonResult('Error: No response from model');
      }
    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      saveProgress();
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

    saveProgress();
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

    saveProgress();
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
    saveProgress();
  };

  const saveProgress = () => {
    localStorage.setItem(`${deckName}-shuffled`, JSON.stringify(shuffledFlashcards));
    localStorage.setItem(`${deckName}-currentIndex`, currentCardIndex);
    localStorage.setItem(`${deckName}-correctAnswers`, correctAnswers);
    localStorage.setItem(`${deckName}-correctlyAnsweredQuestions`, JSON.stringify([...correctlyAnsweredQuestions]));
    localStorage.setItem(`${deckName}-hintUsed`, JSON.stringify(hintUsed));
    localStorage.setItem(`${deckName}-typedAnswer`, typedAnswer);
    localStorage.setItem(`${deckName}-wasCorrect`, wasCorrect);
    localStorage.setItem(`${deckName}-comparisonResult`, comparisonResult);
    localStorage.setItem(`${deckName}-feedback`, feedback);
    localStorage.setItem(`${deckName}-showAnswer`, showAnswer);
    localStorage.setItem(`${deckName}-isRecording`, isRecording);
    localStorage.setItem(`${deckName}-lastCorrectAnswer`, lastCorrectAnswer);
    localStorage.setItem(`${deckName}-showFeedback`, showFeedback);
    localStorage.setItem(`${deckName}-isFeedbackLoading`, isFeedbackLoading);
    localStorage.setItem(`${deckName}-hasFeedbackBeenProvided`, hasFeedbackBeenProvided);
    localStorage.setItem(`${deckName}-newAnswerProvided`, newAnswerProvided);
    localStorage.setItem(`${deckName}-finished`, finished);
    localStorage.setItem(`${deckName}-typingMode`, typingMode);
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
      <button className="top-right-button" onClick={() => navigate(`/Deck/${deckName}`)}>
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
                <button onClick={retakeTest}>Retry</button>
                <button onClick={() => window.location.href = `http://localhost:3000/deck/${deckName}`}>Go Home</button>
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
    </div>
  );
};

export default Test;
