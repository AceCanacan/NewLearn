import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './transcribe.css';
import { useNavigate } from 'react-router-dom';

import {  setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';


const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    await setDoc(docRef, value, { merge: true });  // Ensure merging to avoid overwriting the entire document
  } catch (error) {
  }
};

function Transcribe() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileValid, setIsFileValid] = useState(false);
  const [error, setError] = useState('');
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [ setTranscriptionToDelete] = useState(null);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setGenerationCount(userDoc.data().generationCount || 0);
        }
      }
    };
    fetchData();
  }, []);
  
  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocPath = `users/${currentUser.uid}/transcriptions/${Date.now()}`;
      const newTranscription = {
        id: Date.now(),
        text: result
      };
      setSavedTranscriptions([...savedTranscriptions, newTranscription]);
      await saveToFirestore(userDocPath, newTranscription);
      handleReset();
      navigate('/savedtranscriptions');
    }
  };
  
  const validFileTypes = ['image/png', 'image/jpeg', 'audio/mpeg'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const fileType = selectedFile.type.split('/')[0];
      setFileType(fileType);
      setIsFileValid(validFileTypes.includes(selectedFile.type) && selectedFile.size <= 2 * 1024 * 1024);
      setError('');
    } else {
      setIsFileValid(false);
      setError('Please select a file.');
    }
  };

  const handleUpload = async () => {
    if (generationCount >= 3) {
      alert('You have reached the maximum number of generations.');
      return;
    }
  
    alert(`You have ${3 - generationCount} transcriptions left. This action cannot be undone.`);
  
    setIsProcessing(true);
    setError('');
    try {
      let transcribedText = '';
  
      if (fileType === 'image') {
        transcribedText = await processImage(file);
      } else if (fileType === 'audio') {
        transcribedText = await processAudio(file);
      }
  
      const organizedText = await organizeText(transcribedText);
      setResult(organizedText);
  
      // Update the generation count in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { generationCount: generationCount + 1 });
      setGenerationCount(generationCount + 1);
  
    } catch (error) {
      console.error('Error during processing:', error);
      setError(`An error occurred during processing: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  


  const handleReset = () => {
    setFile(null);
    setFileType('');
    setResult('');
    setIsFileValid(false);
    setError('');
  };

  const processAudio = async (file) => {
    return await transcribeAudio(file);
  };

  const processImage = async (file) => {
    try {
      
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "What's in this image?" },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });
  
      const data = await response.json();

  
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else if (data.error) {
        console.error("API returned an error:", data.error);
        throw new Error(data.error.message);
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      console.error("Error details:", error.message);
      throw error;
    }
  };

  const transcribeAudio = async (audioFile) => {
    try {
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
  
  
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`
        },
        body: formData
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error('Error response from API:', responseData);
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(responseData)}`);
      }
  
      return responseData.text;
    } catch (error) {
      console.error('Error during audio transcription:', error);
      throw error;
    }
  };
  
  

  const organizeText = async (text) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that organizes text."
          },
          {
            role: "user",
            content: `Organize the following text: ${text}`
          }
        ],
        max_tokens: 300
      })
    });
  
    const data = await response.json();
    return data.choices[0].message.content;
  };


  
  const confirmDelete = () => {
    handleReset();
    setShowDisclaimer(false);
  };
  
  const cancelDelete = () => {
    setShowDisclaimer(false);
    setTranscriptionToDelete(null);
  };

  const ResultContainer = ({ children }) => (
    <div style={{
      border: '1px solid #ddd',
      padding: '10px',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
      marginTop: '10px',
    }}>
      {children}
    </div>
  );

  

  // Add a prompt to show a disclaimer when navigating away
const handleNavigateAway = (destination) => {
  if (!savedTranscriptions.length && !window.confirm("You have unsaved changes. Do you really want to leave?")) {
    return;
  }
  navigate(destination);
};



  return (
    <div>
<button onClick={() => handleNavigateAway('/savedtranscriptions')} style={{ marginTop: '10px' }}>View Saved Transcriptions</button>
      <h2>File Transcription</h2>
      {!result && (
        <>
          <input 
            type="file" 
            accept=".png,.jpg,.jpeg,.mp3" 
            onChange={handleFileChange} 
            disabled={isProcessing}
          />
          {file && !isFileValid && (
            <p style={{color: 'red'}}>
              File must be a valid type (PNG, JPEG, or MP3) and no larger than 5 MB.
            </p>
          )}
          <button 
            onClick={handleUpload} 
            disabled={isProcessing || !isFileValid}
            style={{marginTop: '10px', marginBottom: '10px'}}
          >
            {isProcessing ? 'Processing...' : 'Upload and Transcribe'}
          </button>
        </>
      )}
      {isProcessing && <p>Processing your file. Please wait...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {result && (
          <div>
            <ResultContainer>
              <h3>Transcription Result:</h3>
              <ReactMarkdown>{result}</ReactMarkdown>
              <button onClick={handleSave} style={{ marginTop: '10px' }}>Save</button> {/* Save button */}
              <button onClick={() => setShowDisclaimer(true)} style={{ marginTop: '10px', marginLeft: '10px' }}>Delete</button>
            </ResultContainer>
            {showDisclaimer && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <p>Are you sure you want to delete this transcription? This action cannot be undone.</p>
                  <button onClick={confirmDelete} style={{ marginRight: '10px' }}>Yes</button>
                  <button onClick={cancelDelete}>No</button>
                </div>
              </div>
            )}
          </div>
        )}
      
    </div>
  );
}

export default Transcribe;