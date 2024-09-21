import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';  // Import the CSS file
import logo from '../../assets/NL_logo.png';  // Import the logo

const LandingPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/auth');
  };

  return (
    <div className="landing-container">
      <img src={logo} alt="NewLearn Logo" className="landing-logo" />  {/* Add logo here */}
      <h1 className="landing-main-heading">All in One Learning Platform</h1>
      <p className="landing-description">
        NewLearn is an <strong>all-in-one learning platform</strong> where AI helps you create quizzes, design flashcards, organize notes, and interact with PDFs, all through a flexible <strong>pay-as-you-go payment</strong>.
      </p>
      <button className="landing-start-button" onClick={handleStartClick}>START</button>
    </div>
  );
}

export default LandingPage;