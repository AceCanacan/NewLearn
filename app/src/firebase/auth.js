// src/auth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth, logFirebaseConfig } from './firebase';
import { Button, Form, Alert, Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
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
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 shadow">
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
        </Col>
      </Row>
    </Container>
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
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 shadow">
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
        </Col>
      </Row>
    </Container>
  );
};

// Update the ForgotPassword component to wrap the input with the .authpage-form class
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
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 shadow">
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
        </Col>
      </Row>
    </Container>
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
    <TransitionGroup>
      <CSSTransition
        key={authMode}
        timeout={300}
        classNames="fade"
      >
        <div>{authComponents[authMode]}</div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export { logFirebaseConfig, signUp, signIn, signOutUser, onAuthChange, AuthPage };

//  lezzgooee