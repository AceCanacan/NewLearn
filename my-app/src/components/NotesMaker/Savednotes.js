import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './savednotes.css'; // Import the custom styles
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const loadFromFirestore = async (collectionPath, defaultValue) => {
  try {
    const user = auth.currentUser;
    if (!user) return defaultValue;
    const collectionRef = collection(db, ...collectionPath.split('/'));
    const querySnapshot = await getDocs(collectionRef);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.length ? data : defaultValue;
  } catch (error) {
    console.error("Error loading data from Firestore:", error);
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = doc(db, ...docPath.split('/'));
    await setDoc(docRef, value, { merge: true });
  } catch (error) {
    console.error("Error saving data to Firestore:", error);
  }
};

const SavedNotes = () => {
  const [savedNotes, setSavedNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotes = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const notes = (await loadFromFirestore(`users/${user.uid}/savedNotes`, [])).sort((a, b) => b.id - a.id);
      setSavedNotes(notes);
    };
    loadNotes();
  }, []);

  const handleNoteClick = (note) => {
    setActiveNote(note);
    setEditText(note.text);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeNote && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/savedNotes/${activeNote.id}`;
      await saveToFirestore(docPath, { ...activeNote, text: editText });
      setSavedNotes((prev) =>
        prev.map((n) => (n.id === activeNote.id ? { ...n, text: editText } : n))
      );
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (activeNote && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/savedNotes/${activeNote.id}`;
      await saveToFirestore(docPath, { text: null });
      setSavedNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
      handleClose();
    }
  };

  const handleClose = () => {
    setActiveNote(null);
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="sn-title">Saved Notes</h2>
      {savedNotes.length === 0 ? (
        <p className="sn-no-notes">No notes saved yet.</p>
      ) : (
        <ul className="sn-notes-list">
          {savedNotes.map(note => (
            <li key={note.id} className="sn-note-item">
              <div className="sn-note-container" onClick={() => handleNoteClick(note)}>
                <ReactMarkdown className="sn-markdown-content">
                  {note.text.length > 100 
                    ? note.text.substring(0, 100) + "..." 
                    : note.text}
                </ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}
      {activeNote && (
        <div className="sn-note-modal">
          <div className="sn-modal-content">
            <button className="sn-close-button" onClick={handleClose}>X</button>
            <h2>{activeNote.title}</h2>
            {isEditing ? (
              <textarea
                className="sn-textarea"
                value={editText}
                rows="20"
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <textarea
                className="sn-textarea"
                value={activeNote.text}
                rows="20"
                readOnly
              />
            )}
            <div className="sn-button-group">
              {isEditing ? (
                <>
                  <button className="sn-save-button" onClick={handleSave}>Save</button>
                  <button className="sn-cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              ) : (
                <button className="sn-edit-button" onClick={handleEdit}>Edit</button>
              )}
              <button className="sn-delete-button" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <button className="sn-add-button" onClick={() => navigate('/notesmaker')}>+</button>
    </div>
  );

};

export default SavedNotes;
