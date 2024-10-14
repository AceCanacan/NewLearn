// File: src/components/Quiz_ai/FlashcardInput/FlashcardInput.js

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

// Maximum number of flashcards allowed
const MAX_FLASHCARDS = 50;

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
          const fetchedDeck = {
            flashcards: deckDoc.data().flashcards || [],
            description: deckDoc.data().description || "No description available",
            totalFlashcardsCreated: deckDoc.data().totalFlashcardsCreated || 0,
          };

          // **Added: Parse multiple-choice flashcards if options are embedded**
          const parsedFlashcards = fetchedDeck.flashcards.map((fc) => {
            if (fc.type === "multiple_choice" && (!fc.options || fc.correctOptionIndex === undefined)) {
              const { question, answer } = fc;
              // Example format:
              // Q1. What is the official name of Davao City in Cebuano?
              // A. Dakbayan sa Dabaw
              // B. Lungsod ng Dabaw
              // C. Dakbanwa sang Davao
              // D. Davao del Sur City
              // Correct Answer: A

              const lines = question.split('\n').filter(line => line.trim() !== '');
              let parsedQuestion = "";
              const options = [];
              let correctOptionIndex = -1;

              lines.forEach(line => {
                const optionMatch = line.match(/^([A-D])\.\s*(.+)$/);
                if (optionMatch) {
                  const optionLetter = optionMatch[1];
                  const optionText = optionMatch[2];
                  options.push(optionText);
                  if (optionLetter.toUpperCase() === answer) {
                    correctOptionIndex = optionMatch[1].charCodeAt(0) - 65; // 'A' -> 0
                  }
                } else {
                  // Assume the first non-option line is the question
                  if (!parsedQuestion) {
                    parsedQuestion = line.replace(/^Q\d+\.\s*/, '').trim();
                  }
                }
              });

              return {
                ...fc,
                question: parsedQuestion,
                options: options.length === 4 ? options : ["", "", "", ""],
                correctOptionIndex: correctOptionIndex !== -1 ? correctOptionIndex : 0,
              };
            }
            return fc;
          });

          setDeck({
            flashcards: parsedFlashcards,
            description: fetchedDeck.description,
            totalFlashcardsCreated: fetchedDeck.totalFlashcardsCreated,
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
const FlashcardForm = ({ flashcard, index, onChange }) => {
  return (
    <>
      {/* Question Type Selection */}
      <Form.Group controlId={`type-${index}`} className="mb-3">
        <Form.Label>Question Type</Form.Label>
        <Form.Select
          value={flashcard.type || "flashcard"}
          onChange={(e) => onChange(index, "type", e.target.value)}
        >
          <option value="flashcard">Flashcard</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True or False</option>
          <option value="identification">Identification</option>
        </Form.Select>
      </Form.Group>

      {/* Question Input */}
      <Form.Group controlId={`question-${index}`} className="mb-3">
        <Form.Label>Question</Form.Label>
        <Form.Control
          type="text"
          value={flashcard.question}
          onChange={(e) => onChange(index, "question", e.target.value)}
          placeholder="Enter question"
        />
      </Form.Group>

      {/* Conditional Rendering Based on Question Type */}
      {flashcard.type === "flashcard" && (
        <Form.Group controlId={`answer-${index}`} className="mb-3">
          <Form.Label>Answer</Form.Label>
          <Form.Control
            type="text"
            value={flashcard.answer}
            onChange={(e) => onChange(index, "answer", e.target.value)}
            placeholder="Enter answer"
          />
        </Form.Group>
      )}

      {flashcard.type === "multiple_choice" && (
        <>
          {/* Options for Multiple Choice */}
          {[0, 1, 2, 3].map((opt, optIndex) => (
            <Form.Group controlId={`option-${index}-${opt}`} className="mb-3" key={optIndex}>
              <Form.Label>Option {String.fromCharCode(65 + opt)}</Form.Label>
              <Form.Control
                type="text"
                value={flashcard.options ? flashcard.options[optIndex] : ""}
                onChange={(e) => {
                  const newOptions = flashcard.options ? [...flashcard.options] : ["", "", "", ""];
                  newOptions[optIndex] = e.target.value;
                  onChange(index, "options", newOptions);
                }}
                placeholder={`Enter option ${String.fromCharCode(65 + opt)}`}
              />
            </Form.Group>
          ))}

          {/* Correct Option Selection */}
          <Form.Group controlId={`correctOption-${index}`} className="mb-3">
            <Form.Label>Correct Option</Form.Label>
            <Form.Select
              value={flashcard.correctOptionIndex !== undefined ? flashcard.correctOptionIndex : ""}
              onChange={(e) => onChange(index, "correctOptionIndex", parseInt(e.target.value))}
            >
              <option value="">Select correct option</option>
              {[0, 1, 2, 3].map((opt, idx) => (
                <option key={idx} value={opt}>
                  {String.fromCharCode(65 + opt)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </>
      )}

      {flashcard.type === "true_false" && (
        <Form.Group controlId={`trueFalse-${index}`} className="mb-3">
          <Form.Label>Correct Answer</Form.Label>
          <div>
            <Form.Check
              inline
              label="True"
              type="radio"
              id={`tf-true-${index}`}
              name={`tf-${index}`}
              value={true}
              checked={flashcard.answer === true}
              onChange={() => onChange(index, "answer", true)}
            />
            <Form.Check
              inline
              label="False"
              type="radio"
              id={`tf-false-${index}`}
              name={`tf-${index}`}
              value={false}
              checked={flashcard.answer === false}
              onChange={() => onChange(index, "answer", false)}
            />
          </div>
        </Form.Group>
      )}

      {flashcard.type === "identification" && (
        <Form.Group controlId={`identification-${index}`} className="mb-3">
          <Form.Label>Answer</Form.Label>
          <Form.Control
            type="text"
            value={flashcard.answer}
            onChange={(e) => onChange(index, "answer", e.target.value)}
            placeholder="Enter answer"
          />
        </Form.Group>
      )}
    </>
  );
};

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
      await setDoc(
        deckDocRef,
        {
          flashcards: deck.flashcards,
          description: deck.description,
          totalFlashcardsCreated: deck.totalFlashcardsCreated,
        },
        { merge: true }
      );
    }
  };

  useEffect(() => {
    updateFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  // Navigation to Test Yourself
  const handleTestYourself = async () => {
    navigate(`/test/${deckName}`);
  };

  // Save Deck Information
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

  // Add a New Flashcard
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
      flashcards: [
        ...deck.flashcards,
        { type: "flashcard", question: "", answer: "" },
      ],
      totalFlashcardsCreated: deck.totalFlashcardsCreated + 1,
    });
    setEditingFlashcardIndex(deck.flashcards.length);
    setShowAddFlashcardModal(true);
  };

  // Delete a Flashcard
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

  // Delete the Entire Deck
  const handleDeleteDeck = async () => {
    if (user) {
      await deleteDoc(doc(db, "users", user.uid, "decks", deckName));
      navigate("/deck/home");
    }
  };

  // Handle Changes in Flashcard Fields
  const handleFlashcardChange = (index, field, value) => {
    const updatedFlashcards = deck.flashcards.map((fc, i) => {
      if (i === index) {
        const updatedFlashcard = { ...fc };
        if (field === "options") {
          updatedFlashcard.options = value;
        } else if (field === "correctOptionIndex") {
          updatedFlashcard.correctOptionIndex = value;
        } else {
          updatedFlashcard[field] = value;
        }
        return updatedFlashcard;
      }
      return fc;
    });
    setDeck({ ...deck, flashcards: updatedFlashcards });
  };

  // Helper Function to Format Question Type (Enhanced)
  const formatQuestionType = (type) => {
    switch (type) {
      case "flashcard":
        return "Flashcard";
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True or False";
      case "identification":
        return "Identification";
      default:
        return "Flashcard";
    }
  };

  // Helper Function to Render Flashcard Answers Based on Type (Enhanced)
  const renderAnswer = (flashcard) => {
    switch (flashcard.type) {
      case "flashcard":
      case "identification":
        return <p><strong>A:</strong> {flashcard.answer || "No answer provided."}</p>;
      case "multiple_choice":
        return (
          <>
            <p><strong>Options:</strong></p>
            <ul>
              {flashcard.options && flashcard.options.map((opt, idx) => (
                <li key={idx}>
                  {String.fromCharCode(65 + idx)}. {opt} {flashcard.correctOptionIndex === idx && <strong>(Correct)</strong>}
                </li>
              ))}
            </ul>
          </>
        );
      case "true_false":
        return <p><strong>A:</strong> {flashcard.answer !== undefined ? (flashcard.answer ? "True" : "False") : "No answer provided."}</p>;
      default:
        return <p><strong>A:</strong> {flashcard.answer || "No answer provided."}</p>;
    }
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
          {deck.flashcards.length === 0 ? (
            <p>No flashcards added yet. Click "Add Flashcard" to get started.</p>
          ) : (
            <ListGroup>
              {deck.flashcards.map((flashcard, index) => (
                <ListGroup.Item key={index}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h5>Question {index + 1}</h5>
                      <p>{flashcard.question || "No question provided."}</p>
                      {renderAnswer(flashcard)}
                    </div>
                    <div className="ms-3">
                      <Button
                        variant={editingFlashcardIndex === index ? "success" : "outline-primary"}
                        className="me-2 mb-2"
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
                        className="mb-2"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                  {/* Inline Editing */}
                  {editingFlashcardIndex === index && (
                    <Card className="mt-3">
                      <Card.Body>
                        <FlashcardForm
                          flashcard={flashcard}
                          index={index}
                          onChange={handleFlashcardChange}
                        />
                        <div className="d-flex justify-content-end">
                          <Button
                            variant="secondary"
                            onClick={() => setEditingFlashcardIndex(null)}
                            className="me-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => setEditingFlashcardIndex(null)}
                          >
                            Save
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
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
            flashcard={deck.flashcards[editingFlashcardIndex] || { type: "flashcard", question: "", answer: "" }}
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

// Export the Component
export default FlashcardInput;
