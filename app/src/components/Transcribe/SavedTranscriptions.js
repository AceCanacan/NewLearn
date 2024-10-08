import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./savedtranscriptions.css"; // Your custom styles
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { saveToFirestore,removeFromFirestore } from '../../firebase/firebase';


const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [activeTranscription, setActiveTranscription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const navigate = useNavigate();
  const [editTitle, setEditTitle] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const collectionPath = `users/${user.uid}/transcriptions`;
        const collectionRef = collection(db, collectionPath);
        const querySnapshot = await getDocs(collectionRef);
        const savedData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.id - a.id);
        setSavedTranscriptions(savedData);
      }
    };
    fetchData();
  }, []);

  const handleTranscriptionClick = (transcription) => {
    setActiveTranscription(transcription);
    setEditText(transcription.text);
    setEditTitle(transcription.title); // Set the title for editing
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.title}`;
      await saveToFirestore(docPath, {
        ...activeTranscription,
        title: editTitle,
        text: editText,
      });
      setSavedTranscriptions((prev) =>
        prev.map((t) =>
          t.id === activeTranscription.title
            ? { ...t, title: editTitle, text: editText }
            : t
        )
      );
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.title}`;

      try {
        await removeFromFirestore(docPath);
        setSavedTranscriptions((prev) =>
          prev.filter((t) => t.title !== activeTranscription.title)
        );
        setActiveTranscription(null);
      } catch (error) {
        console.error("Error deleting data from Firestore:", error);
      }
    }
  };

  return (
    <div className="deck-container">
      <div className="st-squircle-banner">Convert images and audio to text</div>
      <button className="st-back-button" onClick={() => navigate("/")}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <ul className="deck-list">
        {savedTranscriptions.map((transcription) => (
          <li key={transcription.id} className="deck">
            <div
              className="st-transcription-container"
              onClick={() => handleTranscriptionClick(transcription)}
            >
              <h2 className="st-active-transcription-header">
                {transcription.title}
              </h2>
              <div className="transcription-content">
                <div className="transcription-text-box">
                  <ReactMarkdown className="st-markdown-content">
                    {transcription.text?.length > 300
                      ? transcription.text.substring(0, 300) + "..."
                      : transcription.text || "No content available"}
                  </ReactMarkdown>
                </div>
                <div className="transcription-image-box">
                  <img
                    src={transcription.imageUrl}
                    alt="Transcription Image"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
        <li className="deck">
          <div
            className="deck st-add-card"
            onClick={() => navigate("/transcribe")}
          >
            <span className="st-plus-icon">+</span>
          </div>
        </li>
      </ul>

      {activeTranscription && (
        <div
          className="sn-note-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveTranscription(null);
            }
          }}
        >
          <div className="sn-modal-content">
            {isEditing ? (
              <div style={{ position: "relative" }}>
                <h2
                  className="sn-active-note-header"
                  style={{ visibility: "hidden" }}
                >
                  {activeTranscription.title}
                </h2>
                <input
                  type="text"
                  className="sn-title-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            ) : (
              <h2 className="sn-active-note-header">
                {activeTranscription.title}
              </h2>
            )}
            {isEditing ? (
              <textarea
                className="sn-textarea"
                value={editText}
                rows="20"
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <ReactMarkdown className="st-markdown-content">
                {activeTranscription.text || "No content available"}
              </ReactMarkdown>
            )}
            <div className="sn-button-group">
              {isEditing ? (
                <>
                  <button className="sn-save-button" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="sn-cancel-button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button className="sn-edit-button" onClick={handleEdit}>
                  Edit
                </button>
              )}
              <button className="sn-delete-button" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedTranscriptions;
