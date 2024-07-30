// src/components/Home/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const goToDeck = (deckName) => {
    navigate(`/deck/${deckName}`);
  };

  const goToTranscribe = (deckName) => {
    navigate(`/transcribe`);
  };

  return (
    <div>
      <h1>Home</h1>
      <button onClick={() => goToDeck('math')}>QuizMaker</button>
      <button onClick={() => goToTranscribe()}>TransCriber</button>
    </div>
  );
};

export default Home;
