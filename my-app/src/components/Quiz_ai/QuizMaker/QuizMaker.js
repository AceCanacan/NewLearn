import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebase'; // Ensure this path is correct
import { onAuthStateChanged } from 'firebase/auth';
import './QuizMaker.css';

const QuizMaker = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [customSuggestions, setCustomSuggestions] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [user, setUser] = useState(null);
  const { deckName } = useParams();
  const navigate = useNavigate();

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

  
  const handleGenerate = async () => {
    if (!user) {
      alert('You need to be signed in to generate questions.');
      return;
    }

    const deckDocRef = doc(db, `users/${user.uid}/decks`, deckName);
    const deckDoc = await getDoc(deckDocRef);

    if (deckDoc.exists() && deckDoc.data().generated) {
      alert('You have already generated questions for this deck.');
      return;
    }


    const saveGeneratedQuestions = async (generatedQuestions) => {
      const limitedQuestions = generatedQuestions.slice(0, 10);
      const flashcards = limitedQuestions.map(q => ({ question: q.question, answer: q.answer }));

      try {
        await setDoc(deckDocRef, {
          flashcards: flashcards,
          generated: true,
        }, { merge: true });
        alert('Questions generated and saved successfully.');
      } catch (error) {
        console.error('Error saving generated questions:', error);
        alert('Failed to save generated questions.');
      }
    };
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

  
    if (!inputText.trim()) {
      alert('Please enter some text.');
      return;
    }
  
    if (!confirmed) {
      alert('Please confirm your suggestions first.');
      return;
    }
  
    const userConfirmed = window.confirm('This action can only be performed once per deck and you will not be able to generate new questions again for this deck. Do you want to proceed?');
  
    if (!userConfirmed) {
      return;
    }
  
    setIsLoading(true);
  
    // Combine AI-generated and custom suggestions
    const allSuggestions = [
      ...suggestions.filter(suggestion => selectedSuggestions.has(suggestion.id)),
      ...customSuggestions.filter(suggestion => selectedSuggestions.has(suggestion.id))
    ];
    const finalPrompt = allSuggestions.map(suggestion => suggestion.text).join(' ');

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { 
        role: 'user', 
        content: `Given this text: "${inputText}". This information will be used to create a quiz. Generate a series of questions and answers from the provided text. Format: Q: Question A: Answer. MAXIMUM OF 10 QUESTIONS ONLY.` 
      },
      { 
        role: 'user', 
        content: `Include these suggestions: ${finalPrompt} Format: Q: Question A: Answer. MAXIMUM OF 10 QUESTIONS ONLY` 
      }
    ];
  
    console.log('Messages:', messages); // Log the messages array
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`, // Replace with your OpenAI API key
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
  
  const handleConfirm = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text.');
      return;
    }
  
    setIsLoading(true);
  
    // Split the input text into sentences
    const sentences = inputText.split('.').map(sentence => sentence.trim()).filter(sentence => sentence);
  
    // Randomize sentences and always include the first two to three sentences
    const shuffledSentences = sentences.sort(() => 0.5 - Math.random());
    const randomSentences = shuffledSentences.slice(0, 4);
  
    // Combine first two sentences with random sentences
    const selectedSentences = [
      sentences[0], 
      sentences[1], 
      ...(sentences[2] ? [sentences[2]] : []),
      ...randomSentences
    ].slice(0, 4);
  
    const prompt = selectedSentences.join(' ');
  
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { 
        role: 'user', 
        content: `Here is some text: "${prompt}". This information will be used to create a quiz. Provide four detailed and varied suggestions on how to create quiz questions based on this content. 
        Each suggestion should focus on a different aspect of the content, such as functions, processes, implications, comparisons, or definitions. 
        Ensure that each suggestion is clear, specific, and comprehensive, helping to formulate insightful quiz questions. 
        You are not supposed to provide questions or any other information, only the four suggestions.
              
        Examples of suggestions:
        1. Focus on key functions.
        2. Highlight major processes.
        3. Discuss implications.
        4. Compare different elements.
        5. Define and explain key terms.
        
        The output should be formatted as follows:
        1. [Suggestion 1]
        2. [Suggestion 2]
        3. [Suggestion 3]
        4. [Suggestion 4]`
      }
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
          max_tokens: 150
        })
      });
  
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }
  
      const data = await response.json();
  
      if (data.choices && data.choices.length > 0) {
        const suggestionsText = data.choices[0].message.content.trim();
        const suggestionPattern = /\d\.\s*(.*?)(?=\n|$)/g;
        let match;
        const generatedSuggestions = [];
        let index = 0;
  
        while ((match = suggestionPattern.exec(suggestionsText)) !== null) {
          generatedSuggestions.push({
            id: index,
            text: match[1].trim()
          });
          index++;
        }
  
        // Log each suggestion individually for debugging
        generatedSuggestions.forEach((suggestion, idx) => {
        });
  
        setSuggestions(generatedSuggestions);
        setConfirmed(true);
      } else {
        alert('Failed to generate suggestions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Error generating suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  

  const toggleSuggestion = (id) => {
    setSelectedSuggestions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const addCustomSuggestion = () => {
    if (!customInput.trim()) {
      return;
    }
  
    const newSuggestion = {
      id: suggestions.length + customSuggestions.length,
      text: customInput.trim()
    };
  
    setCustomSuggestions([...customSuggestions, newSuggestion]);
    console.log('Custom suggestions:', [...customSuggestions, newSuggestion]); // Add this log
    setCustomInput('');
  };
  
  const removeCustomSuggestion = (id) => {
    setCustomSuggestions(customSuggestions.filter(suggestion => suggestion.id !== id));
    setSelectedSuggestions(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(id);
      return newSelected;
    });
  };

  return (
    <div className="quizmaker-container">
      <h2>QuizMaker</h2>
      <textarea
        rows="10"
        cols="50"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter the large body of text here..."
        disabled={confirmed}
      ></textarea>
      <div>{inputText.length}/1000 characters</div>
      {!confirmed && (
        <button onClick={handleConfirm}>
          Confirm
        </button>
      )}
      {confirmed && (
        <>
          <div className="suggestions-container">
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`suggestion-box ${selectedSuggestions.has(suggestion.id) ? 'selected' : ''}`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                {suggestion.text}
              </div>
            ))}
            {customSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`suggestion-box ${selectedSuggestions.has(suggestion.id) ? 'selected' : ''}`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                {suggestion.text}
                <button onClick={(e) => {
                  e.stopPropagation();
                  removeCustomSuggestion(suggestion.id);
                }}>X</button>
              </div>
            ))}
          </div>
          <div className="custom-suggestions">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Add your own suggestion"
            />
            <button onClick={addCustomSuggestion}>+</button>
          </div>
        </>
      )}
      {confirmed && (
        <button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Questions'}
        </button>
      )}
    </div>
  );
  };

export default QuizMaker;