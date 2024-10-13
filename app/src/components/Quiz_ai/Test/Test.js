import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";
import TestResults from "./TestResults"; // Import the new component
import { Button, ListGroup, Card, Modal, Spinner, ProgressBar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { saveToFirestore, loadFromFirestore } from '../../../firebase/firebase';

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize scoring
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user) return;
      setIsLoading(true);
      const storedFlashcards = await loadFromFirestore(
        `users/${user.uid}/decks/${deckName}`,
        []
      );
      setFlashcards(storedFlashcards.flashcards || []);
      setIsLoading(false);
    };
    fetchFlashcards();
  }, [user, deckName]);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex < flashcards.length - 1 ? prevIndex + 1 : prevIndex
    );
    setShowAnswer(false);
  };

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
    setShowAnswer(false);
  };

  const handleFlipCard = () => {
    setShowAnswer((prev) => !prev);
  };

  const handleMarkCorrect = () => {
    const newResults = [...results];
    newResults[currentCardIndex] = 'correct';
    setResults(newResults);
    setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    handleNextCard();
  };

  const handleMarkWrong = () => {
    const newResults = [...results];
    newResults[currentCardIndex] = 'wrong';
    setResults(newResults);
    setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    handleNextCard();
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setFinished(true);

    // Save results to Firestore if needed
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
        // Load existing scores
        const currentScoresData = await loadFromFirestore(
          `users/${user.uid}/settings/scores`,
          {}
        );

        // Append new score
        const deckScores = currentScoresData[deckName] || [];
        const updatedDeckScores = [...deckScores, scoreEntry];

        // Save back to Firestore
        await saveToFirestore(`users/${user.uid}/settings/scores`, {
          ...currentScoresData,
          [deckName]: updatedDeckScores,
        });
      } catch (error) {
        console.error("Error saving score to Firestore:", error);
      }
    }

    setIsLoading(false);
  };

  const retakeTest = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setResults([]);
    setScore({ correct: 0, wrong: 0 });
    setFinished(false);
  };

  const reviewAnswers = (filter) => {
    const filteredIndices = results
      .map((result, index) => (filter === 'correct' && result === 'correct' ? index :
                               filter === 'wrong' && result === 'wrong' ? index : null))
      .filter(index => index !== null);
    
    if (filteredIndices.length > 0) {
      setCurrentCardIndex(filteredIndices[0]);
      setShowAnswer(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (finished) return;

    switch (e.key) {
      case 'ArrowRight':
        handleNextCard();
        break;
      case 'ArrowLeft':
        handlePreviousCard();
        break;
      case ' ':
        e.preventDefault(); // Prevent page scrolling
        handleFlipCard();
        break;
      case 'c':
      case 'C':
        if (showAnswer) handleMarkCorrect();
        break;
      case 'w':
      case 'W':
        if (showAnswer) handleMarkWrong();
        break;
      default:
        break;
    }
  }, [finished, showAnswer, handleNextCard, handlePreviousCard, handleFlipCard, handleMarkCorrect, handleMarkWrong]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Calculate progress percentage
  const progressPercentage = ((currentCardIndex) / flashcards.length) * 100;

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
        onReviewCorrect={() => reviewAnswers('correct')}
        onReviewWrong={() => reviewAnswers('wrong')}
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

      {/* Progress Bar and Current Position */}
      <div className="mb-3">
        <ProgressBar now={progressPercentage} label={`${currentCardIndex} / ${flashcards.length}`} />
      </div>

      {/* Back Button */}
      <div className="mb-3">
        <Button variant="secondary" onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}>
          <i className="fas fa-arrow-left"></i> Back
        </Button>
      </div>

      {/* Flashcard */}
      <Card className="mb-3" onClick={handleFlipCard} style={{ cursor: 'pointer' }}>
        <Card.Body>
          <Card.Title className="text-center">{showAnswer ? 'Answer' : 'Question'}</Card.Title>
          <Card.Text className="fs-5 text-center">
            {showAnswer ? flashcards[currentCardIndex]?.answer : flashcards[currentCardIndex]?.question}
          </Card.Text>
        </Card.Body>
      </Card>

      {/* Completion Indicators */}
      <div className="mb-3 d-flex justify-content-center flex-wrap">
        {flashcards.map((_, index) => (
          <div
            key={index}
            className={`mx-1 mb-1 rounded-circle`}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor:
                index < currentCardIndex
                  ? results[index] === 'correct'
                    ? 'green'
                    : results[index] === 'wrong'
                      ? 'red'
                      : 'gray'
                  : 'lightgray',
            }}
            title={`Card ${index + 1} - ${results[index] ? results[index].charAt(0).toUpperCase() + results[index].slice(1) : 'Pending'}`}
          ></div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
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

      {/* Mark Correct/Wrong Buttons */}
      {showAnswer && (
        <div className="d-flex justify-content-center mb-3">
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Mark as Correct (C)</Tooltip>}
          >
            <Button variant="success" className="me-2" onClick={handleMarkCorrect}>
              Correct (C)
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Mark as Wrong (W)</Tooltip>}
          >
            <Button variant="danger" onClick={handleMarkWrong}>
              Wrong (W)
            </Button>
          </OverlayTrigger>
        </div>
      )}

      {/* Select Card Modal */}
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
                  {results[index]
                    ? `Card ${index + 1}: ${results[index].charAt(0).toUpperCase() + results[index].slice(1)}`
                    : `Card ${index + 1}: Pending`}
                </Tooltip>
              }
            >
              <Button
                variant={index === currentCardIndex ? "primary" : results[index] === 'correct' ? "success" : results[index] === 'wrong' ? "danger" : "outline-primary"}
                className="m-1"
                onClick={() => {
                  setCurrentCardIndex(index);
                  setShowCardModal(false);
                  setShowAnswer(false);
                }}
                style={{ width: '40px', height: '40px', padding: 0 }}
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
    </div>
  );
};

export default Test;
