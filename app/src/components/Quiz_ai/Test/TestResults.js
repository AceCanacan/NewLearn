import React from "react";
import { Button, Card, ListGroup } from 'react-bootstrap';

const TestResults = ({ score, results, flashcards, onRetake, onReviewCorrect, onReviewWrong }) => {
  return (
    <div className="container my-4">
      <Card className="text-center">
        <Card.Header>Test Summary</Card.Header>
        <Card.Body>
          <Card.Title>Your Performance</Card.Title>
          <Card.Text>
            Correct Answers: {score.correct} <br />
            Wrong Answers: {score.wrong} <br />
            Total: {score.correct + score.wrong}
          </Card.Text>
          <div className="d-flex justify-content-center">
            <Button variant="primary" className="me-2" onClick={onRetake}>
              Retake Test
            </Button>
            <Button variant="success" className="me-2" onClick={onReviewCorrect}>
              Review Correct Answers
            </Button>
            <Button variant="danger" onClick={onReviewWrong}>
              Review Wrong Answers
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Optionally, list all flashcards with results */}
      <Card className="mt-4">
        <Card.Header>Detailed Results</Card.Header>
        <ListGroup variant="flush">
          {flashcards.map((card, index) => (
            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
              <span>{card.question}</span>
              <span>
                {results[index] === 'correct' ? (
                  <span className="text-success">✔️ Correct</span>
                ) : results[index] === 'wrong' ? (
                  <span className="text-danger">❌ Wrong</span>
                ) : (
                  <span>⏸️ Skipped</span>
                )}
              </span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </div>
  );
};

export default TestResults;
