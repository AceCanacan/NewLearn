// src/firebase/auth.js
import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import './Auth.css'; // Import CSS for styling

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('Firestore initialized:', db);
console.log('Auth initialized:', auth);
console.log('Storage initialized:', storage);

// Log Firebase config (optional)
const logFirebaseConfig = () => {
  console.log('Firebase Config:', firebaseConfig);
};

// Sign up function
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
  onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user);
    callback(user);
  });
};

// AuthPage component
const AuthPage = ({ setUser }) => {
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('Rendering AuthPage component');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      let user;
      if (isSigningIn) {
        console.log('Signing in...');
        user = await signIn(email, password);
      } else {
        console.log('Signing up...');
        user = await signUp(email, password);
      }
      setUser(user);
    } catch (error) {
      console.error('Authentication failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSigningIn ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" disabled={loading}>
          {isSigningIn ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <button onClick={() => {
        console.log('Toggling sign in/sign up mode');
        setIsSigningIn(!isSigningIn);
      }} disabled={loading}>
        {isSigningIn ? 'Need to create an account? Sign Up' : 'Already have an account? Sign In'}
      </button>
      {loading && <p>Loading...</p>}
    </div>
  );
};

export { db, auth, storage, logFirebaseConfig, signUp, signIn, signOutUser, onAuthChange, AuthPage };