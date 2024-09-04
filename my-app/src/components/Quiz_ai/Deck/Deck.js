import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Deck.css";

function Deck() {
  const [decks, setDecks] = useState({});
  const [user, setUser] = useState(null);
  const [totalCardsCreated, setTotalCardsCreated] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const navigate = useNavigate();
  const [newDeckDescription, setNewDeckDescription] = useState("");

  const MAX_CARDS = 25;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTotalCardsCreated(currentUser.uid);
      } else {
        setUser(null);
        setTotalCardsCreated(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTotalCardsCreated = async (userId) => {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setTotalCardsCreated(userDoc.data().totalCardsCreated || 0);
    } else {
      await setDoc(userDocRef, { totalCardsCreated: 0 });
    }
  };

  useEffect(() => {
    const fetchDecks = async () => {
      if (user) {
        console.log("Fetching decks for user:", user.uid);
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};
  
        decksSnapshot.forEach((deckDoc) => {
          const data = deckDoc.data();
          console.log("Data cards:", data.cards); // Add this line for debugging
          const numCards = Array.isArray(data.flashcards) ? data.flashcards.length : 0;
          console.log("Number of cards in deck", deckDoc.id, ":", numCards);
  
          const description = data.description || "No description";
          decksData[deckDoc.id] = { numCards, description };
        });
  
        console.log("All decks data:", decksData);
        setDecks(decksData);
      }
    };
  
    fetchDecks();
  }, [user]);
  
  

  const saveDeck = async (deckName, deckDescription) => {
    if (!decks[deckName] && user) {
      const newDecks = {
        ...decks,
        [deckName]: { numCards: 0, description: deckDescription },
      };
      setDecks(newDecks);
  
      try {
        await setDoc(doc(db, `users/${user.uid}/decks`, deckName), {
          cards: [],
          description: deckDescription,
        });
        console.log(
          "Deck saved with name:",
          deckName,
          "and description:",
          deckDescription
        );
  
        const userDocRef = doc(db, "users", user.uid);
        const newTotal = totalCardsCreated + 1;
        await updateDoc(userDocRef, { totalCardsCreated: newTotal });
  
        setTotalCardsCreated(newTotal);
  
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};
  
        decksSnapshot.forEach((doc) => {
          const data = doc.data();
          const numCards = Array.isArray(data.cards) ? data.cards.length : 0;
          const description = data.description || "No description";
          decksData[doc.id] = { numCards, description };
        });
        setDecks(decksData);
      } catch (error) {
      }
    } else {
    }
  };

  const handleCreateNewDeck = () => {
    if (totalCardsCreated >= MAX_CARDS) {
      alert(
        `You have already created ${totalCardsCreated} cards. You cannot create more.`
      );
      return;
    }
    setShowDisclaimer(true);
  };

  const handleConfirmNewDeck = async () => {
    if (newDeckName && user) {
      await saveDeck(newDeckName, newDeckDescription);
      setShowDisclaimer(false);
      setNewDeckName("");
      setNewDeckDescription(""); // Clear the description after saving
    }
  };

  return (
    <div>
      <div className="st-squircle-banner">Convert images and audio to text</div>
      <button className="st-back-button" onClick={() => navigate("/")}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className="deck-main-container">
        <div className="deck-app-container">
          <header className="deck-app-header"></header>
          <main className="deck-main-content">
            <section className="deck-recent-decks">
              <ul className="deck-grid">
                {Object.entries(decks).map(
                  ([deckName, { numCards, description }]) => (
                    <li key={deckName} className="deck-card">
                      <Link
                        to={`/deck/${deckName}/flashcard-input`}
                        className="deck-card-link"
                      >
                        <h3 className="deck-card-title">{deckName}</h3>
                        <p className="deck-card-description-view">{description}</p>
                        <hr className="deck-card-divider" />
                        <p className="deck-card-count">{numCards} cards</p>
                      </Link>
                    </li>
                  )
                )}
                <li
                  className="deck-card deck-add-card"
                  onClick={handleCreateNewDeck}
                >
                  <div className="deck-add-icon">+</div>
                  <span className="deck-add-text">Create New Deck</span>
                </li>
              </ul>
            </section>
          </main>

          {showDisclaimer && (
            <div className="deck-modal-overlay">
              <div className="deck-modal-content">
                <h3>Create New Deck</h3>
                <p>
                  You have created {totalCardsCreated} out of {MAX_CARDS}{" "}
                  maximum allowed cards. This action cannot be undone. Are you
                  sure you want to continue?
                </p>
                <p className="deck-modal-description">
                  Please enter a unique name and a brief description for your
                  new deck. This will help you organize your flashcards better.
                </p>
                <input
                  type="text"
                  placeholder="Enter deck name"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="deck-input"
                />

                <input
                  type="text"
                  placeholder="Enter deck description"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  className="deck-input"
                />

                <div className="deck-modal-actions">
                  <button
                    className="deck-confirm-button"
                    onClick={handleConfirmNewDeck}
                  >
                    Create Deck
                  </button>
                  <button
                    className="deck-cancel-button"
                    onClick={() => setShowDisclaimer(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Deck;
