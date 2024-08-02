import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import './Notesmaker.css';

import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';

const loadFromFirestore = async (collectionPath, defaultValue) => {
  try {
    const collectionRef = collection(db, ...collectionPath.split('/'));
    const querySnapshot = await getDocs(collectionRef);
    const data = querySnapshot.docs.map(doc => doc.data());
    return data.length ? data : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    await setDoc(docRef, value, { merge: true });  // Ensure merging to avoid overwriting the entire document
  } catch (error) {
  }
};


const NotesMaker = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [customSuggestions, setCustomSuggestions] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [user, setUser] = useState(null);
  const [popupContent, setPopupContent] = useState('');

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
      alert('You need to be signed in to generate notes.');
      return;
    }
  
    if (!inputText.trim()) {
      alert('Please enter some text.');
      return;
    }
  
    if (!confirmed) {
      alert('Please confirm your suggestions first.');
      return;
    }
  
    const userConfirmed = window.confirm('Do you want to proceed with generating notes?');
  
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
        content: `Given this text: "${inputText}". Please create organized notes from the provided text.` 
      },
      { 
        role: 'user', 
        content: `Include these suggestions: ${finalPrompt} when creating the notes.` 
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
          max_tokens: 300
        })
      });
  
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }
  
      const data = await response.json();
  
      if (data.choices && data.choices.length > 0) {
        const notes = data.choices[0].message.content.trim();
        
  
        // Show pop-up preview
        setPopupContent(notes);
      } else {
        alert('Failed to generate notes. Please try again.');
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      alert('Error generating notes. Please try again.');
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
          content: `Here is some text: "${prompt}". This information will be used to create organized notes. Provide four detailed and varied suggestions on how to create these notes based on this content. 
                
          Examples of suggestions:
          1. Make it bulleted.
          2. Organize it in chronological order to show cause and effect.

          Maximum 4 words each suggestion
          
          The output should be formatted as follows:
          1. [Suggestion 1]
          2. [Suggestion 2]
          
          Maximum 4 words each suggestion
          Maximum 4 words each suggestion
          Maximum 4 words each suggestion
          `
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
          model: 'gpt-4o-mini',
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

  const saveNotes = async (notes) => {
    const uniqueId = Date.now().toString();
    const newNote = { id: uniqueId, text: notes };
  
    try {
      await saveToFirestore(`savedNotes/${uniqueId}`, newNote);
      console.log('Notes saved with ID:', uniqueId);
      handleReset();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };
  
  
  const deleteNotes = () => {
    setPopupContent('');
    setConfirmed(false);
    setInputText('');
    setSuggestions([]);
    setCustomSuggestions([]);
    setSelectedSuggestions(new Set());
    console.log('Notes deleted and state reverted.');
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

  const handleReset = () => {
    setInputText('');
    setIsLoading(false);
    setSuggestions([]);
    setCustomSuggestions([]);
    setCustomInput('');
    setSelectedSuggestions(new Set());
    setConfirmed(false);
    setPopupContent('');
  };
  

  


  return (
    <div className="quizmaker-container">
      <button onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>Back to Home</button>
      <button onClick={() => navigate('/savednotes')} style={{ marginBottom: '10px' }}>Notes</button>
      {popupContent ? (
        <div className="notes-display">
          <pre>{popupContent}</pre>
          <button onClick={() => saveNotes(popupContent)}>Save</button>
          <button onClick={() => deleteNotes()}>Delete</button>
          <button onClick={handleReset}>Upload Again</button>
        </div>
      ) : (
        <>
          <h2>QuizMaker</h2>
          <textarea
            rows="10"
            cols="50"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter the large body of text here..."
            disabled={confirmed}
          ></textarea>
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
        </>
      )}
    </div>
  );
  
  
  };

export default NotesMaker;