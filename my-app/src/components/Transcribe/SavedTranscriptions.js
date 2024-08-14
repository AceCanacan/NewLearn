import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './savedtranscriptions.css';  // Your custom styles
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, getFirestore } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, docPath);
    await setDoc(docRef, value);
  } catch (error) {
    console.error("Error saving data to Firestore:", error);
  }
};

const firestore = getFirestore();

const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [activeTranscription, setActiveTranscription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();
  const [editTitle, setEditTitle] = useState('');

  const removeFromFirestore = async (docPath) => {
    try {
      const docRef = doc(db, docPath);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting data from Firestore:", error);
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const collectionPath = `users/${user.uid}/transcriptions`;
        const collectionRef = collection(db, collectionPath);
        const querySnapshot = await getDocs(collectionRef);
        const savedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.id - a.id);
        setSavedTranscriptions(savedData);
      }
    };
    fetchData();
  }, []);

  const handleTranscriptionClick = (transcription) => {
    setActiveTranscription(transcription);
    setEditText(transcription.text);
    setEditTitle(transcription.title);  // Set the title for editing
  };
  

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      await saveToFirestore(docPath, { ...activeTranscription, title: editTitle, text: editText });
      setSavedTranscriptions((prev) =>
        prev.map((t) => (t.id === activeTranscription.id ? { ...t, title: editTitle, text: editText } : t))
      );      
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      console.log("Attempting to delete docPath:", docPath); // Debugging line
  
      let attempts = 0;
      let success = false;
  
      while (attempts < 3 && !success) {
        try {
          await removeFromFirestore(docPath);
          console.log(`Attempt ${attempts + 1}: Deletion successful.`);
          
          // Check if the document is still there
          const docExists = await checkIfDocumentExists(docPath);
          if (!docExists) {
            success = true;
            setSavedTranscriptions((prev) =>
              prev.filter((t) => t.id !== activeTranscription.id)
            );
            setActiveTranscription(null);
          } else {
            console.log(`Attempt ${attempts + 1}: Document still exists.`);
          }
        } catch (error) {
          console.error(`Attempt ${attempts + 1}: Error deleting data from Firestore:`, error);
        }
        attempts++;
      }
  
      if (!success) {
        console.error("Failed to delete document after 3 attempts.");
      }
    }
  };
  
  const checkIfDocumentExists = async (docPath) => {
    const docRef = doc(firestore, docPath);  // Correctly creates a document reference
    const docSnapshot = await getDoc(docRef);  // Retrieves the document snapshot
    return docSnapshot.exists();  // Checks if the document exists
  };
  
  

  const handleClose = () => {
    setActiveTranscription(null);
    setIsEditing(false);
  };

  return (
    <div>
      <button onClick={() => navigate('/')}>Back to Home</button>


      {savedTranscriptions.length === 0 && (
  <p className="st-no-transcriptions">No transcriptions saved yet.</p>
)}

<ul className="st-transcriptions-list">
  {savedTranscriptions.map(transcription => (
    <li key={transcription.id} className="st-transcription-item">
      <div className="st-transcription-container" onClick={() => handleTranscriptionClick(transcription)}>
        <div className="st-transcription-header">
          {transcription.title}
        </div>
        <div className="st-transcription-content">
          <ReactMarkdown className="st-markdown-content">
            {transcription.text.length > 100 
              ? transcription.text.substring(0, 100) + "..." 
              : transcription.text}
          </ReactMarkdown>
        </div>
      </div>
    </li>
  ))}
  <li className="st-transcription-item">
    <div className="st-transcription-container st-add-card" onClick={() => navigate('/transcribe')}>
      <span className="st-plus-icon">+</span>
    </div>
  </li>
</ul>




  
      {activeTranscription && (
        <div className="st-transcription-modal">
          <div className="st-modal-content">
            <button className="st-close-button" onClick={handleClose}>X</button>
  
            {isEditing ? (
              <input 
                type="text" 
                className="st-title-input" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
              />
            ) : (
              <h2>{activeTranscription.title}</h2>
            )}
  
            <textarea
              className="st-textarea"
              value={isEditing ? editText : activeTranscription.text}
              rows="20"
              onChange={isEditing ? (e) => setEditText(e.target.value) : undefined}
              readOnly={!isEditing}
            />
  
            <div className="st-button-group">
              {isEditing ? (
                <>
                  <button className="st-save-button" onClick={handleSave}>Save</button>
                  <button className="st-cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              ) : (
                <button className="st-edit-button" onClick={handleEdit}>Edit</button>
              )}
              <button className="st-delete-button" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  };

export default SavedTranscriptions;
