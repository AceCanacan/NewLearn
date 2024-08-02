import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

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

const SavedNotes = () => {
  const [savedNotes, setSavedNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotes = async () => {
        const notes = (await loadFromFirestore('savedNotes', [])).sort((a, b) => b.id - a.id);
      setSavedNotes(notes);
    };
    loadNotes();
  }, []);

  const handleSaveEdit = async (id) => {
    const updatedNotes = savedNotes.map(note =>
      note.id === id ? { ...note, text: editText } : note
    );
    setSavedNotes(updatedNotes);
    await saveToFirestore(`savedNotes/${id}`, { text: editText });
    setEditingId(null);
    setEditText('');
  };

    // handleDelete function
    const handleDelete = async (id) => {
        const updatedNotes = savedNotes.filter(note => note.id !== id);
        setSavedNotes(updatedNotes);
        await saveToFirestore(`savedNotes/${id}`, { text: null });  // Assuming null text means deleted
        setShowDisclaimer(false);
        setNoteToDelete(null);
    };

  const handleEdit = (id) => {
    const note = savedNotes.find(note => note.id === id);
    setEditingId(id);
    setEditText(note.text);
  };

  const showDeleteModal = (id) => {
    setShowDisclaimer(true);
    setNoteToDelete(id);
  };

  const cancelDelete = () => {
    setShowDisclaimer(false);
    setNoteToDelete(null);
  };

  return (
    <div className="saved-notes-container">
      <button onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>Home</button>
      <h2>Saved Notes</h2>
      {savedNotes.length === 0 ? (
        <p>No saved notes available.</p>
      ) : (
        <ul className="saved-notes-list">
          {savedNotes.map(note => (
            <li key={note.id} className="saved-note">
              <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                {editingId === note.id ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="4"
                      style={{ width: '100%' }}
                    />
                    <button onClick={() => handleSaveEdit(note.id)} style={{ marginTop: '10px' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ marginTop: '10px', marginLeft: '10px' }}>Cancel</button>
                    <button onClick={() => showDeleteModal(note.id)} style={{ marginTop: '10px', marginLeft: '10px' }}>Delete</button>
                  </>
                ) : (
                  <>
                    <ReactMarkdown>{note.text}</ReactMarkdown>
                    <button onClick={() => handleEdit(note.id)} style={{ marginTop: '10px', marginRight: '10px' }}>Edit</button>
                    
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
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
            <button onClick={() => handleDelete(noteToDelete)} style={{ marginRight: '10px' }}>Yes</button>
            <button onClick={cancelDelete}>No</button>
          </div>
        </div>
      )}
      <button onClick={() => navigate('/notesmaker')} style={{ marginTop: '20px' }}>+</button>
    </div>
    
  );


};

export default SavedNotes;
