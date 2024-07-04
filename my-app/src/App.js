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
    const handlePopState = (event) => {
      event.preventDefault();
      
      if (currentPath.includes('/test/')) {
        window.dispatchEvent(new Event('showBackDisclaimer'));
      } else if (currentPath.includes('/deck/')) {
        navigate(`/`);
      } else {
        window.history.go(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPath, navigate]);

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
          </Routes>
        </div>
      </CustomRouter>
    </Router>
  );
}

export default App;
