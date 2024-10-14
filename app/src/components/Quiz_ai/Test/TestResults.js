// File: src/components/Quiz_ai/Test/TestResults.js

import React from "react";
import { Button, Card, ListGroup, Badge, Table } from 'react-bootstrap';

const TestResults = ({ score, results, flashcards, onRetake, onReviewCorrect, onReviewWrong }) => {
  // Calculate total scores per type
  const types = Object.keys(score);

  return (
    <div className="container my-4">
      {/* Overall Performance Card */}
      <Card className="text-center mb-4">
        <Card.Header>Test Summary</Card.Header>
        <Card.Body>
          <Card.Title>Your Overall Performance</Card.Title>
          <Card.Text>
            <strong>Total Correct:</strong> {Object.values(score).reduce((acc, curr) => acc + curr.correct, 0)} <br />
            <strong>Total Wrong:</strong> {Object.values(score).reduce((acc, curr) => acc + curr.wrong, 0)} <br />
            <strong>Total Questions:</strong> {flashcards.length}
          </Card.Text>
          <div className="d-flex justify-content-center flex-wrap">
            <Button variant="primary" className="me-2 mb-2" onClick={onRetake}>
              Retake Test
            </Button>
            <Button variant="success" className="me-2 mb-2" onClick={onReviewCorrect}>
              Review Correct Answers
            </Button>
            <Button variant="danger" className="mb-2" onClick={onReviewWrong}>
              Review Wrong Answers
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Per Type Performance Table */}
      <Card className="mb-4">
        <Card.Header>Performance by Question Type</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Question Type</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Total</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type}>
                  <td><Badge bg="secondary">{formatQuestionType(type)}</Badge></td>
                  <td>{score[type].correct}</td>
                  <td>{score[type].wrong}</td>
                  <td>{score[type].correct + score[type].wrong}</td>
                  <td>
                    {score[type].correct + score[type].wrong > 0
                      ? `${((score[type].correct / (score[type].correct + score[type].wrong)) * 100).toFixed(2)}%`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Detailed Results Accordion */}
      <Card>
        <Card.Header>Detailed Results</Card.Header>
        <ListGroup variant="flush">
          {flashcards.map((card, index) => (
            <DetailedResultItem 
              key={index} 
              index={index} 
              card={card} 
              result={results[index]} 
            />
          ))}
        </ListGroup>
      </Card>
    </div>
  );
};

// Helper component for detailed result items
const DetailedResultItem = ({ index, card, result }) => {
  const { question, type, answer, options } = card;

  return (
    <ListGroup.Item>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Q{index + 1}:</strong> {question} <br />
          <em>Type:</em> {formatQuestionType(type)}
          {type === "multiple_choice" && options && (
            <div>
              <em>Options:</em>
              <ul>
                {options.map((opt, idx) => (
                  <li key={idx}>{String.fromCharCode(65 + idx)}. {opt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          {result === 'correct' ? (
            <Badge bg="success">✔️ Correct</Badge>
          ) : result === 'wrong' ? (
            <Badge bg="danger">❌ Wrong</Badge>
          ) : (
            <Badge bg="secondary">⏸️ Skipped</Badge>
          )}
        </div>
      </div>
      {result && (
        <div className="mt-2">
          <strong>Your Answer:</strong> {getUserAnswer(card, result)} <br />
          <strong>Correct Answer:</strong> {displayCorrectAnswer(card)}
        </div>
      )}
    </ListGroup.Item>
  );
};

// Helper function to display user's answer based on question type
const getUserAnswer = (card, result) => {
  // This function assumes that you have access to the user's answer.
  // You might need to pass additional props or adjust based on your data structure.
  // For demonstration, we'll return a placeholder.
  return result === 'correct' ? "Correct Answer" : "Your Wrong Answer";
};

// Helper function to display correct answer based on question type
const displayCorrectAnswer = (card) => {
  const { type, answer, options } = card;
  switch (type) {
    case "flashcard":
      return answer;
    case "multiple_choice":
      return options && options[answer] ? options[answer] : answer;
    case "true_false":
      return answer ? "True" : "False";
    case "identification":
      return answer;
    default:
      return answer;
  }
};

// Helper function to format question type for display
const formatQuestionType = (type) => {
  switch (type) {
    case 'flashcard':
      return 'Flashcard';
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'true_false':
      return 'True or False';
    case 'identification':
      return 'Identification';
    default:
      return 'Unknown';
  }
};

export default TestResults;
