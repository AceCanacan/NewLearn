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

  useEffect(() => {
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(storedFlashcards);
  }, [deckName]);

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
    formData.append('file', new Blob([audioBlob], { type: 'audio/mp3' }), 'audio.mp3');

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
      console.error('Error processing audio:', error);
      setComparisonResult(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const compareQuestion = async (userQuestion) => {
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant. Answer strictly yes or no.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `User Question: ${userQuestion}` },
      { role: 'user', content: 'Does the user question match the context of the original answer? Answer strictly yes or no.' }
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
      if (data.choices && data.choices.length > 0) {
        const result = data.choices[0].message.content.trim().toLowerCase();
        setComparisonResult(result === 'yes' ? 'Correct' : 'Incorrect');
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
      { role: 'user', content: `The user's question was incorrect. Provide a hint that will help the user get closer to the answer but does not directly reveal it.` }
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

  return (
    <div className="test-yourself">
      <h3>Test Yourself: {deckName}</h3>
      {flashcards.length > 0 ? (
        <div className="flashcard">
          <p><strong>Q:</strong> {flashcards[currentCardIndex].question}</p>
          {showAnswer && (
            <p><strong>A:</strong> {flashcards[currentCardIndex].answer}</p>
          )}
          <div className="flashcard-buttons">
            {!isRecording && !isLoading && (
              <button onClick={startRecording}>Start</button>
            )}
            {isRecording && (
              <button onClick={finishRecording}>Finish</button>
            )}
            {showAnswer && !isRecording && !isLoading && comparisonResult === 'Correct' && (
              <button onClick={handleNextCard}>Next</button>
            )}
            {showAnswer && !isRecording && !isLoading && comparisonResult === 'Incorrect' && (
              <button onClick={getHint}>Get Hint</button>
            )}
            {comparisonResult === 'Incorrect' && (
              <button onClick={handleNextCard}>Skip</button>
            )}
            {showAnswer && !isRecording && !isLoading && (
              <button onClick={handleShowAnswer}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>No flashcards available in this deck.</p>
      )}
      {isLoading && <p>Loading...</p>}
      <div className="comparison-result">
        <p><strong>Result:</strong> {comparisonResult}</p>
        {hint && <p><strong>Hint:</strong> {hint}</p>}
      </div>
    </div>
  );
}

export default Test;
