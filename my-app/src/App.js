import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home/Home';
import Deck from './components/Quiz_ai/Deck/Deck';
import FlashcardInput from './components/Quiz_ai/FlashcardInput/FlashcardInput';
import TestYourself from './components/Quiz_ai/Test/Test';
import Review from './components/Quiz_ai/Test/Review';
import ScoreReport from './components/Quiz_ai/ScoreReport/ScoreReport';
import QuizMaker from './components/Quiz_ai/QuizMaker/QuizMaker';
import Transcribe from './components/Transcribe/transcribe';
import SavedTranscriptions from './components/Transcribe/SavedTranscriptions';
import NotesMaker from './components/NotesMaker/Notes';

import { logFirebaseConfig } from './firebase/firebase';
import { signUp, signIn, signOutUser, onAuthChange } from './auth';

const CustomRouter = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (location.pathname.includes('/test/')) {
        event.preventDefault();
        event.returnValue = 'Please make sure that you have saved your progress.';
      }
    };

    const handlePopState = (event) => {
      if (location.pathname === '/') {
        event.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      } else if (location.pathname.startsWith('/deck/')) {
        event.preventDefault();
        navigate('/');
      } else if (location.pathname.includes('/test/')) {
        event.preventDefault();
        window.dispatchEvent(new Event('showBackDisclaimer'));
      } else if (location.pathname.includes('/score-report/')) {
        const deckName = location.pathname.split('/').pop();
        navigate(`/deck/${deckName}`);
      } else if (location.pathname.includes('/quizmaker/')) {
        const deckName = location.pathname.split('/').pop();
        navigate(`/deck/${deckName}`);
      } else {
        window.history.go(-1);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    const showDisclaimer = (event) => {
      const userConfirmed = window.confirm('Please make sure that you have saved your progress. Press OK to leave, Cancel to stay.');
      if (userConfirmed) {
        setIsNavigatingBack(true);
        window.history.go(-1);
      } else {
        event.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    if (isNavigatingBack) {
      setIsNavigatingBack(false);
    } else {
      window.addEventListener('showBackDisclaimer', showDisclaimer);
    }

    return () => {
      window.removeEventListener('showBackDisclaimer', showDisclaimer);
    };
  }, [isNavigatingBack]);

  return children;
};

const AuthForm = ({ onSubmit, buttonText }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit">{buttonText}</button>
    </form>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(true);

  useEffect(() => {
    logFirebaseConfig();

    // Listen for authentication state changes
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (email, password) => {
    try {
      await signUp(email, password);
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  const handleSignIn = async (email, password) => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <Router>
      <CustomRouter>
        <div className="App">
          {user ? (
            <>
              <h1>Welcome, {user.email}</h1>
              <button onClick={signOutUser}>Sign Out</button>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/deck/:deckName" element={<Deck />} />
                <Route path="/deck/:deckName/flashcard-input" element={<FlashcardInput />} />
                <Route path="/test/:deckName" element={<TestYourself />} />
                <Route path="/review/:deckName" element={<Review />} />
                <Route path="/score-report/:deckName" element={<ScoreReport />} />
                <Route path="/quizmaker/:deckName" element={<QuizMaker />} />
                <Route path="/transcribe" element={<Transcribe />} />
                <Route path="/savedtranscriptions" element={<SavedTranscriptions />} />
                <Route path="/notesmaker" element={<NotesMaker />} />
              </Routes>
            </>
          ) : (
            <div>
              <h2>{isSigningIn ? 'Sign In' : 'Sign Up'}</h2>
              <AuthForm
                onSubmit={isSigningIn ? handleSignIn : handleSignUp}
                buttonText={isSigningIn ? 'Sign In' : 'Sign Up'}
              />
              <button onClick={() => setIsSigningIn(!isSigningIn)}>
                {isSigningIn ? 'Need to create an account? Sign Up' : 'Already have an account? Sign In'}
              </button>
              
            </div>
          )}
        </div>
      </CustomRouter>
    </Router>
  );
}

export default App;
