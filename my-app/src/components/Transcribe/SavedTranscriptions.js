import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './savedtranscriptions.css';  // Your custom styles
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const loadFromFirestore = async (docPath, defaultValue) => {
  try {
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return defaultValue;
    }
  } catch (error) {
    console.error("Error loading data from Firestore:", error);
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, docPath);
    await setDoc(docRef, value);
  } catch (error) {
    console.error("Error saving data to Firestore:", error);
  }
};

const removeFromFirestore = async (docPath) => {
  try {
    const docRef = doc(db, docPath);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting data from Firestore:", error);
  }
};

const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [activeTranscription, setActiveTranscription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();

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
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      await saveToFirestore(docPath, { ...activeTranscription, text: editText });
      setSavedTranscriptions((prev) =>
        prev.map((t) => (t.id === activeTranscription.id ? { ...t, text: editText } : t))
      );
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      await removeFromFirestore(docPath);
      setSavedTranscriptions((prev) => prev.filter((t) => t.id !== activeTranscription.id));
      handleClose();
    }
  };

  const handleClose = () => {
    setActiveTranscription(null);
    setIsEditing(false);
  };

  return (
    <div>
      <button onClick={() => navigate('/')}>Back to Home</button>
      <h2 className="st-title">Saved Transcriptions</h2>
      {savedTranscriptions.length === 0 ? (
        <p className="st-no-transcriptions">No transcriptions saved yet.</p>
      ) : (
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
      )}
      
      {activeTranscription && (
        <div className="st-transcription-modal">
          <div className="st-modal-content">
            <button className="st-close-button" onClick={handleClose}>X</button>
            <h2>{activeTranscription.title}</h2>
            {isEditing ? (
              <textarea
                className="st-textarea"
                value={editText}
                rows="20"
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <textarea
                className="st-textarea"
                value={activeTranscription.text}
                rows="20"
                readOnly
              />
            )}
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
