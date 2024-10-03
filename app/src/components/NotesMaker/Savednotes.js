import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './savednotes.css'; // Import the custom styles
import { auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

import { saveToFirestore, loadFromFirestore, removeFromFirestore } from '../../firebase/firebase';

const SavedNotes = () => {
  const [savedNotes, setSavedNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
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
      
      try {
        await removeFromFirestore(docPath); // Use the removeFromFirestore function to delete the document
        setSavedNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
        handleClose();
      } catch (error) {
        console.error("Error deleting data from Firestore:", error);
      }
    }
  };
  const handleClose = () => {
    setActiveNote(null);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="sn-squircle-banner">Saved Notes</div>
      <button className="sn-back-button" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className="sn-container">
        <ul className="sn-notes-list">
          {savedNotes.map(note => (
            <li key={note.id} className="sn-note-item">
              <div className="sn-note-container" onClick={() => handleNoteClick(note)}>
                <div className="sn-note-header">{note.title}</div>
                <div className="sn-note-content">
                  <ReactMarkdown className="sn-markdown-content">
                    {note.text?.length > 300 
                      ? note.text.substring(0, 300) + "..." 
                      : note.text || "No content available"}
                  </ReactMarkdown>
                </div>
              </div>
            </li>
          ))}
          <li className="sn-note-item">
            <div className="sn-note-container sn-add-card" onClick={() => navigate('/notesmaker')}>
              <span className="sn-plus-icon">+</span>
            </div>
          </li>
        </ul>
  
        {activeNote && (
          <div className="sn-note-modal" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveNote(null);
            }
          }}>
            <div className="sn-modal-content">
              {isEditing ? (
                <div style={{ position: 'relative' }}>
                  <h2 className="sn-active-note-header" style={{ visibility: 'hidden' }}>
                    {activeNote.title}
                  </h2>
                  <input 
                    type="text" 
                    className="sn-title-input" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                </div>
              ) : (
                <h2 className="sn-active-note-header">{activeNote.title}</h2>
              )}
{isEditing ? (
  <textarea
    className="sn-textarea"
    value={editText}
    rows="20"
    onChange={(e) => setEditText(e.target.value)}
  />
) : (
  <ReactMarkdown className="sn-markdown-content">
    {activeNote.text || "No content available"}
  </ReactMarkdown>
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
      </div>
    </div>
  );  
};

export default SavedNotes;
