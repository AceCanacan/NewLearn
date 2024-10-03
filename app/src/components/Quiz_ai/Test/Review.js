import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebase'; // Ensure this path is correct
import { onAuthStateChanged } from 'firebase/auth';
import './Review.css';



const Review = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState('');
  const [hint, setHint] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [ setWasCorrect] = useState(false);
  const [ setCorrectAnswers] = useState(0);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState(new Set());
  const [user, setUser] = useState(null);

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
        setIsLoading(true);
        const flashcardsDocRef = doc(db, `users/${user.uid}/decks`, deckName);
        const flashcardsDoc = await getDoc(flashcardsDocRef);

        if (flashcardsDoc.exists()) {
          const flashcardsData = flashcardsDoc.data().flashcards || [];
          setFlashcards(flashcardsData);
        } else {
          console.error('No such document!');
        }
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [user, deckName]);

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


  const startRecording = async (setIsRecording, setMediaRecorder, processRecording) => {
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

  const finishRecording = (mediaRecorder, setIsRecording, setIsLoading) => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
        setIsRecording(false);
        setIsLoading(true);
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
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
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
    }
  };

  const compareQuestion = async (userQuestion) => {
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;
    const userAnswer = typingMode ? typedAnswer : userQuestion;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant. Answer strictly yes or no.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `User Answer: ${userAnswer}` },
      { role: 'user', content: 'Do the user answer and the original answer convey similar meanings or support the same idea? Answer strictly yes or no.' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
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
        const result = data.choices[0].message.content.trim().replace('.', '').toLowerCase();
        if (result === 'yes') {
          if (!correctlyAnsweredQuestions.has(currentCardIndex)) {
            setCorrectAnswers(prev => prev + 1);
            setCorrectlyAnsweredQuestions(prev => new Set(prev).add(currentCardIndex));
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
    }
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    resetState();
  };

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
    resetState();
  };

  const handleCardClick = (index) => {
    setCurrentCardIndex(index);
    resetState();
  };

  const resetState = () => {
    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setWasCorrect(false);
    setTypedAnswer('');
  };

  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const getHint = async () => {
    setIsLoading(true);
    setHint('');
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: 'The user\'s answer was incorrect. Provide a hint that will help the user get closer to the answer but does not directly reveal it.' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
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
      } else {
        setHint('Error: No response from model');
      }
    } catch (error) {
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingProcess = async (audioBlob) => {
    await processRecording(audioBlob, (text) => 
      compareQuestion(
        text, 
        flashcards, 
        currentCardIndex, 
        typingMode, 
        typedAnswer, 
        setCorrectAnswers, 
        correctlyAnsweredQuestions, 
        setCorrectlyAnsweredQuestions, 
        setComparisonResult, 
        setWasCorrect, 
        setIsLoading
      )
    );
  };

  return (
    <div className="review-container">
      <div className="sidebar">
        <h3>{deckName}</h3>
        <button className="top-right-button" onClick={() => navigate(`/Deck/${deckName}`)}>
          Done
        </button>
        <ul className="card-list">
          {flashcards.map((flashcard, index) => (
            <li 
              key={index} 
              className={`card-item ${index === currentCardIndex ? 'active' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              {flashcard.question}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        {flashcards.length > 0 ? (
          <>
            <div className="flashcard">
              <p><strong>Q:</strong> {flashcards[currentCardIndex].question}</p>
              {showAnswer && (
                <p><strong>A:</strong> {flashcards[currentCardIndex].answer}</p>
              )}
              <div className="flashcard-buttons">
                <button onClick={() => setTypingMode(!typingMode)}>
                  {typingMode ? 'Voice Mode' : 'Type Mode'}
                </button>
                {!typingMode && !isRecording && !isLoading && comparisonResult !== 'Incorrect' && (
                  <button onClick={() => startRecording(setIsRecording, setMediaRecorder, handleRecordingProcess)}>Start</button>
                )}
                {typingMode && (
                  <>
                    <input
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="Type your answer here"
                    />
                    <button
                      onClick={() => compareQuestion(typedAnswer, flashcards, currentCardIndex, typingMode, typedAnswer, setCorrectAnswers, correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions, setComparisonResult, setWasCorrect, setIsLoading)}
                      disabled={!typedAnswer.trim()}
                    >
                      Send
                    </button>
                  </>
                )}
                {!typingMode && isRecording && (
                  <button onClick={() => finishRecording(mediaRecorder, setIsRecording, setIsLoading)}>Finish</button>
                )}
                {comparisonResult === 'Incorrect' && !isRecording && !isLoading && (
                  <button onClick={() => startRecording(setIsRecording, setMediaRecorder, handleRecordingProcess)}>Try Again</button>
                )}
                {comparisonResult === 'Incorrect' && (
                  <>
                    <button onClick={getHint}>Get Hint</button>
                    {hint && <p><strong>Hint:</strong> {hint}</p>}
                  </>
                )}
              </div>
              <div className="flashcard-secondary-buttons">
                <button onClick={handlePreviousCard} className="secondary-button">Back</button>
                <button onClick={handleNextCard} className="secondary-button">Next</button>
                <button onClick={handleShowAnswer} className="secondary-button">
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
              </div>
            </div>

            {isLoading && <p>Loading...</p>}
            <div className="comparison-result">
              <p><strong>Result:</strong> {comparisonResult}</p>
            </div>
          </>
        ) : (
          <p>No flashcards available in this deck.</p>
        )}
      </div>
    </div>
  );
};

export default Review;
