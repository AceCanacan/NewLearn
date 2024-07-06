import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Deck from './components/Home/Deck';
import FlashcardInput from './components/FlashcardInput/FlashcardInput';
import TestYourself from './components/Test/Test';
import Review from './components/Test/Review';

const CustomRouter = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (currentPath.includes('/test/')) {
        event.preventDefault();
        event.returnValue = 'Please make sure that you have saved your progress.';
      }
    };

    const handlePopState = (event) => {
      if (currentPath.includes('/test/')) {
        event.preventDefault();
        window.dispatchEvent(new Event('showBackDisclaimer'));
      } else if (currentPath.includes('/deck/')) {
        navigate(`/`);
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
  }, [currentPath, navigate]);

  return children;
};

function App() {
  useEffect(() => {
    const showDisclaimer = (event) => {
      const userConfirmed = window.confirm('Please make sure that you have saved your progress. Press OK to leave, Cancel to stay.');
      if (!userConfirmed) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('showBackDisclaimer', showDisclaimer);

    return () => {
      window.removeEventListener('showBackDisclaimer', showDisclaimer);
    };
  }, []);

  return (
    <Router>
      <CustomRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Deck />} />
            <Route path="/deck/:deckName" element={<FlashcardInput />} />
            <Route path="/test/:deckName" element={<TestYourself />} />
            <Route path="/review/:deckName" element={<Review />} />
          </Routes>
        </div>
      </CustomRouter>
    </Router>
  );
}

export default App;
