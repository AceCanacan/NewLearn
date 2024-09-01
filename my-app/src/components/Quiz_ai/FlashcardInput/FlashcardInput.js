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
  const { deckName, setDeckName } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isEditingDeck, setIsEditingDeck] = useState(false);
  const [totalFlashcardsCreated, setTotalFlashcardsCreated] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [originalDeckName, setOriginalDeckName] = useState("");

  const handleDeckNameChange = (event) => {
    setDeckName(event.target.value);
  };

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
    if (user && editIndex === null) {
      setShowDisclaimer(true);
    } else if (user && editIndex !== null) {
      handleConfirmSave();
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (
      user &&
      window.confirm(
        "Are you sure you want to delete this flashcard? This action cannot be undone."
      )
    ) {
      const newFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(newFlashcards);
      saveDeckFlashcards(user.uid, deckName, newFlashcards);
    }
  };



  const handleDeleteDeck = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this deck? This action cannot be undone."
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
        `You have already created ${totalFlashcardsCreated} flashcards in this deck. You cannot create more.`
      );
      return;
    }
    const newFlashcards = [...flashcards, { question: "", answer: "" }];
    setFlashcards(newFlashcards);
    setEditIndex(newFlashcards.length - 1);
    setShowDisclaimer(true);
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
    
    if (field === "question") {
      newFlashcards[index].question = value;
    } else if (field === "answer") {
      newFlashcards[index].answer = value;
    } else if (field === "description") {
      newFlashcards[index].description = value;
    }
  
    setFlashcards(newFlashcards);
  };
  
  return (
    <div class="screen-border-container">
      <button className="st-back-button" onClick={() => navigate("/deck/home")}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className="flashcard-input-container">
        <div className="flashcard-input-title-bar">
          <h3 className="flashcard-input-title">
            {isEditingDeck ? (
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="flashcard-input-deck-name"
              />
            ) : (
              newDeckName
            )}
          </h3>
          <div className="title-bar-buttons">
            {isEditingDeck && (
              <button
                onClick={handleDeleteDeck}
                className="edit-icon-button"
                style={{ color: "red" }}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
            <button
              onClick={() => setIsEditingDeck(!isEditingDeck)}
              className={`edit-icon-button ${isEditingDeck ? "enabled" : ""}`}
            >
              <i className={`fas ${isEditingDeck ? "fa-check" : "fa-pen"}`}></i>
            </button>
          </div>
        </div>

        {showDisclaimer && (
          <div className="flashcard-input-disclaimer-modal">
            <div className="flashcard-input-disclaimer-content">
              <h3>Disclaimer</h3>
              <p>
                You are about to save {flashcards.length} flashcards in this
                deck. The maximum allowed is {MAX_FLASHCARDS}. Remember, this is
                an alpha version and every flashcard you create is permanent and
                cannot be erased. Choose wisely as your actions have lasting
                consequences.
              </p>
              <div className="flashcard-input-disclaimer-buttons">
                <button
                  onClick={handleConfirmSave}
                  className="flashcard-button flashcard-button-primary"
                >
                  Confirm Add
                </button>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="flashcard-button flashcard-button-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flashcard-button-row">
          <Link to={`/test/${deckName}`}>
            <button
              onClick={handleTestYourself}
              className="flashcard-button flashcard-button-secondary"
            >
              Test
            </button>
          </Link>
          <Link to={`/review/${deckName}`}>
            <button className="flashcard-button flashcard-button-secondary">
              Review
            </button>
          </Link>
          <Link to={`/score-report/${deckName}`}>
            <button className="flashcard-button flashcard-button-secondary">
              View Scores
            </button>
          </Link>
          <Link
            to={`/quizmaker/${deckName}`}
            onClick={(e) => {
              if (localStorage.getItem(`${deckName}-generated`) === "true") {
                e.preventDefault(); // Prevent navigation
                alert(
                  "You have already used the QuizMaker feature for this deck."
                );
              }
            }}
          >
            <button className="flashcard-button flashcard-button-secondary">
              QuizMaker
            </button>
          </Link>
        </div>
        <hr className="lowkey-divider" />
        <button
          className="flashcard-input-add-button"
          onClick={handleAddFlashcard}
        >
          + Add Flashcard
        </button>



        <div className="flashcard-input-list">
  {flashcards.map((flashcard, index) => (
    <div key={index} className="flashcard-input-item">
      <div className="flashcard-input-content">
        <div className="flashcard-input-question">
          <label>Question</label>
          {editIndex === index ? (
  <>
    <input
      type="text"
      value={flashcard.question}
      onChange={(e) =>
        handleInputChange(index, "question", e.target.value)
      }
      className="flashcard-input-question-input"
    />
    <input
      type="text"
      placeholder="Add a short description"
      value={flashcard.description || ""}
      onChange={(e) =>
        handleInputChange(index, "description", e.target.value)
      }
      className="flashcard-input-description-input"
    />
  </>
) : (
  <>
    <p className="flashcard-input-question-text">
      {flashcard.question}
    </p>
    <p className="flashcard-input-description-text">
      {flashcard.description}
    </p>
  </>
)}
        </div>
        <div className="flashcard-input-vertical-line"></div>
        <div className="flashcard-input-answer">
          <label>Answer</label>
          {editIndex === index ? (
            <input
              type="text"
              value={flashcard.answer}
              onChange={(e) =>
                handleInputChange(index, "answer", e.target.value)
              }
              className="flashcard-input-answer-input"
            />
          ) : (
            <p className="flashcard-input-answer-text">
              {flashcard.answer}
            </p>
          )}
        </div>
        <div className="flashcard-input-buttons">
          <button
            onClick={() => {
              if (editIndex === index) {
                handleSave(); // Save the changes
              } else {
                handleEdit(index); // Enter edit mode
              }
            }}
            className={`edit-icon-button ${
              editIndex === index ? "enabled" : ""
            }`}
          >
            <i
              className={`fas ${
                editIndex === index ? "fa-check" : "fa-pen"
              }`}
            ></i>
          </button>

          {editIndex === index && (
            <button
              onClick={() => handleDelete(index)}
              className="edit-icon-button"
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  ))}
</div>

      </div>
    </div>
  );
}

export default FlashcardInput;
