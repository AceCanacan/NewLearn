import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";
import {
  Button,
  ListGroup,
  Card,
  Form,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";

import {
  saveToFirestore,
  loadFromFirestore,
  removeFromFirestore,
} from "../../../firebase/firebase";

const MAX_FLASHCARDS = 10;

// Custom Hook for Authentication and Deck Data
const useDeckData = (deckName) => {
  const [user, setUser] = useState(null);
  const [deck, setDeck] = useState({
    flashcards: [],
    description: "No description available",
    totalFlashcardsCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const deckDocRef = doc(db, "users", currentUser.uid, "decks", deckName);
        const deckDoc = await getDoc(deckDocRef);
        if (deckDoc.exists()) {
          setDeck({
            flashcards: deckDoc.data().flashcards || [],
            description: deckDoc.data().description || "No description available",
            totalFlashcardsCreated: deckDoc.data().totalFlashcardsCreated || 0,
          });
        } else {
          await setDoc(deckDocRef, { totalFlashcardsCreated: 0 }, { merge: true });
        }
      } else {
        setUser(null);
        setDeck({
          flashcards: [],
          description: "No description available",
          totalFlashcardsCreated: 0,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deckName]);

  return { user, deck, setDeck, loading };
};

// Flashcard Form Component
const FlashcardForm = ({ flashcard, index, onChange }) => (
  <>
    <Form.Group controlId={`question-${index}`}>
      <Form.Label>Question</Form.Label>
      <Form.Control
        type="text"
        value={flashcard.question}
        onChange={(e) => onChange(index, "question", e.target.value)}
        placeholder="Enter question"
      />
    </Form.Group>
    <Form.Group controlId={`answer-${index}`}>
      <Form.Label>Answer</Form.Label>
      <Form.Control
        type="text"
        value={flashcard.answer}
        onChange={(e) => onChange(index, "answer", e.target.value)}
        placeholder="Enter answer"
      />
    </Form.Group>
  </>
);

// Main Component
const FlashcardInput = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const { user, deck, setDeck, loading } = useDeckData(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [newDeckDescription, setNewDeckDescription] = useState(deck.description);
  const [editingFlashcardIndex, setEditingFlashcardIndex] = useState(null);
  const [showDeleteDeckModal, setShowDeleteDeckModal] = useState(false);
  const [showAddFlashcardModal, setShowAddFlashcardModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });

  // Update Firestore when deck changes
  const updateFirestore = async () => {
    if (user) {
      const deckDocRef = doc(db, "users", user.uid, "decks", deckName);
      await setDoc(deckDocRef, {
        flashcards: deck.flashcards,
        description: deck.description,
        totalFlashcardsCreated: deck.totalFlashcardsCreated,
      }, { merge: true });
    }
  };

  useEffect(() => {
    updateFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  const handleTestYourself = async () => {
    await saveToFirestore(`settings/${deckName}-shuffled`, {
      shuffled: deck.flashcards,
    });
    await saveToFirestore(`settings/${deckName}-currentIndex`, {
      currentIndex: 0,
    });
    navigate(`/test/${deckName}`);
  };

  const handleSaveDeck = async () => {
    if (user) {
      const deckDocRef = doc(db, "users", user.uid, "decks", newDeckName);
      await updateDoc(deckDocRef, {
        name: newDeckName,
        description: newDeckDescription,
      });
      setIsEditingDeck(false);
      setAlert({ show: true, variant: "success", message: "Deck updated successfully!" });
    }
  };

  const handleAddFlashcard = () => {
    if (deck.totalFlashcardsCreated >= MAX_FLASHCARDS) {
      setAlert({
        show: true,
        variant: "warning",
        message: `Maximum of ${MAX_FLASHCARDS} flashcards reached.`,
      });
      return;
    }
    setDeck({
      ...deck,
      flashcards: [...deck.flashcards, { question: "", answer: "" }],
      totalFlashcardsCreated: deck.totalFlashcardsCreated + 1,
    });
    setEditingFlashcardIndex(deck.flashcards.length);
    setShowAddFlashcardModal(true);
  };

  const handleDeleteFlashcard = async (index) => {
    if (user && window.confirm("Are you sure you want to delete this flashcard?")) {
      const updatedFlashcards = deck.flashcards.filter((_, i) => i !== index);
      setDeck({
        ...deck,
        flashcards: updatedFlashcards,
        totalFlashcardsCreated: deck.totalFlashcardsCreated - 1,
      });
      setAlert({ show: true, variant: "danger", message: "Flashcard deleted." });
    }
  };

  const handleDeleteDeck = async () => {
    if (user) {
      await deleteDoc(doc(db, "users", user.uid, "decks", deckName));
      navigate("/deck/home");
    }
  };

  const handleFlashcardChange = (index, field, value) => {
    const updatedFlashcards = deck.flashcards.map((fc, i) =>
      i === index ? { ...fc, [field]: value } : fc
    );
    setDeck({ ...deck, flashcards: updatedFlashcards });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container my-4">
      {/* Back Button */}
      <Button
        variant="outline-secondary"
        className="mb-3"
        onClick={() => navigate("/deck/home")}
      >
        <i className="fas fa-arrow-left"></i> Back
      </Button>

      {/* Alert */}
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}

      {/* Deck Information */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          {isEditingDeck ? (
            <Form>
              <Form.Group controlId="deckName">
                <Form.Label>Deck Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Enter deck name"
                />
              </Form.Group>
              <Form.Group controlId="deckDescription" className="mt-2">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  placeholder="Enter deck description"
                />
              </Form.Group>
            </Form>
          ) : (
            <div>
              <h3>{deckName}</h3>
              <p>{deck.description}</p>
            </div>
          )}
          <div>
            {isEditingDeck && (
              <Button
                variant="danger"
                className="me-2"
                onClick={() => setShowDeleteDeckModal(true)}
              >
                <i className="fas fa-trash"></i>
              </Button>
            )}
            <Button
              variant={isEditingDeck ? "success" : "outline-primary"}
              onClick={() => {
                if (isEditingDeck) {
                  handleSaveDeck();
                } else {
                  setIsEditingDeck(true);
                }
              }}
            >
              <i className={`fas ${isEditingDeck ? "fa-check" : "fa-pen"}`}></i>
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mb-4 flex-wrap">
            <Link to={`/test/${deckName}`} className="mb-2 flex-fill mx-1">
              <Button variant="secondary" onClick={handleTestYourself}>
                Test
              </Button>
            </Link>

            <Link to={`/score-report/${deckName}`} className="mb-2 flex-fill mx-1">
              <Button variant="secondary">View Scores</Button>
            </Link>
            <Link
              to={`/quizmaker/${deckName}`}
              onClick={(e) => {
                if (localStorage.getItem(`${deckName}-generated`) === "true") {
                  e.preventDefault();
                  setAlert({
                    show: true,
                    variant: "warning",
                    message: "You have already used the QuizMaker feature for this deck.",
                  });
                }
              }}
              className="mb-2 flex-fill mx-1"
            >
              <Button variant="secondary">Quiz Maker</Button>
            </Link>
          </div>
          <hr />

          {/* Add Flashcard Button */}
          <Button
            variant="success"
            className="mb-3"
            onClick={handleAddFlashcard}
          >
            + Add Flashcard
          </Button>

          {/* Flashcards List */}
          <ListGroup>
            {deck.flashcards.map((flashcard, index) => (
              <ListGroup.Item key={index}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5>Question {index + 1}</h5>
                    {editingFlashcardIndex === index ? (
                      <FlashcardForm
                        flashcard={flashcard}
                        index={index}
                        onChange={handleFlashcardChange}
                      />
                    ) : (
                      <>
                        <p>
                          <strong>Q:</strong> {flashcard.question || "No question provided."}
                        </p>
                        <p>
                          <strong>A:</strong> {flashcard.answer || "No answer provided."}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <Button
                      variant={editingFlashcardIndex === index ? "success" : "outline-primary"}
                      className="me-2"
                      onClick={() => {
                        if (editingFlashcardIndex === index) {
                          setEditingFlashcardIndex(null);
                        } else {
                          setEditingFlashcardIndex(index);
                        }
                      }}
                    >
                      <i className={`fas ${editingFlashcardIndex === index ? "fa-check" : "fa-pen"}`}></i>
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteFlashcard(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Delete Deck Modal */}
      <Modal show={showDeleteDeckModal} onHide={() => setShowDeleteDeckModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Deck</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the deck "{deckName}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteDeckModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => { handleDeleteDeck(); setShowDeleteDeckModal(false); }}>
            Delete Deck
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Flashcard Modal */}
      <Modal show={showAddFlashcardModal} onHide={() => setShowAddFlashcardModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Flashcard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FlashcardForm
            flashcard={deck.flashcards[editingFlashcardIndex] || { question: "", answer: "" }}
            index={editingFlashcardIndex}
            onChange={handleFlashcardChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddFlashcardModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowAddFlashcardModal(false)}>
            Save Flashcard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FlashcardInput;
