// src/auth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth, logFirebaseConfig } from './firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './auth.css';

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
    <div className="authpage-container">
      <h2 className="authpage-title">Sign Up</h2>
      <form onSubmit={handleSubmit} className="authpage-form">
        <div className="authpage-form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="authpage-input"
            placeholder="Email"
          />
        </div>
        <div className="authpage-form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="authpage-input"
            placeholder="Password"
          />
        </div>
        <div className="authpage-form-group">
          <input
            type="password"
            value={passwordVerification}
            onChange={(e) => setPasswordVerification(e.target.value)}
            required
            className="authpage-input"
            placeholder="Verify Password"
          />
        </div>
        <div className="authpage-button-container">
          <button type="submit" disabled={loading} className="authpage-auth-button">
            Sign Up
          </button>
        </div>
      </form>
      {error && <p className="authpage-error-message">{error}</p>}
      <div className="authpage-button-container">
        <button
          onClick={() => setAuthMode('login')}
          disabled={loading}
          className="authpage-auth-button-secondary"
        >
          Already have an account? Sign In
        </button>
      </div>
      {loading && <p className="authpage-loading">Loading...</p>}
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
    <div className="authpage-container">
      <h2 className="authpage-title">Log In</h2>
      <form onSubmit={handleSubmit} className="authpage-form">
        <div className="authpage-form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="authpage-input"
            placeholder="Email"
          />
        </div>
        <div className="authpage-form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="authpage-input"
            placeholder="Password"
          />
        </div>
        <div className="authpage-button-container">
          <button type="submit" disabled={loading} className="authpage-auth-button">
            Log In
          </button>
        </div>
      </form>
      {error && <p className="authpage-error-message">{error}</p>}
      <div className="authpage-button-container">
        <button
          onClick={() => setAuthMode('signup')}
          disabled={loading}
          className="authpage-auth-button-secondary"
        >
          New Account
        </button>
        <button
          onClick={() => setAuthMode('forgotPassword')}
          disabled={loading}
          className="authpage-auth-button-secondary"
        >
          Forgot Password?
        </button>
      </div>
      {loading && <p className="authpage-loading">Loading...</p>}
    </div>
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
    <div className="authpage-container">
      <h2 className="authpage-title">Reset Password</h2>
      <form className="authpage-form">  {/* Add this line */}
        <div className="authpage-form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="authpage-input"
            placeholder="Email"
          />
        </div>
        <div className="authpage-button-container">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="authpage-auth-button"
          >
            Send Code
          </button>
        </div>
      </form>  {/* Add this line */}
      {error && <p className="authpage-error-message">{error}</p>}
      <div className="authpage-button-container">
        <button
          onClick={() => setAuthMode('login')}
          disabled={loading}
          className="authpage-auth-button-secondary"
        >
          Back to Log In
        </button>
      </div>
      {loading && <p className="authpage-loading">Loading...</p>}
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