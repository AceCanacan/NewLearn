import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Test.css';

function Test() {
  const { deckName } = useParams();
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
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(storedFlashcards);
  }, [deckName]);

  const totalCards = flashcards.length;

  const handleNextCard = () => {
    setShowAnswer(false);
    setComparisonResult('');
    setHint('');
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handleShowAnswer = () => {
    setShowAnswer(!showAnswer);
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
      console.log("Transcription Data:", data);
      compareQuestion(data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
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
      console.log("Comparison API Response:", data);

      if (data.choices && data.choices.length > 0) {
        const result = data.choices[0].message.content.trim().replace('.', '').toLowerCase();
        console.log("Extracted Result:", result);
        if (result === 'yes') {
          setCorrectAnswers(prev => prev + 1);
          setComparisonResult('Correct');
        } else {
          setComparisonResult('Incorrect');
        }
      } else {
        setComparisonResult('Error: No response from model');
      }
    } catch (error) {
      console.error('Error comparing question:', error);
      setComparisonResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getHint = async () => {
    setIsLoading(true);
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `The user's question was incorrect. Provide a hint that will help the user get closer to the answer but does not directly reveal it. ` }
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
      console.log("Hint API Response:", data);

      if (data.choices && data.choices.length > 0) {
        setHint(data.choices[0].message.content.trim());
      } else {
        setHint('Error: No response from model');
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
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
  };

  return (
    <div className="test-yourself">
      <h3>{deckName}</h3>
      {flashcards.length > 0 ? (
        correctAnswers === totalCards ? (
          <div className="completion-message">
            <h2>Way to go! You've reviewed all the cards.</h2>
            <button onClick={retakeTest}>Retake the Test</button>
          </div>
        ) : (
          <>
            <div className="flashcard">
              <p><strong>Q:</strong> {flashcards[currentCardIndex].question}</p>
              {showAnswer && (
                <p><strong>A:</strong> {flashcards[currentCardIndex].answer}</p>
              )}
              <div className="flashcard-buttons">
                <button onClick={() => setTypingMode(!typingMode)}>
                  {typingMode ? 'Switch to Recording' : 'Switch to Typing'}
                </button>
                {!typingMode && !isRecording && !isLoading && (
                  <button onClick={startRecording}>Start</button>
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
                      onClick={() => compareQuestion(typedAnswer)}
                      disabled={!typedAnswer.trim()}
                    >
                      Send
                    </button>
                  </>
                )}
                {!typingMode && isRecording && (
                  <button onClick={finishRecording}>Finish</button>
                )}
                {comparisonResult === 'Correct' && (
                  <button onClick={handleNextCard}>Next</button>
                )}
                {comparisonResult === 'Incorrect' && (
                  <button onClick={getHint}>Get Hint</button>
                )}
              </div>
              <div className="flashcard-secondary-buttons">
                <button onClick={handleNextCard} className="secondary-button">Skip</button>
                <button onClick={handleShowAnswer} className="secondary-button">
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
              </div>
            </div>
            {isLoading && <p>Loading...</p>}
            <div className="comparison-result">
              <p><strong>Result:</strong> {comparisonResult}</p>
              {comparisonResult === 'Incorrect' && hint && (
                <p><strong>Hint:</strong> {hint}</p>
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
    </div>
  );
}

export default Test;
