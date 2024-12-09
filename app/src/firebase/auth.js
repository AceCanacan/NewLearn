// src/firebase/auth.js
import React, { useState } from 'react';
import { signUp, signIn, signOutUser, auth, sendPasswordResetEmail } from './firebase';
import { Button, Form, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import logo from '../assets/NL_logo.png';
import { useNavigate } from 'react-router-dom';

const LandingSection = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/auth');
  };

  return (
    <div className="text-center p-5">
      <img src={logo} alt="NewLearn Logo" className="img-fluid mb-4" style={{ maxWidth: '200px' }} />
      <h1 className="display-4 mb-3">All in One Learning Platform</h1>
      <p className="lead">
        NewLearn is an <strong>all-in-one learning platform</strong> where AI helps you create quizzes, design flashcards, organize notes, and interact with PDFs, all through a flexible <strong>pay-as-you-go payment</strong>.
      </p>

    </div>
  );
};

const SignUp = ({ setUser, setAuthMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVerification, setPasswordVerification] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordVerification) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setAuthMode('login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 d-flex justify-content-center align-items-center min-vh-100 p-4">
      <Card className="p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Sign Up</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </Form.Group>
            <Form.Group controlId="formPasswordVerification" className="mb-3">
              <Form.Control
                type="password"
                value={passwordVerification}
                onChange={(e) => setPasswordVerification(e.target.value)}
                required
                placeholder="Verify Password"
              />
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Sign Up'}
            </Button>
          </Form>
          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={() => setAuthMode('login')}
              disabled={loading}
            >
              Already have an account? Sign In
            </Button>
          </div>
          {loading && <p className="text-center mt-2">Loading...</p>}
        </Card.Body>
      </Card>
    </div>
  );
};

const LogIn = ({ setUser, setAuthMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signIn(email, password);
      setUser(user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 d-flex justify-content-center align-items-center min-vh-100 p-4">
      <Card className="p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Log In</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Log In'}
            </Button>
          </Form>
          <div className="d-flex justify-content-between mt-3">
            <Button
              variant="link"
              onClick={() => setAuthMode('signup')}
              disabled={loading}
            >
              New Account
            </Button>
            <Button
              variant="link"
              onClick={() => setAuthMode('forgotPassword')}
              disabled={loading}
            >
              Forgot Password?
            </Button>
          </div>
          {loading && <p className="text-center mt-2">Loading...</p>}
        </Card.Body>
      </Card>
    </div>
  );
};

const ForgotPassword = ({ setAuthMode }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 d-flex justify-content-center align-items-center min-vh-100 p-4">
      <Card className="p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Reset Password</Card.Title>
          <Form>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
              />
            </Form.Group>
            {error && <Alert variant={error === 'Password reset email sent.' ? 'success' : 'danger'}>{error}</Alert>}
            <Button
              variant="primary"
              className="w-100"
              onClick={handlePasswordReset}
              disabled={loading}
            >
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Send Code'}
            </Button>
          </Form>
          <div className="text-center mt-3">
            <Button
              variant="link"
              onClick={() => setAuthMode('login')}
              disabled={loading}
            >
              Back to Log In
            </Button>
          </div>
          {loading && <p className="text-center mt-2">Loading...</p>}
        </Card.Body>
      </Card>
    </div>
  );
};

const AuthPage = ({ setUser }) => {
  const [authMode, setAuthMode] = useState('login');

  const authComponents = {
    signup: <SignUp setUser={setUser} setAuthMode={setAuthMode} />,
    login: <LogIn setUser={setUser} setAuthMode={setAuthMode} />,
    forgotPassword: <ForgotPassword setAuthMode={setAuthMode} />
  };

  return (
    <Container fluid className="min-vh-100 d-flex p-0">
      <Row className="w-100 m-0">
        <Col md={6} className="d-none d-md-flex align-items-center justify-content-center bg-light p-0">
          <LandingSection />
        </Col>
        <Col xs={12} md={6} className="p-0">
          <TransitionGroup>
            <CSSTransition
              key={authMode}
              timeout={300}
              classNames="fade"
            >
              <div className="w-100 h-100 d-flex flex-column">{authComponents[authMode]}</div>
            </CSSTransition>
          </TransitionGroup>
        </Col>
      </Row>
    </Container>
  );
};

export { AuthPage };