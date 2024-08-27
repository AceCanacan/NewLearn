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

  const MAX_CARDS = 5;

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
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};

        for (const deckDoc of decksSnapshot.docs) {
          const data = deckDoc.data();
          const numCards = Array.isArray(data.flashcards)
            ? data.flashcards.length
            : 0;
          decksData[deckDoc.id] = numCards;
        }

        setDecks(decksData);
      }
    };

    fetchDecks();
  }, [user]);

  const saveDeck = async (deckName) => {
    if (!decks[deckName] && user) {
      const newDecks = { ...decks, [deckName]: 0 };
      setDecks(newDecks);

      try {
        await setDoc(doc(db, `users/${user.uid}/decks`, deckName), {
          cards: [],
        });

        // Update total cards created
        const userDocRef = doc(db, "users", user.uid);
        const newTotal = totalCardsCreated + 1;
        await updateDoc(userDocRef, { totalCardsCreated: newTotal });
        setTotalCardsCreated(newTotal);

        // Fetch updated decks
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};
        decksSnapshot.forEach((doc) => {
          const data = doc.data();
          const numCards = Array.isArray(data.cards) ? data.cards.length : 0;
          decksData[doc.id] = numCards;
        });
        setDecks(decksData);
      } catch (error) {
        console.error("Error saving deck:", error);
      }
    } else {
      console.log("Deck already exists:", deckName);
    }
  };

  const handleCreateNewDeck = () => {
    if (totalCardsCreated >= MAX_CARDS) {
      alert(
        `You have already created ${totalCardsCreated} cards. You cannot create more.`,
      );
      return;
    }
    setShowDisclaimer(true);
  };

  const handleConfirmNewDeck = async () => {
    if (newDeckName && user) {
      await saveDeck(newDeckName);
      setShowDisclaimer(false);
      setNewDeckName("");
    }
  };

  return (
    <div>
      <button className="st-back-button" onClick={() => navigate("/")}>
        <i className="fas fa-home"></i>
      </button>
      <div className="app-container">
        <header className="app-header">
          <h1>My Flashcards</h1>
        </header>

        <main className="main-content">
          <section className="recent-decks">
            <h2>Recent Decks</h2>
            <div className="deck-grid">
              {Object.entries(decks).map(([deckName, cardCount]) => (
                <Link
                  to={`/deck/${deckName}/flashcard-input`}
                  key={deckName}
                  className="deck-card"
                >
                  <h3>{deckName}</h3>
                  <span className="card-count">{cardCount} cards</span>
                </Link>
              ))}
            </div>
          </section>

          <button
            className="create-deck-button"
            onClick={handleCreateNewDeck}
            disabled={totalCardsCreated >= MAX_CARDS}
          >
            <i className="fas fa-plus"></i> Create New Deck
          </button>
        </main>

        {showDisclaimer && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create New Deck</h3>
              <p>
                You have created {totalCardsCreated} out of {MAX_CARDS} maximum
                allowed cards. This action cannot be undone. Are you sure you
                want to continue?
              </p>
              <input
                type="text"
                placeholder="Enter deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  className="confirm-button"
                  onClick={handleConfirmNewDeck}
                >
                  Create Deck
                </button>
                <button
                  className="cancel-button"
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
  );
}

export default Deck;
