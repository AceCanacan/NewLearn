import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Deck from './components/Home/Deck';
import FlashcardInput from './components/FlashcardInput/FlashcardInput';
import TestYourself from './components/Test/Test'; // Import the new component
import Review from './components/Test/Review';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Deck />} />
          <Route path="/deck/:deckName" element={<FlashcardInput />} />
          <Route path="/test/:deckName" element={<TestYourself />} /> {/* Add the new route */}
          <Route path="/review/:deckName" element={<Review />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
