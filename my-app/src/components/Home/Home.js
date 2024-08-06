import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0); // Start with the first card
  const [slideDirection, setSlideDirection] = useState('');

  const cards = [
    { title: "Quiz Maker", description: "Automatically create and evaluate personalized quizzes with dynamic questions", route: "/deck/home" },
    { title: "Transcriber", description: "Convert audio recordings into text automatically", route: "/savedtranscriptions" },
    { title: "Notes", description: "Save and organize your notes efficiently", route: "/savednotes" }
  ];

  const goToCard = (index) => {
    const route = cards[index].route;
    navigate(route);
  };


  

  const scrollCarousel = (direction) => {
    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = (currentIndex - 1 + cards.length) % cards.length;
      setSlideDirection('left');
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % cards.length;
      setSlideDirection('right');
    }
  
    setTimeout(() => {
      setSlideDirection('');
      setCurrentIndex(newIndex);
      sessionStorage.setItem('currentIndex', newIndex); // Save currentIndex to session storage
    }, 500);
  };
  
  useEffect(() => {
    const savedIndex = sessionStorage.getItem('currentIndex');
    if (savedIndex !== null) {
      setCurrentIndex(parseInt(savedIndex, 10));
    }
  }, []);
  
  return (
    <div className="home-container">
        <div className="homepage-card-carousel-nav-container">
            <div className="homepage-card-carousel">
            <div className="homepage-card empty left-card"></div>
                <div className={`homepage-card ${slideDirection}`} key={currentIndex} onClick={() => goToCard(currentIndex)}>
                    <h2>{cards[currentIndex].title}</h2>
                    <p>{cards[currentIndex].description}</p>
                </div>
                
            </div>
            <div className="homepage-carousel-nav">
                <button className="homepage-nav-button" onClick={() => scrollCarousel('prev')}>&#9664;</button>
                <button className="homepage-nav-button" onClick={() => scrollCarousel('next')}>&#9654;</button>
            </div>
        </div>
    </div>
);


  
};

export default Home;
