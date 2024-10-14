import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Sidebar from './components/Home/Home';
import LandingPage from './components/Landing/Landing';
import Deck from './components/Quiz_ai/Deck/Deck';
import FlashcardInput from './components/Quiz_ai/FlashcardInput/FlashcardInput';
import TestYourself from './components/Quiz_ai/Test/Test';
import ScoreReport from './components/Quiz_ai/ScoreReport/ScoreReport';
import QuizMaker from './components/Quiz_ai/QuizMaker/QuizMaker';
import NotesMaker from './components/NotesMaker/Notesmaker';
import SavedNotes from './components/NotesMaker/Savednotes';
import TestResults from './components/Quiz_ai/Test/TestResults';
import { logFirebaseConfig } from './firebase/firebase';
import { onAuthChange, AuthPage } from './firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

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
              <Route path="*" element={<Navigate to="/welcome" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Sidebar />}>
                {/* Add the new route below */}
                <Route path="quizmaker/:deckName" element={<QuizMaker />} />
                
                {/* Existing Routes */}
                <Route index element={<Navigate to="/deck/home" replace />} />
                <Route path="quizmaker" element={<QuizMaker />} />
                <Route path="deck/:deckName" element={<Deck />} />
                <Route path="deck/:deckName/flashcard-input" element={<FlashcardInput />} />
                <Route path="test/:deckName" element={<TestYourself />} />
                <Route path="score-report/:deckName" element={<ScoreReport />} />
                <Route path="notesmaker" element={<NotesMaker />} />
                <Route path="savednotes" element={<SavedNotes />} />
                <Route path="testresults" element={<TestResults />} />
                <Route path="*" element={<Navigate to="/deck/home" replace />} />
              </Route>
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;