// src/components/Quiz_ai/ScoreReport.js

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../../../firebase/firebase";
import TestResults from "../Test/TestResults";
import { loadFromFirestore, deleteScoreFromFirestore } from '../../../firebase/firebase';

import { 
  Container, 
  Button, 
  Accordion, 
  Card, 
  Spinner, 
  Row, 
  Col, 
  Alert, 
  Badge, 
  Tooltip, 
  OverlayTrigger 
} from 'react-bootstrap';

import { BsArrowLeft, BsTrash } from 'react-icons/bs';

const ScoreReport = () => {
  const { deckName } = useParams();
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const storedScores = await loadFromFirestore(
            `users/${user.uid}/settings/scores`,
            {}
          );
          if (storedScores[deckName]) {
            setScores(storedScores[deckName]);
          }
        } catch (error) {
          console.error("Error fetching scores:", error);
          setAlert({ show: true, variant: 'danger', message: 'Failed to load scores. Please try again later.' });
        }
      } else {
        setAlert({ show: true, variant: 'warning', message: 'You must be signed in to view scores.' });
      }
      setIsLoading(false);
    };
    fetchScores();
  }, [deckName]);

  const handleDelete = async (index) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteScoreFromFirestore(user.uid, deckName, index);
        setScores((prevScores) => prevScores.filter((_, i) => i !== index));
        setAlert({ show: true, variant: 'success', message: 'Score deleted successfully.' });
      } catch (error) {
        console.error("Error deleting score:", error);
        setAlert({ show: true, variant: 'danger', message: 'Failed to delete score. Please try again.' });
      }
    }
  };

  const AttemptCard = ({ scoreEntry, index }) => {
    const [testResults, setTestResults] = useState(null);

    useEffect(() => {
      setTestResults(scoreEntry.testResult); // The saved test result is passed here
    }, [scoreEntry]);

    return (
      <Card className="mb-3">
        <Accordion.Item eventKey={index.toString()}>
          <Accordion.Header>
            <Row className="w-100">
              <Col xs={4}>
                <strong>Score:</strong> <Badge bg="success">{scoreEntry.score.correct}</Badge> | <Badge bg="danger">{scoreEntry.score.wrong}</Badge>
              </Col>
              <Col xs={4} className="text-center">
                <strong>Percentage:</strong> {((scoreEntry.score.correct / (scoreEntry.score.correct + scoreEntry.score.wrong)) * 100).toFixed(2)}%
              </Col>
              <Col xs={4} className="text-end">
                <strong>Date:</strong> {new Date(scoreEntry.date).toLocaleString()}
              </Col>
            </Row>
          </Accordion.Header>
          <Accordion.Body>
            {testResults ? (
              <TestResults
                score={scoreEntry.score}
                results={testResults.results}
                flashcards={testResults.flashcards}
                onRetake={() => {
                  navigate(`/test/${testResults.deckName}`);
                }}
                // Optionally, disable review features for past tests
                onReviewCorrect={() => { /* Implement if needed */ }}
                onReviewWrong={() => { /* Implement if needed */ }}
              />
            ) : (
              <p>No detailed results available.</p>
            )}
            <Button 
              variant="danger" 
              size="sm" 
              className="mt-3"
              onClick={() => handleDelete(index)}
            >
              <BsTrash className="me-2" />
              Delete
            </Button>
          </Accordion.Body>
        </Accordion.Item>
      </Card>
    );
  };

  return (
    <Container className="my-4">
      {/* Alert Messages */}
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
      <Button 
        variant="secondary" 
        className="mb-4 d-flex align-items-center"
        onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
      >
        <BsArrowLeft className="me-2" />
        Back
      </Button>

      {/* Header */}
      <h2 className="mb-4">Score Report for "{deckName}"</h2>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {/* No Scores Message */}
          {scores.length === 0 ? (
            <p>No scores available for this deck.</p>
          ) : (
            /* Accordion for Scores */
            <Accordion>
              {scores.map((scoreEntry, index) => (
                <AttemptCard 
                  key={index} 
                  scoreEntry={scoreEntry} 
                  index={index} 
                />
              ))}
            </Accordion>
          )}
        </>
      )}
    </Container>
  );
};

export default ScoreReport;
