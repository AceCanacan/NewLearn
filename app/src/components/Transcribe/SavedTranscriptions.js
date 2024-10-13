// SavedTranscriptions.js
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { saveToFirestore, removeFromFirestore } from '../../firebase/firebase';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Image,
  Badge,
  Alert,
} from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const SavedTranscriptions = () => {
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [activeTranscription, setActiveTranscription] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const collectionPath = `users/${user.uid}/transcriptions`;
          const collectionRef = collection(db, collectionPath);
          const querySnapshot = await getDocs(collectionRef);
          const savedData = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => b.id - a.id);
          setSavedTranscriptions(savedData);
        } catch (err) {
          console.error("Error fetching transcriptions:", err);
          setError("Failed to load transcriptions. Please try again later.");
        }
      }
    };
    fetchData();
  }, []);

  const handleTranscriptionClick = (transcription) => {
    setActiveTranscription(transcription);
    setEditText(transcription.text);
    setEditTitle(transcription.title);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      try {
        await saveToFirestore(docPath, {
          ...activeTranscription,
          title: editTitle,
          text: editText,
        });
        setSavedTranscriptions((prev) =>
          prev.map((t) =>
            t.id === activeTranscription.id
              ? { ...t, title: editTitle, text: editText }
              : t
          )
        );
        setIsEditing(false);
        setActiveTranscription(null);
      } catch (err) {
        console.error("Error saving transcription:", err);
        setError("Failed to save transcription. Please try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (activeTranscription && auth.currentUser) {
      const docPath = `users/${auth.currentUser.uid}/transcriptions/${activeTranscription.id}`;
      try {
        await removeFromFirestore(docPath);
        setSavedTranscriptions((prev) =>
          prev.filter((t) => t.id !== activeTranscription.id)
        );
        setActiveTranscription(null);
      } catch (err) {
        console.error("Error deleting transcription:", err);
        setError("Failed to delete transcription. Please try again.");
      }
    }
  };

  return (
    <Container className="my-5">
      {/* Header Section */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="text-center text-primary">Saved Transcriptions</h1>
        </Col>
        <Col className="text-end">
          <Button variant="success" onClick={() => navigate("/transcribe")}>
            <FaPlus className="me-2" /> New Transcription
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

      {/* Transcriptions Grid */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {savedTranscriptions.length === 0 ? (
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>No Transcriptions Found</Card.Title>
                <Card.Text>
                  You have not saved any transcriptions yet. Click the button above to create one.
                </Card.Text>
                <Button variant="primary" onClick={() => navigate("/transcribe")}>
                  <FaPlus className="me-2" /> Create Transcription
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          savedTranscriptions.map((transcription) => (
            <Col key={transcription.id}>
              <Card
                className="h-100 shadow-sm hover-shadow"
                onClick={() => handleTranscriptionClick(transcription)}
                style={{ cursor: "pointer" }}
              >
                {transcription.imageUrl ? (
                  <Card.Img 
                    variant="top" 
                    src={transcription.imageUrl} 
                    alt="Transcription" 
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <Card.Img 
                    variant="top" 
                    src="https://via.placeholder.com/400x200?text=No+Image" 
                    alt="No Image" 
                    style={{ height: '200px', objectFit: 'cover', filter: 'grayscale(100%)' }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{transcription.title || "Untitled Transcription"}</Card.Title>
                  <Card.Text>
                    <ReactMarkdown>
                      {transcription.text.length > 100
                        ? `${transcription.text.substring(0, 100)}...`
                        : transcription.text || "No content available"}
                    </ReactMarkdown>
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="text-muted">
                  {transcription.imageUrl ? (
                    <Badge bg="info">Image Attached</Badge>
                  ) : (
                    <Badge bg="secondary">No Image</Badge>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Transcription Detail Modal */}
      <Modal
        show={activeTranscription !== null}
        onHide={() => setActiveTranscription(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          {isEditing ? (
            <Form.Control
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Edit Title"
              className="fs-5"
            />
          ) : (
            <Modal.Title>{activeTranscription?.title || "Untitled Transcription"}</Modal.Title>
          )}
        </Modal.Header>
        <Modal.Body>
          {isEditing ? (
            <Form>
              <Form.Group className="mb-3" controlId="editTranscriptionText">
                <Form.Label>Transcription Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={10}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Edit your transcription here..."
                />
              </Form.Group>
            </Form>
          ) : (
            <>
              {activeTranscription?.imageUrl && (
                <Image
                  src={activeTranscription.imageUrl}
                  alt="Transcription"
                  fluid
                  className="mb-3 rounded"
                />
              )}
              <ReactMarkdown className="transcription-content">
                {activeTranscription?.text || "No content available"}
              </ReactMarkdown>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditing ? (
            <>
              <Button variant="success" onClick={handleSave}>
                <FaSave className="me-2" /> Save
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <FaTimes className="me-2" /> Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={handleEdit}>
                <FaEdit className="me-2" /> Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <FaTrash className="me-2" /> Delete
              </Button>
              <Button variant="outline-secondary" onClick={() => setActiveTranscription(null)}>
                Close
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SavedTranscriptions;
