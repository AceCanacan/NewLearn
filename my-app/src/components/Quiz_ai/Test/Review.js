// Review.jsx
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
  const [hint, setHint] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [comparisonResult, setComparisonResult] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [user, setUser] = useState(null);

  // Authenticate User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? currentUser : null);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Flashcards from Firestore
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const flashcardsDocRef = doc(db, `users/${user.uid}/decks`, deckName);
          const flashcardsDoc = await getDoc(flashcardsDocRef);

          if (flashcardsDoc.exists()) {
            const flashcardsData = flashcardsDoc.data().flashcards || [];
            setFlashcards(flashcardsData);
          } else {
            console.error('No such document!');
          }
        } catch (error) {
          console.error('Error fetching flashcards:', error);
        }
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [user, deckName]);

  // Start Recording Audio
  const startRecording = async () => {
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        const audioBlob = event.data;
        processRecording(audioBlob);
      };

      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  // Finish Recording Audio
  const finishRecording = () => {
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

  // Process Recorded Audio
  const processRecording = async (audioBlob) => {
    const formData = new FormData();
    formData.append('model', 'whisper-1');
    formData.append('file', new Blob([audioBlob], { type: 'audio/mp3' }), 'audio.mp3');

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
      compareAnswer(data.text);
    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Compare User Answer with Correct Answer using OpenAI API
  const compareAnswer = async (userAnswerText) => {
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;
    const userAnswer = typingMode ? typedAnswer : userAnswerText;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant. Answer strictly yes or no.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `User Answer: ${userAnswer}` },
      { role: 'user', content: 'Does the user-provided answer correctly answer the original question? Answer strictly "yes" or "no".' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
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

      if (data.choices && data.choices.length > 0) {
        const result = data.choices[0].message.content.trim().replace('.', '').toLowerCase();
        setComparisonResult(result === 'yes' ? 'Correct' : 'Incorrect');
      } else {
        setComparisonResult('Error: No response from model');
      }
    } catch (error) {
      setComparisonResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Hint from OpenAI API
  const getHint = async () => {
    setIsLoading(true);
    setHint('');
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;

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
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
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
        setHint(data.choices[0].message.content.trim());
        setHintUsed(true);
      } else {
        setHint('Error: No response from model');
      }
    } catch (error) {
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Next Flashcard
  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    resetState();
  };

  // Handle Previous Flashcard
  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
    resetState();
  };

  // Handle Flashcard Selection from Sidebar
  const handleCardClick = (index) => {
    setCurrentCardIndex(index);
    resetState();
  };

  // Reset State for New Flashcard
  const resetState = () => {
    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setHintUsed(false);
    setTypedAnswer('');
  };

  // Toggle Answer Visibility
  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <div className="review-container">
      <div className="sidebar">
        <h3>{deckName}</h3>
        <button className="done-button" onClick={() => navigate(`/Deck/${deckName}`)}>
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
        {isLoading ? (
          <p>Loading...</p>
        ) : flashcards.length > 0 ? (
          <>
            <div className="flashcard">
              <p><strong>Q:</strong> {flashcards[currentCardIndex].question}</p>
              {showAnswer && (
                <p><strong>A:</strong> {flashcards[currentCardIndex].answer}</p>
              )}
            </div>

            <div className="flashcard-buttons">
              <button 
                className="toggle-mode-button" 
                onClick={() => setTypingMode(!typingMode)}
              >
                {typingMode ? 'Voice Mode' : 'Type Mode'}
              </button>

              {typingMode ? (
                <>
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type your answer here"
                    className="answer-input"
                  />
                  <button
                    className="submit-answer-button"
                    onClick={() => {
                      if (typedAnswer.trim()) {
                        setIsLoading(true);
                        compareAnswer(typedAnswer);
                      }
                    }}
                    disabled={!typedAnswer.trim()}
                  >
                    Submit
                  </button>
                </>
              ) : (
                <>
                  {!isRecording && !isLoading && comparisonResult !== 'Correct' && (
                    <button 
                      className="record-button" 
                      onClick={startRecording}
                    >
                      Start Recording
                    </button>
                  )}
                  {isRecording && (
                    <button 
                      className="stop-button" 
                      onClick={finishRecording}
                    >
                      Stop Recording
                    </button>
                  )}
                </>
              )}

              {comparisonResult === 'Incorrect' && (
                <button 
                  className="hint-button" 
                  onClick={getHint}
                >
                  Get Hint
                </button>
              )}
            </div>

            {hint && (
              <div className="hint-section">
                <p><strong>Hint:</strong> {hint}</p>
              </div>
            )}

            {comparisonResult && (
              <div className={`result ${comparisonResult.toLowerCase()}`}>
                <p><strong>Result:</strong> {comparisonResult}</p>
              </div>
            )}

            <div className="navigation-buttons">
              <button 
                className="nav-button previous-button" 
                onClick={handlePreviousCard}
                disabled={flashcards.length <= 1}
              >
                Previous
              </button>
              <button 
                className="nav-button next-button" 
                onClick={handleNextCard}
                disabled={flashcards.length <= 1}
              >
                Next
              </button>
            </div>

            <button 
              className="toggle-answer-button" 
              onClick={handleShowAnswer}
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </>
        ) : (
          <p>No flashcards available in this deck.</p>
        )}
      </div>
    </div>
  );
};

export default Review;
