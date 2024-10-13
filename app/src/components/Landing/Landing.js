import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/NL_logo.png';  // Import the logo

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/auth');
  };

  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={6}>
          <img src={logo} alt="NewLearn Logo" className="img-fluid mb-3" style={{ maxWidth: '200px' }} />
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs={12} md={8}>
          <h1 className="display-4 mb-3">All in One Learning Platform</h1>
          <p className="lead">
            NewLearn is an <strong>all-in-one learning platform</strong> where AI helps you create quizzes, design flashcards, organize notes, and interact with PDFs, all through a flexible <strong>pay-as-you-go payment</strong>.
          </p>
        </Col>
      </Row>
      <Row className="justify-content-center mt-4">
        <Col xs={12} md={6}>
          <Button variant="primary" size="lg" onClick={handleStartClick}>
            START
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default LandingPage;

