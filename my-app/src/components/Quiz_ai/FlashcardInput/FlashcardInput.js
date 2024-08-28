import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { setDoc, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";
import "./FlashcardInput.css";

// Utility functions for Firestore operations
const loadFromFirestore = async (docPath, defaultValue) => {
  try {
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return defaultValue;
    }
  } catch (error) {
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, docPath);
    await setDoc(docRef, value);
  } catch (error) {}
};

const removeFromFirestore = async (docPath) => {
  try {
    const docRef = doc(db, docPath);
    await deleteDoc(docRef);
  } catch (error) {}
};

const loadDeckFlashcards = async (userId, deckName) => {
  const docPath = `users/${userId}/decks/${deckName}`;
  const deckData = await loadFromFirestore(docPath, { flashcards: [] });
  const flashcards = deckData.flashcards || [];
  return flashcards;
};

const saveDeckFlashcards = async (userId, deckName, flashcards) => {
  const deckData = { flashcards };
  await saveToFirestore(`users/${userId}/decks/${deckName}`, deckData);
};

const removeDeckFlashcards = async (userId, deckName) => {
  await removeFromFirestore(`users/${userId}/decks/${deckName}`);
};

function FlashcardInput() {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [totalFlashcardsCreated, setTotalFlashcardsCreated] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const MAX_FLASHCARDS = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTotalFlashcardsCreated(currentUser.uid, deckName);
      } else {
        setUser(null);
        setTotalFlashcardsCreated(0);
      }
    });

    return () => unsubscribe();
  }, [deckName]);

  const fetchTotalFlashcardsCreated = async (userId, deckName) => {
    const deckDocRef = doc(db, "users", userId, "decks", deckName);
    const deckDoc = await getDoc(deckDocRef);
    if (deckDoc.exists()) {
      setTotalFlashcardsCreated(deckDoc.data().totalFlashcardsCreated || 0);
    } else {
      await setDoc(deckDocRef, { totalFlashcardsCreated: 0 }, { merge: true });
    }
  };

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (user) {
        const storedFlashcards = await loadDeckFlashcards(user.uid, deckName);
        setFlashcards(storedFlashcards);
      }
    };

    if (user) {
      fetchFlashcards();
    }
  }, [deckName, user]);

  const handleTestYourself = async () => {
    await saveToFirestore("settings", `${deckName}-shuffled`, {
      shuffled: flashcards,
    });
    await saveToFirestore("settings", `${deckName}-currentIndex`, {
      currentIndex: 0,
    });
    navigate(`/test/${deckName}`);
  };

  const handleSave = () => {
    if (user) {
      setShowDisclaimer(true);
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (
      user &&
      window.confirm(
        "Are you sure you want to delete this flashcard? This action cannot be undone.",
      )
    ) {
      const newFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(newFlashcards);
      saveDeckFlashcards(user.uid, deckName, newFlashcards);
    }
  };

  const handleRenameDeck = async () => {
    if (newDeckName && newDeckName !== deckName && user) {
      const flashcards = await loadDeckFlashcards(user.uid, deckName);
      await removeDeckFlashcards(user.uid, deckName);
      await saveDeckFlashcards(user.uid, newDeckName, flashcards);
      setIsEditingDeck(false);
      navigate(`/deck/${newDeckName}`);
    }
  };

  const handleDeleteDeck = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this deck? This action cannot be undone.",
      ) &&
      user
    ) {
      await removeDeckFlashcards(user.uid, deckName);
      navigate("/");
    }
  };

  const handleAddFlashcard = () => {
    if (totalFlashcardsCreated >= MAX_FLASHCARDS) {
      alert(
        `You have already created ${totalFlashcardsCreated} flashcards in this deck. You cannot create more.`,
      );
      return;
    }
    const newFlashcards = [...flashcards, { question: "", answer: "" }];
    setFlashcards(newFlashcards);
    setEditIndex(newFlashcards.length - 1);
  };

  const handleConfirmSave = async () => {
    if (user) {
      await saveDeckFlashcards(user.uid, deckName, flashcards);
      setEditIndex(null);

      // Update total flashcards created for this deck
      const deckDocRef = doc(db, "users", user.uid, "decks", deckName);
      const newTotal = flashcards.length;
      await updateDoc(deckDocRef, { totalFlashcardsCreated: newTotal });
      setTotalFlashcardsCreated(newTotal);

      setIsEditingDeck(false);
      setShowDisclaimer(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
    // Remove the saveDeckFlashcards call from here
  };

  return (
    <div className="flashcard-input">
      <h3>
        {isEditingDeck ? (
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
          />
        ) : (
          newDeckName
        )}
      </h3>
      <button onClick={() => navigate("/deck/home")}>Back</button>

      <div className="deck-actions">
        <button
          onClick={
            isEditingDeck ? handleRenameDeck : () => setIsEditingDeck(true)
          }
        >
          {isEditingDeck ? "Save" : "Edit Deck"}
        </button>
        {isEditingDeck && (
          <>
            <button onClick={handleDeleteDeck}>Delete Deck</button>
            <button onClick={() => setIsEditingDeck(false)}>Cancel</button>
          </>
        )}
      </div>
      {showDisclaimer && (
        <div className="disclaimer-modal">
          <div className="disclaimer-content">
            <h3>Disclaimer</h3>
            <p>
              You are about to save {flashcards.length} flashcards in this deck.
              The maximum allowed is {MAX_FLASHCARDS}. Remember, this is an
              alpha version and every flashcard you create is permanent and
              cannot be erased. Choose wisely as your actions have lasting
              consequences.
            </p>
            <div className="disclaimer-buttons">
              <button onClick={handleConfirmSave}>Confirm Save</button>
              <button onClick={() => setShowDisclaimer(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <>
        <Link to={`/test/${deckName}`} className="test-link">
          <button onClick={handleTestYourself}>Test Yourself</button>
        </Link>
        <Link to={`/review/${deckName}`} className="test-link">
          <button>Review</button>
        </Link>
        <Link to={`/score-report/${deckName}`} className="test-link">
          <button>View Scores</button>
        </Link>
        <button
          className="test-link"
          onClick={() => {
            if (localStorage.getItem(`${deckName}-generated`) === "true") {
              alert(
                "You have already used the QuizMaker feature for this deck.",
              );
            } else {
              navigate(`/quizmaker/${deckName}`);
            }
          }}
        >
          Go to QuizMaker
        </button>
      </>

      <div className="flashcard-list">
        {flashcards.map((flashcard, index) => (
          <div key={index} className="flashcard">
            <div className="flashcard-content">
              <div className="flashcard-question">
                <label>Question</label>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={flashcard.question}
                    onChange={(e) =>
                      handleInputChange(index, "question", e.target.value)
                    }
                  />
                ) : (
                  <p>{flashcard.question}</p>
                )}
              </div>
              <div className="vertical-line"></div>
              <div className="flashcard-answer">
                <label>Answer</label>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={flashcard.answer}
                    onChange={(e) =>
                      handleInputChange(index, "answer", e.target.value)
                    }
                  />
                ) : (
                  <p>{flashcard.answer}</p>
                )}
              </div>
              <div className="flashcard-buttons">
                <button
                  className="edit-button"
                  onClick={() => {
                    if (editIndex === index) {
                      handleSave();
                    } else {
                      handleEdit(index);
                    }
                  }}
                >
                  {editIndex === index ? "Save" : "Edit"}
                </button>
                {editIndex === index && (
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="add-button" onClick={handleAddFlashcard}>
        + Add Flashcard
      </button>
    </div>
  );
}

export default FlashcardInput;
