// SavedNotes.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { auth, db } from '../../firebase/firebase'; // Ensure db is imported
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Card, 
  Modal, 
  Form, 
  Alert,
} from 'react-bootstrap';
import { BsArrowLeft, BsPlus, BsPencil, BsTrash, BsSave, BsX } from 'react-icons/bs';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const SavedNotes = () => {
  const [savedNotes, setSavedNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotes = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const notesCollection = collection(db, 'users', user.uid, 'savedNotes');
        const notesSnapshot = await getDocs(notesCollection);
        const notesList = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Assuming you have a timestamp field for sorting; adjust as needed
        setSavedNotes(notesList.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Error loading notes:", error);
        setError("Failed to load notes. Please try again later.");
      }
    };

    loadNotes();
  }, []);

  const handleNoteClick = (note) => {
    setActiveNote(note);
    setEditText(note.text);
    setEditTitle(note.title);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeNote && auth.currentUser) {
      const noteRef = doc(db, 'users', auth.currentUser.uid, 'savedNotes', activeNote.id);
      try {
        await updateDoc(noteRef, {
          text: editText,
          title: editTitle,
          // Optionally, update a timestamp
          timestamp: Date.now(),
        });
        setSavedNotes(prev =>
          prev.map(n => n.id === activeNote.id ? { ...n, text: editText, title: editTitle, timestamp: Date.now() } : n)
        );
        setIsEditing(false);
        setActiveNote(null);
      } catch (error) {
        console.error("Error updating note:", error);
        setError("Failed to save changes. Please try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (activeNote && auth.currentUser) {
      const noteRef = doc(db, 'users', auth.currentUser.uid, 'savedNotes', activeNote.id);
      try {
        await deleteDoc(noteRef);
        setSavedNotes(prev => prev.filter(n => n.id !== activeNote.id));
        setActiveNote(null);
      } catch (error) {
        console.error("Error deleting note:", error);
        setError("Failed to delete note. Please try again.");
      }
    }
  };

  const handleClose = () => {
    setActiveNote(null);
    setIsEditing(false);
  };

  return (
    <Container className="my-5">
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="text-center text-success">Saved Notes</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/notesmaker')}>
            <BsPlus className="me-2" /> Add New Note
          </Button>
          <Button variant="outline-secondary" className="ms-2" onClick={() => navigate('/')}>
            <BsArrowLeft className="me-2" /> Back
          </Button>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" onClose={() => setError("")} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Notes Grid */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {savedNotes.length === 0 ? (
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>No Notes Found</Card.Title>
                <Card.Text>
                  You have not saved any notes yet. Click the button above to create one.
                </Card.Text>
                <Button variant="primary" onClick={() => navigate('/notesmaker')}>
                  <BsPlus className="me-2" /> Create Note
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          savedNotes.map(note => (
            <Col key={note.id}>
              <Card
                className="h-100 shadow-sm hover-shadow"
                onClick={() => handleNoteClick(note)}
                style={{ cursor: "pointer" }}
              >
                <Card.Body>
                  <Card.Title>{note.title || "Untitled Note"}</Card.Title>
                  <Card.Text>
                    <ReactMarkdown>
                      {note.text?.length > 100
                        ? `${note.text.substring(0, 100)}...`
                        : note.text || "No content available"}
                    </ReactMarkdown>
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="text-muted">
                  {note.timestamp && (
                    <small>
                      Last updated: {new Date(note.timestamp).toLocaleDateString()}
                    </small>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Note Detail Modal */}
      <Modal show={activeNote !== null} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          {isEditing ? (
            <Form.Control 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              placeholder="Enter title" 
              className="fs-5"
            />
          ) : (
            <Modal.Title>{activeNote?.title || "Untitled Note"}</Modal.Title>
          )}
        </Modal.Header>
        <Modal.Body>
          {isEditing ? (
            <Form>
              <Form.Group className="mb-3" controlId="editNoteText">
                <Form.Label>Note Text</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={10} 
                  value={editText} 
                  onChange={(e) => setEditText(e.target.value)} 
                  placeholder="Edit your note here..."
                />
              </Form.Group>
            </Form>
          ) : (
            <ReactMarkdown className="note-content">
              {activeNote?.text || "No content available"}
            </ReactMarkdown>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditing ? (
            <>
              <Button variant="success" onClick={handleSave}>
                <BsSave className="me-2" /> Save
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <BsX className="me-2" /> Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={handleEdit}>
                <BsPencil className="me-2" /> Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <BsTrash className="me-2" /> Delete
              </Button>
              <Button variant="outline-secondary" onClick={handleClose}>
                <BsArrowLeft className="me-2" /> Close
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );  
};

export default SavedNotes;
