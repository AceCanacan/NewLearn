import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './transcribe.css';  // Ensure your CSS file includes styles for modal-overlay and modal-content
import { useNavigate } from 'react-router-dom';

const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [transcriptionToDelete, setTranscriptionToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedTranscriptions = localStorage.getItem('savedTranscriptions');
    if (storedTranscriptions) {
      const parsedTranscriptions = JSON.parse(storedTranscriptions);
      setSavedTranscriptions(parsedTranscriptions);
    }
  }, []);
  
  const handleEdit = (id) => {
    const transcription = savedTranscriptions.find(t => t.id === id);
    setEditingId(id);
    setEditText(transcription.text);
  };

  const handleSaveEdit = (id) => {
    const updatedTranscriptions = savedTranscriptions.map(transcription =>
      transcription.id === id ? { ...transcription, text: editText } : transcription
    );
    setSavedTranscriptions(updatedTranscriptions);
    localStorage.setItem('savedTranscriptions', JSON.stringify(updatedTranscriptions));
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id) => {
    const updatedTranscriptions = savedTranscriptions.filter(t => t.id !== id);
    setSavedTranscriptions(updatedTranscriptions);
    localStorage.setItem('savedTranscriptions', JSON.stringify(updatedTranscriptions));
    setShowDisclaimer(false);
    setTranscriptionToDelete(null);
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
      <button onClick={() => navigate('/transcribe')} style={{ marginBottom: '10px' }}>Back to Transcribe</button>
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
    </div>
  );
};

export default SavedTranscriptions;