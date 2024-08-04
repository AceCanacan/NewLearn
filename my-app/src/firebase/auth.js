// src/auth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { auth, logFirebaseConfig, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

import './auth.css';

const signUp = async (email, password) => {
  console.log('Attempting to sign up with email:', email);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Sign up successful:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in function
const signIn = async (email, password) => {
  console.log('Attempting to sign in with email:', email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out function
const signOutUser = async () => {
  console.log('Attempting to sign out');
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Listen for auth state changes
const onAuthChange = (callback) => {
  console.log('Setting up auth state change listener');
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// AuthPage component
const AuthPage = ({ setUser }) => {
  const [passwordVerification, setPasswordVerification] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (!isSigningIn && password !== passwordVerification) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSigningIn) {
        console.log('Signing in...');
        const user = await signIn(email, password);
        setUser(user);
      } else {
        console.log('Signing up...');
        await signUp(email, password);
        setAccountCreated(true);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="authpage-container">
      {accountCreated ? (
        <>
          <h2 className="authpage-title">Account Created Successfully</h2>
          <p className="authpage-message">You can now log in with your email and password.</p>
          <div className="authpage-button-container">
            <button
              onClick={() => setIsSigningIn(!isSigningIn)}
              disabled={loading}
              className="authpage-auth-button-secondary"
            >
              {isSigningIn ? 'New Account' : 'Already have an account? Sign In'}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="authpage-title">
            {isForgotPassword ? 'Reset Password' : (isSigningIn ? 'Welcome to NewLearn!' : 'Sign up')}
          </h2>
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
            {!isForgotPassword && (
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
            )}
            {!isSigningIn && !isForgotPassword && (
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
            )}
            <div className="authpage-button-container">
              <button type="submit" disabled={loading} className="authpage-auth-button">
                {isForgotPassword ? 'Send Reset Email' : (isSigningIn ? 'Log In' : 'Sign Up')}
              </button>
            </div>
          </form>
          {error && <p className="authpage-error-message">{error}</p>}
          <div className="authpage-button-container">
            <button
              onClick={() => setIsSigningIn(!isSigningIn)}
              disabled={loading}
              className="authpage-auth-button-secondary"
            >
              {isSigningIn ? 'New Account' : 'Already have an account? Sign In'}
            </button>
            {isSigningIn && (
              <button
                onClick={() => setIsForgotPassword(true)}
                disabled={loading}
                className="authpage-auth-button-secondary"
              >
                Forgot Password?
              </button>
            )}
          </div>
          {isForgotPassword && (
            <div className="authpage-button-container">
              <button
                onClick={() => setIsForgotPassword(false)}
                disabled={loading}
                className="authpage-auth-button-secondary"
              >
                Back to {isSigningIn ? 'Log In' : 'Sign Up'}
              </button>
            </div>
          )}
          {loading && <p className="authpage-loading">Loading...</p>}
        </>
      )}
    </div>
  );
      };

export { logFirebaseConfig, signUp, signIn, signOutUser, onAuthChange, AuthPage };
