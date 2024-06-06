import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function Test() {
  const { deckName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    // Retrieve flashcards from localStorage for the specific deck
    const storedFlashcards = JSON.parse(localStorage.getItem(deckName)) || [];
    setFlashcards(storedFlashcards);
  }, [deckName]);

  const handleNextCard = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      setAudioBlob(event.data);
    };

    recorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder.stop();
  };

  const transcribeAudio = async () => {
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
      console.log('Transcription response:', data); // Debugging log
      setTranscribedText(data.text);
      compareQuestion(data.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setComparisonResult(`Error transcribing audio: ${error.message}`);
    }
  };

  const compareQuestion = async (userQuestion) => {
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;
  
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Original Question: ${originalQuestion}` },
      { role: 'user', content: `Original Answer: ${originalAnswer}` },
      { role: 'user', content: `User Question: ${userQuestion}` },
      { role: 'user', content: 'Does the user question match the context of the original answer? Answer yes or no.' }
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
      console.log('Comparison response:', data); // Debugging log
      if (data.choices && data.choices.length > 0) {
        setComparisonResult(data.choices[0].message.content.trim());
      } else {
        console.error('No choices in response:', data);
        setComparisonResult('Error: No response from model');
      }
    } catch (error) {
      console.error('Error comparing question:', error);
      setComparisonResult(`Error: Unable to compare question. Details: ${error.message}`);
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
          {!showAnswer && (
            <button onClick={handleShowAnswer}>Show Answer</button>
          )}
          <button onClick={handleNextCard}>Next</button>
        </div>
      ) : (
        <p>No flashcards available in this deck.</p>
      )}
      <div>
        <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
        <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
        <button onClick={transcribeAudio} disabled={!audioBlob}>Transcribe Audio</button>
      </div>
      <div>
        <p><strong>Transcribed Question:</strong> {transcribedText}</p>
        <p><strong>Comparison Result:</strong> {comparisonResult}</p>
      </div>
    </div>
  );
}

export default Test;
