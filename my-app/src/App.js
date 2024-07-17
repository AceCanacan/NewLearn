import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Deck from './components/Home/Deck';
import FlashcardInput from './components/FlashcardInput/FlashcardInput';
import TestYourself from './components/Test/Test';
import Review from './components/Test/Review';
import ScoreReport from './components/ScoreReport/ScoreReport';

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
      if (location.pathname.includes('/test/')) {
        event.preventDefault();
        window.dispatchEvent(new Event('showBackDisclaimer'));
      } else if (location.pathname.includes('/score-report/')) {
        const deckName = location.pathname.split('/').pop();
        navigate(`/deck/${deckName}`);
      } else if (location.pathname.includes('/deck/')) {
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

function App() {
  return (
    <Router>
      <CustomRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Deck />} />
            <Route path="/deck/:deckName" element={<FlashcardInput />} />
            <Route path="/test/:deckName" element={<TestYourself />} />
            <Route path="/review/:deckName" element={<Review />} />
            <Route path="/score-report/:deckName" element={<ScoreReport />} />
          </Routes>
        </div>
      </CustomRouter>
    </Router>
  );
}

export default App;