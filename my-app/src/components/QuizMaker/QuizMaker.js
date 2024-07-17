// QuizMaker.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QuizMaker = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deckName } = useParams();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text.');
      return;
    }

    setIsLoading(true);

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Text to generate questions from: ${inputText}` },
      { role: 'user', content: 'Generate a series of questions and answers from the provided text. Format: Q: Question A: Answer. MAXIMUM OF 10 QUESTIONS ONLY' }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`, // Replace with your OpenAI API key
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const text = data.choices[0].message.content.trim();
        const qaPairs = text.split('\n').reduce((acc, line) => {
          if (line.startsWith('Q: ')) {
            acc.push({ question: line.slice(3).trim(), answer: '' });
          } else if (line.startsWith('A: ') && acc.length) {
            acc[acc.length - 1].answer = line.slice(3).trim();
          }
          return acc;
        }, []);

        saveGeneratedQuestions(qaPairs);
        navigate(`/deck/${deckName}`);
      } else {
        alert('Failed to generate questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveGeneratedQuestions = (generatedQuestions) => {
    const flashcards = generatedQuestions.map(q => ({ question: q.question, answer: q.answer }));
    localStorage.setItem(deckName, JSON.stringify(flashcards));
    const decks = JSON.parse(localStorage.getItem('decks')) || {};
    decks[deckName] = flashcards.length;
    localStorage.setItem('decks', JSON.stringify(decks));
  };

  return (
    <div>
      <h2>QuizMaker</h2>
      <textarea
        rows="10"
        cols="50"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter the large body of text here..."
      ></textarea>
      <button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Questions'}
      </button>
    </div>
  );
};

export default QuizMaker;
