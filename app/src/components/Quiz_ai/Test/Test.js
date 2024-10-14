// File: src/components/Quiz_ai/Test/Test.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";
import TestResults from "./TestResults"; // Ensure this component is properly implemented
import {
  Button,
  Card,
  Modal,
  Spinner,
  Tooltip,
  OverlayTrigger,
  Form,
  Alert,
} from "react-bootstrap";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();

  // State Variables
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]); // Stores user's answers
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });

  // User's selected options for different question types
  const [selectedOption, setSelectedOption] = useState(null); // For Multiple Choice and True/False
  const [identificationAnswer, setIdentificationAnswer] = useState(""); // For Identification

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAlert({
          show: true,
          variant: "warning",
          message: "You must be signed in to take the test.",
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Generate a unique session storage key
  const getSessionKey = () => {
    return `testProgress-${user?.uid}-${deckName}`;
  };

  // Fetch flashcards from Firestore
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const deckDocRef = doc(db, "users", user.uid, "decks", deckName);
        const deckDoc = await getDoc(deckDocRef);
        if (deckDoc.exists()) {
          const fetchedFlashcards = deckDoc.data().flashcards;
          if (Array.isArray(fetchedFlashcards)) {
            setFlashcards(fetchedFlashcards);
          } else {
            console.warn("Fetched flashcards is not an array. Defaulting to empty array.");
            setFlashcards([]);
          }
        } else {
          setAlert({
            show: true,
            variant: "danger",
            message: "Deck does not exist.",
          });
          setFlashcards([]);
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setAlert({
          show: true,
          variant: "danger",
          message: "Failed to load flashcards. Please try again.",
        });
        setFlashcards([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlashcards();
  }, [user, deckName]);

  // Load progress from sessionStorage
  useEffect(() => {
    if (!user) return;

    const sessionData = sessionStorage.getItem(getSessionKey());
    if (sessionData) {
      try {
        const parsedData = JSON.parse(sessionData);
        const validCardIndex =
          typeof parsedData.currentCardIndex === "number" &&
          parsedData.currentCardIndex >= 0 &&
          parsedData.currentCardIndex < flashcards.length
            ? parsedData.currentCardIndex
            : 0;
        setCurrentCardIndex(validCardIndex);
        setUserAnswers(Array.isArray(parsedData.userAnswers) ? parsedData.userAnswers : []);
      } catch (error) {
        console.error("Error parsing session data:", error);
        setCurrentCardIndex(0);
        setUserAnswers([]);
      }
    }
  }, [user, deckName, flashcards.length]);

  // Save progress to sessionStorage whenever relevant states change
  useEffect(() => {
    if (!user) return;

    const sessionData = {
      currentCardIndex,
      userAnswers,
    };
    sessionStorage.setItem(getSessionKey(), JSON.stringify(sessionData));
  }, [currentCardIndex, userAnswers, user, deckName]);

  // Determine current flashcard
  const currentFlashcard = useMemo(() => {
    return flashcards.length > 0 && currentCardIndex < flashcards.length
      ? flashcards[currentCardIndex]
      : null;
  }, [flashcards, currentCardIndex]);

  // Helper to get current question type
  const currentQuestionType = useCallback(() => {
    if (flashcards.length === 0) return "flashcard";
    return flashcards[currentCardIndex]?.type || "flashcard";
  }, [flashcards, currentCardIndex]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e) => {
      if (finished) return;

      switch (e.key) {
        case "ArrowRight":
          handleNextCard();
          break;
        case "ArrowLeft":
          handlePreviousCard();
          break;
        case " ":
          e.preventDefault(); // Prevent page scrolling
          handleFlipCard();
          break;
        default:
          break;
      }
    },
    [finished]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handlers for navigation
  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex < flashcards.length - 1 ? prevIndex + 1 : prevIndex
    );
    setShowAnswer(false);
    resetSelections();
  };

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
    setShowAnswer(false);
    resetSelections();
  };

  const handleFlipCard = () => {
    setShowAnswer((prev) => !prev);
  };

  // Handler for submitting answers (Multiple Choice, True/False, Identification)
  const submitAnswer = (answer) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentCardIndex] = answer;
      return newAnswers;
    });
    handleNextCard();
  };

  // Reset selection states when moving to a new card
  const resetSelections = () => {
    setSelectedOption(null);
    setIdentificationAnswer("");
  };

  // Handler for finishing the test
  const handleFinish = async () => {
    setIsLoading(true);
    setFinished(true);

    // Calculate scores
    const calculatedScore = {
      flashcard: { correct: 0, wrong: 0 },
      multiple_choice: { correct: 0, wrong: 0 },
      true_false: { correct: 0, wrong: 0 },
      identification: { correct: 0, wrong: 0 },
    };

    flashcards.forEach((card, index) => {
      const userAnswer = userAnswers[index];
      const type = card.type;

      if (type === "flashcard") {
        // For flashcards, you can define your own scoring logic
        // For example, consider all flashcards as 'reviewed' without correctness
        // Here, we'll skip scoring for flashcards
      } else if (type === "multiple_choice") {
        if (userAnswer === card.correctOptionIndex) {
          calculatedScore[type].correct += 1;
        } else {
          calculatedScore[type].wrong += 1;
        }
      } else if (type === "true_false") {
        if (userAnswer === card.answer) {
          calculatedScore[type].correct += 1;
        } else {
          calculatedScore[type].wrong += 1;
        }
      } else if (type === "identification") {
        if (
          card.answer.trim().toLowerCase() === userAnswer?.trim().toLowerCase()
        ) {
          calculatedScore[type].correct += 1;
        } else {
          calculatedScore[type].wrong += 1;
        }
      }
    });

    // Save results to Firestore
    if (user) {
      const scoreEntry = {
        date: new Date().toISOString(),
        score: calculatedScore,
        testResult: {
          userAnswers,
          flashcards,
          deckName,
        },
      };

      try {
        const scoresDocRef = doc(db, "users", user.uid, "settings", "scores");
        const scoresDoc = await getDoc(scoresDocRef);
        let updatedScores = {};

        if (scoresDoc.exists()) {
          updatedScores = scoresDoc.data();
        }

        const deckScores = updatedScores[deckName] || [];
        deckScores.push(scoreEntry);
        updatedScores[deckName] = deckScores;

        await updateDoc(scoresDocRef, updatedScores);
      } catch (error) {
        console.error("Error saving scores:", error);
        setAlert({
          show: true,
          variant: "danger",
          message: "Failed to save scores. Please try again.",
        });
      }
    }

    // Clear session storage upon finishing the test
    sessionStorage.removeItem(getSessionKey());

    setIsLoading(false);
  };

  // Handler for retaking the test
  const retakeTest = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setUserAnswers([]);
    setFinished(false);
    resetSelections();

    // Clear session storage when retaking the test
    sessionStorage.removeItem(getSessionKey());
  };

  // Handler for reviewing answers
  const reviewAnswers = (filter) => {
    // Implement review functionality based on filter ('correct' or 'wrong')
    // This can be navigated to specific cards or filtered views
    // For simplicity, this is left empty and can be customized
  };

  // Render different question types
  const renderQuestion = (question) => {
    if (!question) {
      return <p className="text-center">No question available.</p>;
    }

    switch (question.type) {
      case "flashcard":
        return (
          <div>
            <h5 className="text-center">Question</h5>
            <p className="fs-5 text-center">{question.question}</p>
            {showAnswer && (
              <>
                <h5 className="text-center mt-4">Answer</h5>
                <p className="fs-5 text-center">{question.answer}</p>
              </>
            )}
          </div>
        );
      case "multiple_choice":
        return (
          <div>
            <h5 className="text-center">Question</h5>
            <p className="fs-5 text-center">{question.question}</p>
            <Form>
              {Array.isArray(question.options) ? (
                question.options.map((option, idx) => (
                  <Form.Check
                    type="radio"
                    name={`mc-${currentCardIndex}`}
                    id={`mc-${currentCardIndex}-${idx}`}
                    label={`${String.fromCharCode(65 + idx)}. ${option}`}
                    key={idx}
                    disabled={showAnswer}
                    onChange={() => submitAnswer(idx)}
                    checked={selectedOption === idx}
                  />
                ))
              ) : (
                <p className="text-danger">Invalid options data.</p>
              )}
            </Form>
          </div>
        );
      case "true_false":
        return (
          <div>
            <h5 className="text-center">Statement</h5>
            <p className="fs-5 text-center">{question.question}</p>
            <Form>
              <Form.Check
                type="radio"
                name={`tf-${currentCardIndex}`}
                id={`tf-true-${currentCardIndex}`}
                label="True"
                disabled={showAnswer}
                onChange={() => submitAnswer(true)}
                checked={selectedOption === true}
              />
              <Form.Check
                type="radio"
                name={`tf-${currentCardIndex}`}
                id={`tf-false-${currentCardIndex}`}
                label="False"
                disabled={showAnswer}
                onChange={() => submitAnswer(false)}
                checked={selectedOption === false}
              />
            </Form>
          </div>
        );
      case "identification":
        return (
          <div>
            <h5 className="text-center">Question</h5>
            <p className="fs-5 text-center">{question.question}</p>
            <Form>
              <Form.Control
                type="text"
                placeholder="Type your answer here..."
                disabled={showAnswer}
                value={identificationAnswer}
                onChange={(e) => setIdentificationAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && identificationAnswer.trim() !== "") {
                    e.preventDefault();
                    submitAnswer(identificationAnswer.trim());
                  }
                }}
              />
            </Form>
          </div>
        );
      default:
        return (
          <div>
            <h5 className="text-center">Question</h5>
            <p className="fs-5 text-center">{question.question}</p>
          </div>
        );
    }
  };

  // Select Card Modal Content
  const renderCardSelection = () => (
    <Modal show={showCardModal} onHide={() => setShowCardModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Select a Card</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-wrap">
        {flashcards.map((_, index) => (
          <OverlayTrigger
            key={index}
            placement="top"
            overlay={
              <Tooltip>
                Card {index + 1} -{" "}
                {userAnswers[index] !== undefined
                  ? "Answered"
                  : "Pending"}
              </Tooltip>
            }
          >
            <Button
              variant={
                index === currentCardIndex
                  ? "primary"
                  : userAnswers[index] !== undefined
                  ? "success"
                  : "outline-secondary"
              }
              className="m-1"
              onClick={() => {
                setCurrentCardIndex(index);
                setShowCardModal(false);
                setShowAnswer(false);
                resetSelections();
              }}
              style={{
                width: "40px",
                height: "40px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index + 1}
            </Button>
          </OverlayTrigger>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowCardModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  if (isLoading) {
    return (
      <div className="container text-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (finished) {
    // Calculate the score to pass to TestResults
    const calculateFinalScore = () => {
      const finalScore = {
        flashcard: { correct: 0, wrong: 0 },
        multiple_choice: { correct: 0, wrong: 0 },
        true_false: { correct: 0, wrong: 0 },
        identification: { correct: 0, wrong: 0 },
      };

      flashcards.forEach((card, index) => {
        const userAnswer = userAnswers[index];
        const type = card.type;

        if (type === "flashcard") {
          // For flashcards, define your own scoring logic
          // For example, consider all flashcards as 'reviewed' without correctness
          // Here, we'll skip scoring for flashcards
        } else if (type === "multiple_choice") {
          if (userAnswer === card.correctOptionIndex) {
            finalScore[type].correct += 1;
          } else {
            finalScore[type].wrong += 1;
          }
        } else if (type === "true_false") {
          if (userAnswer === card.answer) {
            finalScore[type].correct += 1;
          } else {
            finalScore[type].wrong += 1;
          }
        } else if (type === "identification") {
          if (
            card.answer.trim().toLowerCase() === userAnswer?.trim().toLowerCase()
          ) {
            finalScore[type].correct += 1;
          } else {
            finalScore[type].wrong += 1;
          }
        }
      });

      return finalScore;
    };

    const finalScore = calculateFinalScore();

    return (
      <TestResults
        score={finalScore}
        flashcards={flashcards}
        userAnswers={userAnswers}
        onRetake={retakeTest}
        onReviewCorrect={() => reviewAnswers("correct")}
        onReviewWrong={() => reviewAnswers("wrong")}
      />
    );
  }

  return (
    <div className="container my-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Deck: {deckName}</h5>
        <Button variant="outline-secondary" onClick={() => setShowCardModal(true)}>
          Select Card
        </Button>
      </div>

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

      {/* Back Button */}
      <div className="mb-3">
        <Button
          variant="secondary"
          onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
        >
          <i className="fas fa-arrow-left"></i> Back
        </Button>
      </div>

      {/* Flashcard */}
      {currentFlashcard ? (
        <Card className="mb-3" onClick={handleFlipCard} style={{ cursor: "pointer" }}>
          <Card.Body>{renderQuestion(currentFlashcard)}</Card.Body>
        </Card>
      ) : (
        <p className="text-center">No flashcards available.</p>
      )}

      {/* Completion Indicators as Numbered Boxes */}
      <div className="mb-3 d-flex justify-content-center flex-wrap">
        {flashcards.map((_, index) => (
          <div
            key={index}
            className={`mx-1 mb-1`}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "4px",
              backgroundColor:
                userAnswers[index] !== undefined
                  ? "green"
                  : "lightgray",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              cursor: "pointer",
            }}
            title={`Card ${index + 1} - ${
              userAnswers[index] !== undefined ? "Answered" : "Pending"
            }`}
            onClick={() => {
              setCurrentCardIndex(index);
              setShowAnswer(false);
              resetSelections();
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="mb-2">
          <Button
            variant="outline-primary"
            onClick={handlePreviousCard}
            disabled={currentCardIndex === 0}
            className="me-2"
          >
            <i className="fas fa-arrow-left"></i> Previous
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleNextCard}
            disabled={currentCardIndex === flashcards.length - 1}
          >
            Next <i className="fas fa-arrow-right"></i>
          </Button>
        </div>
        <div>
          {currentCardIndex === flashcards.length - 1 && (
            <Button variant="primary" onClick={handleFinish}>
              Finish <i className="fas fa-check"></i>
            </Button>
          )}
        </div>
      </div>

      {/* Show Answer Button */}
      {!showAnswer && (
        <Button variant="info" onClick={handleFlipCard} className="w-100 mb-3">
          Show Answer
        </Button>
      )}

      {/* Submit Answer Button for Multiple Choice, True/False, Identification */}
      {/* Removed as per requirements */}

      {/* Select Card Modal */}
      {renderCardSelection()}
    </div>
  );
};

// Helper function to format question type for display (if needed)
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

export default Test;
