import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import './App.css';
import Home from './components/Home/Home';
import LandingPage from './components/Landing/Landing';
import Deck from './components/Quiz_ai/Deck/Deck';
import FlashcardInput from './components/Quiz_ai/FlashcardInput/FlashcardInput';
import TestYourself from './components/Quiz_ai/Test/Test';
import Review from './components/Quiz_ai/Test/Review';
import ScoreReport from './components/Quiz_ai/ScoreReport/ScoreReport';
import QuizMaker from './components/Quiz_ai/QuizMaker/QuizMaker';
import Transcribe from './components/Transcribe/transcribe';
import SavedTranscriptions from './components/Transcribe/SavedTranscriptions';
import NotesMaker from './components/NotesMaker/Notesmaker';
import SavedNotes from './components/NotesMaker/Savednotes';
import TestResults from './components/Quiz_ai/Test/TestResults';
import PDFReader from './components/pdf_reader/pdf_reader';
import { logFirebaseConfig } from './firebase/firebase';
import { onAuthChange, AuthPage } from './firebase/auth';

// ---------------------- Main App Component ----------------------

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    logFirebaseConfig();

    // Listen for authentication state changes
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            {!user ? (
              <>
                <Route path="/welcome" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage setUser={setUser} />} />
                {/* Redirect any unknown routes to /welcome */}
                <Route path="*" element={<Navigate to="/welcome" replace />} />
              </>
            ) : (
              <>
                {/* Prevent authenticated users from accessing public routes */}
                <Route path="/welcome" element={<Navigate to="/" replace />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />

                {/* Private Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/deck/:deckName" element={<Deck />} />
                <Route
                  path="/deck/:deckName/flashcard-input"
                  element={<FlashcardInput />}
                />
                <Route path="/test/:deckName" element={<TestYourself />} />
                <Route path="/review/:deckName" element={<Review />} />
                <Route path="/score-report/:deckName" element={<ScoreReport />} />
                <Route path="/quizmaker/:deckName" element={<QuizMaker />} />
                <Route path="/transcribe" element={<Transcribe />} />
                <Route path="/savedtranscriptions" element={<SavedTranscriptions />} />
                <Route path="/notesmaker" element={<NotesMaker />} />
                <Route path="/savednotes" element={<SavedNotes />} />
                <Route path="/pdfreader" element={<PDFReader />} />
                <Route path="/testresults" element={<TestResults />} />
                {/* Redirect any unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
    </Router>
  );
}

export default App;