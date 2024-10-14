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
  const [results, setResults] = useState([]); // Tracks 'correct' or 'wrong' for each flashcard
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });

  // Initialize scoring with per-type structure
  const [score, setScore] = useState({
    flashcard: { correct: 0, wrong: 0 },
    multiple_choice: { correct: 0, wrong: 0 },
    true_false: { correct: 0, wrong: 0 },
    identification: { correct: 0, wrong: 0 },
  });

  // Selection states for different question types
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

  // Load progress from sessionStorage
  useEffect(() => {
    if (!user) return;

    const sessionData = sessionStorage.getItem(getSessionKey());
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      setCurrentCardIndex(parsedData.currentCardIndex);
      setResults(parsedData.results);
      setScore(parsedData.score);
    }
  }, [user, deckName]);

  // Save progress to sessionStorage whenever relevant states change
  useEffect(() => {
    if (!user) return;

    const sessionData = {
      currentCardIndex,
      results,
      score,
    };
    sessionStorage.setItem(getSessionKey(), JSON.stringify(sessionData));
  }, [currentCardIndex, results, score, user, deckName]);

  // Fetch flashcards from Firestore
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const deckDocRef = doc(db, "users", user.uid, "decks", deckName);
        const deckDoc = await getDoc(deckDocRef);
        if (deckDoc.exists()) {
          setFlashcards(deckDoc.data().flashcards || []);
        } else {
          setAlert({
            show: true,
            variant: "danger",
            message: "Deck does not exist.",
          });
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setAlert({
          show: true,
          variant: "danger",
          message: "Failed to load flashcards. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlashcards();
  }, [user, deckName]);

  // Determine current flashcard
  const currentFlashcard = useMemo(() => {
    return flashcards.length > 0 ? flashcards[currentCardIndex] : null;
  }, [flashcards, currentCardIndex]);

  // Helper to get current question type
  const currentQuestionType = useCallback(() => {
    if (flashcards.length === 0) return "flashcard";
    return flashcards[currentCardIndex].type;
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
        case "c":
        case "C":
          if (
            showAnswer &&
            ["flashcard"].includes(currentQuestionType())
          ) {
            handleMarkCorrect();
          }
          break;
        case "w":
        case "W":
          if (
            showAnswer &&
            ["flashcard"].includes(currentQuestionType())
          ) {
            handleMarkWrong();
          }
          break;
        default:
          break;
      }
    },
    [finished, showAnswer, currentQuestionType]
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

  // Handlers for marking correct/wrong (Flashcard only)
  const handleMarkCorrect = () => {
    const type = currentQuestionType();
    setScore((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        correct: prev[type].correct + 1,
      },
    }));
    const newResults = [...results];
    newResults[currentCardIndex] = "correct";
    setResults(newResults);
    handleNextCard();
  };

  const handleMarkWrong = () => {
    const type = currentQuestionType();
    setScore((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        wrong: prev[type].wrong + 1,
      },
    }));
    const newResults = [...results];
    newResults[currentCardIndex] = "wrong";
    setResults(newResults);
    handleNextCard();
  };

  // Handler for submitting answers (Multiple Choice, True/False, Identification)
  const submitAnswer = () => {
    const currentQuestion = flashcards[currentCardIndex];
    let isCorrect = false;

    switch (currentQuestion.type) {
      case "multiple_choice":
        isCorrect = selectedOption === currentQuestion.correctOptionIndex;
        break;
      case "true_false":
        isCorrect = selectedOption === currentQuestion.answer;
        break;
      case "identification":
        isCorrect =
          currentQuestion.answer.trim().toLowerCase() ===
          identificationAnswer.trim().toLowerCase();
        break;
      default:
        break;
    }

    const type = currentQuestionType();

    if (isCorrect) {
      setScore((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          correct: prev[type].correct + 1,
        },
      }));
      setResults((prev) => {
        const newResults = [...prev];
        newResults[currentCardIndex] = "correct";
        return newResults;
      });
    } else {
      setScore((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          wrong: prev[type].wrong + 1,
        },
      }));
      setResults((prev) => {
        const newResults = [...prev];
        newResults[currentCardIndex] = "wrong";
        return newResults;
      });
    }

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

    // Save results to Firestore
    if (user) {
      const scoreEntry = {
        date: new Date().toISOString(),
        score: score,
        testResult: {
          results,
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
    setResults([]);
    setScore({
      flashcard: { correct: 0, wrong: 0 },
      multiple_choice: { correct: 0, wrong: 0 },
      true_false: { correct: 0, wrong: 0 },
      identification: { correct: 0, wrong: 0 },
    });
    setFinished(false);
    resetSelections();

    // Clear session storage when retaking the test
    sessionStorage.removeItem(getSessionKey());
  };

  // Handler for reviewing answers
  const reviewAnswers = (filter) => {
    const filteredIndices = results
      .map((result, index) =>
        filter === "correct" && result === "correct"
          ? index
          : filter === "wrong" && result === "wrong"
          ? index
          : null
      )
      .filter((index) => index !== null);

    if (filteredIndices.length > 0) {
      setCurrentCardIndex(filteredIndices[0]);
      setShowAnswer(false);
      resetSelections();
    }
  };

  // Render different question types
  const renderQuestion = (question) => {
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
              {question.options.map((option, idx) => (
                <Form.Check
                  type="radio"
                  name={`mc-${currentCardIndex}`}
                  id={`mc-${currentCardIndex}-${idx}`}
                  label={`${String.fromCharCode(65 + idx)}. ${option}`}
                  key={idx}
                  disabled={showAnswer}
                  onChange={() => setSelectedOption(idx)}
                  checked={selectedOption === idx}
                />
              ))}
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
                onChange={() => setSelectedOption(true)}
                checked={selectedOption === true}
              />
              <Form.Check
                type="radio"
                name={`tf-${currentCardIndex}`}
                id={`tf-false-${currentCardIndex}`}
                label="False"
                disabled={showAnswer}
                onChange={() => setSelectedOption(false)}
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
                {results[index]
                  ? results[index].charAt(0).toUpperCase() + results[index].slice(1)
                  : "Pending"}
              </Tooltip>
            }
          >
            <Button
              variant={
                index === currentCardIndex
                  ? "primary"
                  : results[index] === "correct"
                  ? "success"
                  : results[index] === "wrong"
                  ? "danger"
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
    return (
      <TestResults
        score={score}
        flashcards={flashcards}
        results={results}
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
        <Button variant="secondary" onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}>
          <i className="fas fa-arrow-left"></i> Back
        </Button>
      </div>

      {/* Flashcard */}
      {currentFlashcard && (
        <Card className="mb-3" onClick={handleFlipCard} style={{ cursor: "pointer" }}>
          <Card.Body>{renderQuestion(currentFlashcard)}</Card.Body>
        </Card>
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
                results[index] === "correct"
                  ? "green"
                  : results[index] === "wrong"
                  ? "red"
                  : "lightgray",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              cursor: "pointer",
            }}
            title={`Card ${index + 1} - ${
              results[index] ? results[index].charAt(0).toUpperCase() + results[index].slice(1) : "Pending"
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

      {/* Mark Correct/Wrong Buttons for Flashcards */}
      {showAnswer && currentQuestionType() === "flashcard" && (
        <div className="d-flex justify-content-center mb-3">
          <Button variant="success" className="me-2" onClick={handleMarkCorrect}>
            Correct
          </Button>
          <Button variant="danger" onClick={handleMarkWrong}>
            Wrong
          </Button>
        </div>
      )}

      {/* Submit Answer Button for Multiple Choice, True/False, Identification */}
      {showAnswer &&
        ["multiple_choice", "true_false", "identification"].includes(currentQuestionType()) && (
          <Button
            variant="primary"
            onClick={submitAnswer}
            disabled={
              (currentQuestionType() === "multiple_choice" && selectedOption === null) ||
              (currentQuestionType() === "true_false" && selectedOption === null) ||
              (currentQuestionType() === "identification" && identificationAnswer.trim() === "")
            }
            className="w-100 mb-3"
          >
            Submit Answer
          </Button>
        )}

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
