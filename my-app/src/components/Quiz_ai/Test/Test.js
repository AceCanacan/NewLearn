import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Test.css";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";
import TestResults from "./TestResults"; // Import the new component

const loadFromFirestore = async (docPath, defaultValue) => {
  try {
    const docRef = doc(db, ...docPath.split("/"));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return defaultValue;
    }
  } catch (error) {
    console.error(
      `Error loading data from Firestore document: ${docPath}`,
      error
    );
    return defaultValue;
  }
};

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split("/"));
    await setDoc(docRef, value);
  } catch (error) {}
};

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hint, setHint] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [hintUsage, setHintUsage] = useState([]);
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [typedAnswers, setTypedAnswers] = useState([]);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [user, setUser] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchFlashcards = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const storedFlashcards = await loadFromFirestore(
        `users/${user.uid}/decks/${deckName}`,
        []
      );
      setFlashcards(storedFlashcards.flashcards || []);
    };
    fetchFlashcards();
  }, [user, deckName]);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex < flashcards.length - 1 ? prevIndex + 1 : prevIndex
    );
    setShowAnswer(false);
    setHint("");
    setHintUsed(false);
  };

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
    setShowAnswer(false);
    setHint("");
    setHintUsed(false);
  };

  const handleShowAnswer = () => {
    if (!showAnswer) {
      setShowAnswer(true);
      setSkippedQuestions((prev) => [...prev, currentCardIndex]);
    }
  };

  const getHint = async () => {
    if (hintUsed) return;

    setIsLoading(true);
    setHint("");
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: `Original Question: ${originalQuestion}` },
      { role: "user", content: `Original Answer: ${originalAnswer}` },
      {
        role: "user",
        content:
          "Provide a hint that will help the user get closer to the answer but does not directly reveal it.",
      },
    ];

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: messages,
            max_tokens: 50,
          }),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(
          `Error: ${response.status} ${response.statusText} - ${JSON.stringify(
            errorDetail
          )}`
        );
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const newHint = data.choices[0].message.content.trim();
        setHint(newHint);
        setHintUsed(true);
        const newHintUsage = [...hintUsage];
        newHintUsage[currentCardIndex] = true;
        setHintUsage(newHintUsage);
      } else {
        setHint("Error: No response from model");
      }
    } catch (error) {
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      const audioBlob = event.data;
      processRecording(audioBlob);
    };

    recorder.start();
  };

  const finishRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        const tracks = mediaRecorder.stream.getTracks();
        tracks.forEach((track) => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
        setIsLoading(true);
      };
      mediaRecorder.stop();
    }
  };

  const processRecording = async (audioBlob) => {
    const formData = new FormData();
    formData.append("model", "whisper-1");
    formData.append(
      "file",
      new Blob([audioBlob], { type: "audio/mp3" }),
      "audio/mp3"
    );

    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(
          `Error: ${response.status} ${response.statusText} - ${JSON.stringify(
            errorDetail
          )}`
        );
      }

      const data = await response.json();

      const newTypedAnswers = [...typedAnswers];
      newTypedAnswers[currentCardIndex] = data.text;
      setTypedAnswers(newTypedAnswers);
    } catch (error) {
      console.error("Error processing recording: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const compareAnswer = async (question, correctAnswer, userAnswer) => {
    const messages = [
      {
        role: "system",
        content:
          'You are a helpful assistant. You will be provided with an original question, its correct answer, and a user-provided answer. Your task is to determine if the user-provided answer is correct. Answer strictly with "yes" or "no".',
      },
      { role: "user", content: `Original Question: ${question}` },
      { role: "user", content: `Original Answer: ${correctAnswer}` },
      { role: "user", content: `User Answer: ${userAnswer}` },
      {
        role: "user",
        content:
          'Does the user-provided answer correctly answer the original question? Answer strictly "yes" or "no".',
      },
    ];

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: messages,
            max_tokens: 10,
          }),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(
          `Error: ${response.status} ${response.statusText} - ${JSON.stringify(
            errorDetail
          )}`
        );
      }

      const data = await response.json();
      const choice = data.choices[0];
      const result = choice.message.content
        .trim()
        .replace(".", "")
        .toLowerCase();

      return { correct: result === "yes" };
    } catch (error) {
      console.error("Error fetching data: ", error);
      return { correct: false, error: error.message };
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    const newResults = [];
    for (let i = 0; i < flashcards.length; i++) {
      const userAnswer = typedAnswers[i] || "";
      const correctAnswer = flashcards[i].answer;
      const question = flashcards[i].question;
      const hintUsedForQuestion = hintUsage[i] || false;
      let result = { correct: false, score: 0 };

      if (skippedQuestions.includes(i) || showAnswer) {
        result.skipped = true;
        result.correct = false;
        result.score = 0;
      } else {
        result = await compareAnswer(question, correctAnswer, userAnswer);
        if (result.correct) {
          result.score = hintUsedForQuestion ? 0.5 : 1;
        } else {
          result.score = 0;
        }
      }

      newResults.push({
        questionIndex: i,
        correct: result.correct,
        userAnswer,
        correctAnswer,
        hintUsed: hintUsedForQuestion,
        skipped: result.skipped || false,
      });
    }

    setIsLoading(false);
    const score =
      (newResults.filter((r) => r.correct).length / flashcards.length) * 100;

    if (user) {
      const scoreEntry = {
        date: new Date().toISOString(),
        score: score,
        testResult: {
          results: newResults,
          flashcards,
          deckName,
        },
      };

      // **Corrected Code Starts Here**
      try {
        // Step 1: Load existing scores
        const currentScoresData = await loadFromFirestore(
          `users/${user.uid}/settings/scores`,
          {}
        );

        // Step 2: Access the scores for the specific deck, or initialize as empty array
        const deckScores = currentScoresData[deckName] || [];

        // Step 3: Append the new scoreEntry
        const updatedDeckScores = [...deckScores, scoreEntry];

        // Step 4: Save the updated scores back to Firestore
        await saveToFirestore(`users/${user.uid}/settings/scores`, {
          ...currentScoresData, // Preserve scores for other decks
          [deckName]: updatedDeckScores, // Update scores for the current deck
        });
      } catch (error) {
        console.error("Error saving score to Firestore:", error);
        // Optionally, handle the error (e.g., show a notification to the user)
      }
      // **Corrected Code Ends Here**
    }

    setResults(newResults);
    setFinished(true);
  };

  const retakeTest = () => {
    setCurrentCardIndex(0);
    setIsRecording(false);
    setIsLoading(false);
    setShowAnswer(false);
    setHint("");
    setHintUsed(false);
    setHintUsage([]);
    setSkippedQuestions([]);
    setTypedAnswers([]);
    setResults([]);
    setFinished(false);
  };

  return (
    <div className="test-component">
      <div className="test-container">
        {showCardModal && (
          <div className="modal">
            <div className="modal-content">
              {flashcards.map((_, index) => (
                <button
                  key={index}
                  className={`nav-button ${
                    index === currentCardIndex ? "active" : ""
                  }`}
                  onClick={() => {
                    setCurrentCardIndex(index);
                    setShowCardModal(false);
                  }}
                >
                  {index + 1}
                </button>
              ))}
              <button
                className="btn btn-danger"
                onClick={() => setShowCardModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p>Loading...</p>
        ) : finished ? (
          <TestResults
            results={results}
            flashcards={flashcards}
            onRetake={retakeTest}
            deckName={deckName}
          />
        ) : (
          <>
            <div className="question-status-row">
              <p className="question-status">
                <strong>Question {currentCardIndex + 1}:</strong>
              </p>
              <button
                onClick={() => setShowCardModal(true)}
                className="circular-button"
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
            <button
              className="st-back-button"
              onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
            >
              <i className="fas fa-arrow-left"></i>
            </button>

            <div className="flashcard">
              <p>
                <strong>Q:</strong> {flashcards[currentCardIndex]?.question}
              </p>

              {showHintModal && (
                <div className="modal">
                  <div className="modal-content">
                    <p className="hint">
                      <strong>Hint:</strong> {hint}
                    </p>
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowHintModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="answer-container">
              <div className="flashcard-answer-input">
                <input
                  type="text"
                  value={typedAnswers[currentCardIndex] || ""}
                  onChange={(e) => {
                    const newTypedAnswers = [...typedAnswers];
                    newTypedAnswers[currentCardIndex] = e.target.value;
                    setTypedAnswers(newTypedAnswers);
                  }}
                  placeholder="Type your answer here"
                />
              </div>

              <div className="button-stack">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!hint) getHint();
                    setShowHintModal(true);
                  }}
                >
                  <i className="fas fa-question"></i>
                </button>

                <button
                  className={`btn ${
                    isRecording ? "btn-danger" : "btn-primary"
                  }`}
                  onClick={() => {
                    if (!isRecording) {
                      startRecording();
                    } else {
                      finishRecording();
                    }
                  }}
                >
                  {isRecording ? (
                    <i className="fas fa-stop"></i>
                  ) : (
                    <i className="fas fa-microphone"></i>
                  )}
                </button>
              </div>
            </div>

            <div className="navigation-buttons">
              <button
                className="circular-button"
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
              >
                <i className="fas fa-arrow-left"></i>
              </button>

              <button
                className="btn btn-warning"
                onClick={handleShowAnswer}
                disabled={showAnswer}
              >
                Show Answer
              </button>

              {currentCardIndex === flashcards.length - 1 ? (
                <button className="circular-button" onClick={handleFinish}>
                  <i className="fas fa-check"></i>
                </button>
              ) : (
                <button className="circular-button" onClick={handleNextCard}>
                  <i className="fas fa-arrow-right"></i>
                </button>
              )}
            </div>

            {showAnswer && (
              <div className="answer-display">
                <p>
                  <strong>Answer:</strong>{" "}
                  {flashcards[currentCardIndex]?.answer}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Test;
