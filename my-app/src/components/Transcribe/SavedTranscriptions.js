import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './transcribe.css';  // Ensure your CSS file includes styles for modal-overlay and modal-content
import { useNavigate } from 'react-router-dom';

import {  setDoc, doc, deleteDoc,collection, getDocs} from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';

const loadFromFirestore = async (collectionPath, defaultValue) => {
    try {
      const collectionRef = collection(db, ...collectionPath.split('/'));
      const querySnapshot = await getDocs(collectionRef);
      const data = querySnapshot.docs.map(doc => doc.data());
      console.log("Collection data:", data);
      return data.length ? data : defaultValue;
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
      return defaultValue;
    }
  };

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split('/'));
    await setDoc(docRef, value);
  } catch (error) {
  }
};


const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [transcriptionToDelete, setTranscriptionToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const collectionPath = `users/${user.uid}/transcriptions`;
        const savedData = (await loadFromFirestore(collectionPath, [])).sort((a, b) => b.id - a.id);
        setSavedTranscriptions(savedData);
      }
    };
    fetchData();
  }, []);

  const handleSaveEdit = async (id) => {
    const user = auth.currentUser;
    if (user) {
      const userDocPath = `users/${user.uid}/transcriptions/${id}`;
      const updatedTranscriptions = savedTranscriptions.map(transcription =>
        transcription.id === id ? { ...transcription, text: editText } : transcription
      );
      setSavedTranscriptions(updatedTranscriptions);
      await saveToFirestore(userDocPath, { id, text: editText });
    }
    setEditingId(null);
    setEditText('');
  };
  
  const handleDelete = async (id) => {
    const user = auth.currentUser;
    if (user) {
      const userDocPath = `users/${user.uid}/transcriptions/${id}`;
      await deleteDoc(doc(db, userDocPath)); // Import and use the deleteDoc function from Firestore
      
      const updatedTranscriptions = savedTranscriptions.filter(t => t.id !== id);
      setSavedTranscriptions(updatedTranscriptions);
    }
    setShowDisclaimer(false);
    setTranscriptionToDelete(null);
  };
  
  const handleEdit = (id) => {
    const transcription = savedTranscriptions.find(t => t.id === id);
    setEditingId(id);
    setEditText(transcription.text);
  };

  const showDeleteModal = (id) => {
    setShowDisclaimer(true);
    setTranscriptionToDelete(id);
  };

  const cancelDelete = () => {
    setShowDisclaimer(false);
    setTranscriptionToDelete(null);
  };

  return (
    <div>
      <button onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>Home</button>
      <h2>Saved Transcriptions</h2>
      {savedTranscriptions.length === 0 ? (
        <p>No transcriptions saved yet.</p>
      ) : (
        <ul>
          {savedTranscriptions.map(transcription => (
            <li key={transcription.id}>
              <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                {editingId === transcription.id ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="4"
                      style={{ width: '100%' }}
                    />
                    <button onClick={() => handleSaveEdit(transcription.id)} style={{ marginTop: '10px' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ marginTop: '10px', marginLeft: '10px' }}>Cancel</button>
                    <button onClick={() => showDeleteModal(transcription.id)} style={{ marginTop: '10px', marginLeft: '10px' }}>Delete</button>
                  </>
                ) : (
                  <>
                    <ReactMarkdown>{transcription.text}</ReactMarkdown>
                    <button onClick={() => handleEdit(transcription.id)} style={{ marginTop: '10px', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => showDeleteModal(transcription.id)} style={{ marginTop: '10px', marginLeft: '10px' }}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {showDisclaimer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Are you sure you want to delete this transcription? This action cannot be undone.</p>
            <button onClick={() => handleDelete(transcriptionToDelete)} style={{ marginRight: '10px' }}>Yes</button>
            <button onClick={cancelDelete}>No</button>
          </div>
        </div>
        
      )}
<button onClick={() => navigate('/transcribe')} style={{ marginTop: '20px' }}>+</button>

    </div>
  );
};

export default SavedTranscriptions;