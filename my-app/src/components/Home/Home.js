// src/components/Home/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const goToDeck = (deckName) => {
    navigate(`/deck/${deckName}`);
  };

  const goToTranscribe = () => {
    navigate(`/savedtranscriptions`);
  };

  const goToNotes = () => {
    navigate(`/savednotes`);
  };

  return (
    <div>
      <h1>Home</h1>
      <button onClick={() => goToDeck('home')}>QuizMaker</button>
      <button onClick={() => goToTranscribe()}>TransCriber</button>
      <button onClick={() => goToNotes()}>Notes</button>
    </div>
  );
};

export default Home;
