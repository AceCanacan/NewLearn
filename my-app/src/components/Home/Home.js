import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase'; // Adjust paths as necessary
import { signOutUser } from '../../firebase/auth';

import quizmakerLogo from '../../assets/icons/quizmaker_logo.png';
import transcriberLogo from '../../assets/icons/transcriber_logo.png';
import notesmakerLogo from '../../assets/icons/notesmaker_logo.png';



const Home = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0); // Start with the first card
  const [slideDirection, setSlideDirection] = useState('');

  const cards = [
    { title: "Quiz Maker", description: "Automatically create  evaluate personalized quizzes", route: "/deck/home", logo: quizmakerLogo },
    { title: "Transcriber", description: "Convert audio recordings into text automatically", route: "/savedtranscriptions", logo: transcriberLogo },
    { title: "Notes", description: "Save and organize your notes efficiently", route: "/savednotes", logo: notesmakerLogo }
  ];
  

  const goToCard = (index) => {
    const route = cards[index].route;
    navigate(route);
  };

  useEffect(() => {
    const ensureUserDocument = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          let currentCount = userDoc.data().generationCount;
          if (currentCount === undefined) {
            console.log('generationCount is missing, initializing to 0.');
            await updateDoc(userDocRef, { generationCount: 0 });
          }
        } else {
          console.error('User document does not exist, creating a new document...');
          await setDoc(userDocRef, { generationCount: 0 });
        }
      }
    };

    ensureUserDocument();

    const savedIndex = sessionStorage.getItem('currentIndex');
    if (savedIndex !== null) {
      setCurrentIndex(parseInt(savedIndex, 10));
    }
  }, []);
  

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

  const handleLogout = async () => {
    try {
        await signOutUser();
        navigate('/'); // Redirect to the home page or login page after logout
    } catch (error) {
        console.error('Logout failed', error);
    }
};

  
  return (
    <div className="home-container">
        <button className="logout-button" onClick={handleLogout}>Logout</button> {/* Add this line */}
        <div className="homepage-card-carousel-nav-container">
            <div className="homepage-card-carousel">
                <div className="homepage-card empty left-card"></div>
                {cards.map((card, index) => (
                    index === currentIndex && (
                        <div
                            className={`homepage-card ${slideDirection}`}
                            key={index}
                            onClick={() => goToCard(index)}
                        >
                            <div className="card-content">
                                <h2>{card.title}</h2>
                                <p>{card.description}</p>
                                <div className="squircle">
                                    <img src={card.logo} alt="Logo" className="logo" />
                                </div>
                            </div>
                        </div>
                    )
                ))}
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
