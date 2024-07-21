import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db, auth, } from '../../firebase/firebase'; // Ensure this path is correct
import { onAuthStateChanged } from 'firebase/auth';import './Deck.css';

// Deck Component
function Deck() {
  const [decks, setDecks] = useState({});
  const [user, setUser] = useState(null);

  // Listen for auth state changes to get the current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log('User signed in:', currentUser);
      } else {
        setUser(null);
        console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch decks from Firestore when the component mounts and user is authenticated
  useEffect(() => {
    const fetchDecks = async () => {
      if (user) {
        console.log('Fetching decks for user:', user.uid);
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};
        decksSnapshot.forEach((doc) => {
          decksData[doc.id] = doc.data().cards || [];
        });
        console.log('Decks retrieved:', decksData);
        setDecks(decksData);
      }
    };

    fetchDecks();
  }, [user]);

  // Save deck to Firestore
  const saveDeck = async (deckName) => {
    if (!decks[deckName]) {
      const newDecks = { ...decks, [deckName]: [] };
      setDecks(newDecks);

      try {
        console.log('Saving new deck:', deckName);
        await setDoc(doc(db, `users/${user.uid}/decks`, deckName), { cards: [] });

        // Fetch the updated decks from Firestore
        console.log('Fetching updated decks after saving new deck');
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};
        decksSnapshot.forEach((doc) => {
          decksData[doc.id] = doc.data().cards || [];
        });
        console.log('Updated decks retrieved:', decksData);
        setDecks(decksData);
      } catch (error) {
        console.error('Error saving deck:', error);
      }
    } else {
      console.log('Deck already exists:', deckName);
    }
  };

  // Handle creating a new deck
  const handleCreateNewDeck = async () => {
    const newDeckName = prompt("Enter the name for the new deck:");
    if (newDeckName && user) {
      console.log('Creating new deck:', newDeckName);
      await saveDeck(newDeckName);
    }
  };

  return (
    <div className="deck-container">
      <h2>Recent</h2>
      <div className="deck-list">
        {Object.keys(decks).map((deckName) => (
          <Link to={`/deck/${deckName}`} key={deckName} className="deck">
            <h3>{deckName}</h3>
            <div className="deck-details">
              <span>{decks[deckName].length} terms</span>
            </div>
          </Link>
        ))}
      </div>
      <button className="create-deck-button" onClick={handleCreateNewDeck}>
        Create New Deck
      </button>
    </div>
  );
}

export default Deck;
