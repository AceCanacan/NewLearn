import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Test.css";
import { setDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase"; // Adjust the path as needed
import { onAuthStateChanged } from "firebase/auth";

// Utility functions for Firestore operations
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

const removeFromFirestore = async (docPath) => {
  try {
    const docRef = doc(db, ...docPath.split("/"));
    await deleteDoc(docRef);
    // console.log(`Document removed from Firestore: ${docPath}`);
  } catch (error) {
    // console.error(`Error removing document from Firestore: ${docPath}`, error);
  }
};

const Test = () => {
  const { deckName } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState("");
  const [hint, setHint] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [typingMode, setTypingMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbacks, setFeedbacks] = useState({});
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [hasFeedbackBeenProvided, setHasFeedbackBeenProvided] = useState(false);
  const [newAnswerProvided, setNewAnswerProvided] = useState(false);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState(
    new Set()
  );
  const [finished, setFinished] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");
  const [hintUsed, setHintUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showSaveProgressModal, setShowSaveProgressModal] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState({});
  const [feedbackButtonDisabled, setFeedbackButtonDisabled] = useState({});
  const [questionStates, setQuestionStates] = useState({});
  const [sendButtonDisabled, setSendButtonDisabled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // console.log('User signed in:', currentUser);
      } else {
        setUser(null);
        // console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = (suffix) =>
      `users/${user.uid}/settings/${deckName}-${suffix}`;

    const checkForProgress = async () => {
      const hasSeenProgressPrompt = localStorage.getItem(
        "hasSeenProgressPrompt"
      );

      if (!hasSeenProgressPrompt) {
        const storedProgress = await loadFromFirestore(
          docRef("progress"),
          null
        );
        if (storedProgress) {
          const userDecision = window.confirm(
            "Previous progress detected. Delete it and start over?"
          );
          if (userDecision) {
            // User chose to delete progress
            await deleteAllProgress();
            initializeNewTest();
          } else {
            // User chose to keep progress
            loadExistingProgress();
          }
        } else {
          // No progress, start a new test
          initializeNewTest();
        }
        localStorage.setItem("hasSeenProgressPrompt", "true"); // Set flag to avoid showing again
      } else {
        // If the prompt has already been shown, just load the progress
        loadExistingProgress();
      }
    };

    const deleteAllProgress = async () => {
      // Clear session storage
      sessionStorage.clear();

      // Clear all Firestore data related to this test
      const keysToRemove = [
        "progress",
        "currentIndex",
        "correctlyAnsweredQuestions",
        "correctAnswers",
        "hintUsed",
        "hint",
        "typedAnswer",
        "wasCorrect",
        "comparisonResult",
        "feedback",
        "showAnswer",
        "isRecording",
        "lastCorrectAnswer",
        "showFeedback",
        "isFeedbackLoading",
        "hasFeedbackBeenProvided",
        "newAnswerProvided",
        "finished",
        "typingMode",
        "score",
        "hintsUsed",
        "wrongAttempts",
        "feedbacks",
        "showFeedbacks",
        "feedbackButtonDisabled",
        "questionStates",
        "sendButtonDisabled",
      ];

      for (const key of keysToRemove) {
        await removeFromFirestore(
          `users/${user.uid}/settings`,
          `${deckName}-${key}`
        );
      }
    };

    const initializeNewTest = async () => {
      // Fetch fresh flashcards
      const freshFlashcards = await loadFromFirestore(
        `users/${user.uid}/decks/${deckName}`,
        { flashcards: [] }
      );

      // Set all state variables to their initial values
      setFlashcards(freshFlashcards.flashcards);
      setCurrentCardIndex(0);
      setCorrectlyAnsweredQuestions(new Set());
      setCorrectAnswers(0);
      setHintUsed(false);
      setHint("");
      setTypedAnswer("");
      setWasCorrect(false);
      setComparisonResult("");
      setFeedback("");
      setShowAnswer(false);
      setIsRecording(false);
      setLastCorrectAnswer("");
      setShowFeedback(false);
      setIsFeedbackLoading(false);
      setHasFeedbackBeenProvided(false);
      setNewAnswerProvided(false);
      setFinished(false);
      setTypingMode(false);
      setScore(0);
      setHintsUsed(0);
      setWrongAttempts(0);
      setFeedbacks({});
      setShowFeedbacks({});
      setFeedbackButtonDisabled({});
      setQuestionStates({});
      setSendButtonDisabled(false);
    };

    const loadExistingProgress = async () => {
      // Load progress from Firestore
      const progress = await loadFromFirestore(docRef("progress"), null);
      if (progress) {
        // Set all state variables from the stored progress
        setFlashcards(progress.flashcards);
        setCurrentCardIndex(progress.currentCardIndex);
        setCorrectlyAnsweredQuestions(
          new Set(progress.correctlyAnsweredQuestions)
        );
        setCorrectAnswers(progress.correctAnswers);
        setHintUsed(progress.hintUsed);
        setHint(progress.hint);
        setTypedAnswer(progress.typedAnswer);
        setWasCorrect(progress.wasCorrect);
        setComparisonResult(progress.comparisonResult);
        setFeedback(progress.feedback);
        setShowAnswer(progress.showAnswer);
        setIsRecording(progress.isRecording);
        setLastCorrectAnswer(progress.lastCorrectAnswer);
        setShowFeedback(progress.showFeedback);
        setIsFeedbackLoading(progress.isFeedbackLoading);
        setHasFeedbackBeenProvided(progress.hasFeedbackBeenProvided);
        setNewAnswerProvided(progress.newAnswerProvided);
        setFinished(progress.finished);
        setTypingMode(progress.typingMode);
        setScore(progress.score);
        setHintsUsed(progress.hintsUsed);
        setWrongAttempts(progress.wrongAttempts);
        setFeedbacks(progress.feedbacks);
        setShowFeedbacks(progress.showFeedbacks);
        setFeedbackButtonDisabled(progress.feedbackButtonDisabled);
        setQuestionStates(progress.questionStates);
        setSendButtonDisabled(progress.sendButtonDisabled);
      } else {
        // If no progress found, initialize a new test
        initializeNewTest();
      }
    };

    checkForProgress();
  }, [user, deckName]);

  const localStorageKeys = {
    currentCardIndex: 0,
    correctAnswers: 0,
    correctlyAnsweredQuestions: new Set(),
    hintUsed: false,
    typedAnswer: "",
    wasCorrect: false,
    comparisonResult: "",
    feedback: "",
    showAnswer: false,
    isRecording: false,
    lastCorrectAnswer: "",
    showFeedback: false,
    isFeedbackLoading: false,
    hasFeedbackBeenProvided: false,
    newAnswerProvided: false,
    finished: false,
    typingMode: false,
    score: 0,
    hintsUsed: 0,
    wrongAttempts: 0,
    feedbackButtonDisabled: {},
    feedbacks: {},
    showFeedbacks: {},
    questionStates: {},
    sendButtonDisabled: false,
    testInProgress: false,
  };

  const dataToSave = {
    flashcards: flashcards,
    currentCardIndex,
    correctAnswers,
    correctlyAnsweredQuestions: [...correctlyAnsweredQuestions],
    hintUsed,
    typedAnswer,
    wasCorrect,
    comparisonResult,
    feedback,
    showAnswer,
    isRecording,
    lastCorrectAnswer,
    showFeedback,
    isFeedbackLoading,
    hasFeedbackBeenProvided,
    newAnswerProvided,
    finished,
    typingMode,
    score,
    hintsUsed,
    wrongAttempts,
    feedbackButtonDisabled,
    feedbacks,
    showFeedbacks,
    questionStates,
    sendButtonDisabled,
    testInProgress: true,
  };

  const saveProgress = async () => {
    // console.log("saveProgress called");

    try {
      // Save data to sessionStorage
      sessionStorage.setItem("progressData", JSON.stringify(dataToSave));
      // console.log("Progress saved to sessionStorage");

      if (user) {
        // console.log("This is what is being saved...");
        await saveToFirestore(
          `users/${user.uid}/settings/${deckName}-progress`,
          dataToSave
        );
        // console.log("Progress saved to Firestore");
      }
    } catch (error) {
      // console.error("Error saving progress:", error);
    }
  };

  const resetState = async () => {
    Object.keys(localStorageKeys).forEach(async (key) => {
      const setterFunction = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof window[setterFunction] === "function") {
        window[setterFunction](localStorageKeys[key]);
      }
    });

    await removeFromFirestore(
      `users/${user.uid}/settings/${deckName}-progress`
    );
  };

  const removeMultipleFromFirestore = async (deckName) => {
    await removeFromFirestore(
      `users/${user.uid}/settings/${deckName}-progress`
    );

    flashcards.forEach(async (_, index) => {
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-typedAnswer-${index}`
      );
    });
  };

  const updateQuestionStates = async (deckName, questionStates) => {
    await saveToFirestore(
      `users/${user.uid}/settings/${deckName}-questionStates`,
      questionStates
    );
  };

  const updateCorrectlyAnsweredQuestions = async (
    deckName,
    correctlyAnsweredQuestions
  ) => {
    await saveToFirestore(
      `users/${user.uid}/settings/${deckName}-correctlyAnsweredQuestions`,
      [...correctlyAnsweredQuestions]
    );
  };

  const loadTypedAnswer = async (deckName, index) => {
    const data = await loadFromFirestore(
      `users/${user.uid}/settings/${deckName}-typedAnswer-${index}`,
      { typedAnswer: "" }
    );
    return data.typedAnswer;
  };

  const saveProgressAndNavigate = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const progressData = sessionStorage.getItem("progressData");

    if (progressData) {
      const dataToSave = JSON.parse(progressData);

      try {
        // Save progress data to Firestore
        await setDoc(
          doc(db, `users/${user.uid}/settings/${deckName}-progress`),
          dataToSave
        );
        // console.log("Progress saved to Firestore");
      } catch (error) {
        console.error("Error saving progress to Firestore: ", error);
      }
    } else {
      // console.log("No progress data in sessionStorage");
    }

    // Save to session storage before navigating
    sessionStorage.setItem("progressData", JSON.stringify(dataToSave));

    // Navigate to the desired route
    navigate(`/deck/${deckName}`);
  };

  const wipeProgressAndNavigate = async () => {
    try {
      // Attempt to remove multiple items from Firestore
      await removeMultipleFromFirestore(deckName);

      // Check if shuffledFlashcards is defined and is an array
      if (Array.isArray(flashcards) && flashcards.length > 0) {
        for (let i = 0; i < flashcards.length; i++) {
          await removeFromFirestore(
            `users/${user.uid}/settings/${deckName}-typedAnswer-${i}`
          );
        }
      }

      // Navigate to the specified route
      navigate(`/deck/${deckName}`);
    } catch (error) {
      console.error("Error wiping progress and navigating:", error);
      // Handle the error (optional)
      navigate(`/deck/${deckName}`); // Ensure navigation happens even if there is an error
    }
  };

  const handleFinish = async () => {
    if (correctlyAnsweredQuestions.size === flashcards.length) {
      const finalScore = calculateFinalScore();
      const scoreEntry = {
        score: finalScore,
        date: new Date().toISOString(),
        report: {
          hintsUsed: report.hintsUsed,
          answersShown: report.answersShown,
          multipleAttempts: report.multipleAttempts,
          answeredPerfectly: report.answeredPerfectly,
        },
      };

      setFinished(true);

      // Save the final score with details
      const storedScores = await loadFromFirestore(
        `users/${user.uid}/settings/scores`,
        {}
      );
      const updatedScores = {
        ...storedScores,
        [deckName]: [...(storedScores[deckName] || []), scoreEntry],
      };
      await saveToFirestore(`users/${user.uid}/settings/scores`, updatedScores);

      // Clear related Firestore items
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-progress`
      );
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-typedAnswer-${currentCardIndex}`
      );

      generateReportContent();
    } else {
      alert(
        "You need to answer all questions correctly before finishing the test."
      );
    }
  };

  const questionKeysSliceIndices = {
    start: 8,
    end: 17,
  };

  const getSetterFunction = (key) =>
    `set${key.charAt(0).toUpperCase() + key.slice(1)}`;

  const resetKeys = (keys, state, defaultValues = {}) => {
    keys.forEach((key) => {
      const setterFunction = getSetterFunction(key);
      if (typeof window[setterFunction] === "function") {
        window[setterFunction](
          state
            ? state[key] || defaultValues[key] || ""
            : key in defaultValues
            ? defaultValues[key]
            : false
        );
      }
    });
  };

  const loadQuestionState = async (index) => {
    const state = questionStates[index];
    const questionKeys = Object.keys(localStorageKeys).slice(
      questionKeysSliceIndices.start,
      questionKeysSliceIndices.end
    );
    const defaultValues = { hintsUsed: 0, wrongAttempts: 0 };

    if (state) {
      resetKeys(questionKeys, state, defaultValues);
      setTypedAnswer(await loadTypedAnswer(deckName, index));
    } else {
      resetKeys(questionKeys, null, defaultValues);
      setTypedAnswer("");
    }
  };

  const preserveCurrentQuestionState = async () => {
    const currentQuestionState = {};
    const questionKeys = Object.keys(localStorageKeys).slice(
      questionKeysSliceIndices.start,
      questionKeysSliceIndices.end
    );

    questionKeys.forEach((key) => {
      currentQuestionState[key] = window[key];
    });

    const updatedQuestionStates = {
      ...questionStates,
      [currentCardIndex]: currentQuestionState,
    };
    setQuestionStates(updatedQuestionStates);
    await saveToFirestore(
      `users/${user.uid}/settings/${deckName}-questionStates`,
      updatedQuestionStates
    );
  };

  const retakeTest = async () => {
    await removeMultipleFromFirestore(deckName);

    flashcards.forEach(async (_, index) => {
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-typedAnswer-${index}`
      );
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-feedbackButtonDisabled-${index}`
      );
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-showFeedbacks-${index}`
      );
      await removeFromFirestore(
        `users/${user.uid}/settings/${deckName}-questionStates-${index}`
      );
    });

    resetState();
    setFlashcards([]);

    const storedFlashcards = await loadFromFirestore(
      `users/${user.uid}/decks/${deckName}`,
      []
    );
    setFlashcards(storedFlashcards);

    setTimeout(() => {
      resetState();
      setLastCorrectAnswer("");
    }, 0);

    await saveProgress();
    setCurrentCardIndex(0);
    await loadQuestionState(0);
  };

  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^
  // with backend ^^^^

  const [report, setReport] = useState({
    hintsUsed: 0,
    answersShown: 0,
    multipleAttempts: 0,
    answeredPerfectly: 0,
  });

  const HINT_DEDUCTION = 25;
  const WRONG_ATTEMPT_DEDUCTION = 10;

  const navigateToCard = async (index) => {
    // Preserve the current question state
    await preserveCurrentQuestionState();

    // Save progress to session storage
    sessionStorage.setItem("progressData", JSON.stringify(dataToSave));

    // Set the new current card index and load the question state
    setCurrentCardIndex(index);
    await loadQuestionState(index);
    setTypedAnswer(await loadTypedAnswer(deckName, index));
    setWasCorrect(false); // Reset wasCorrect state
    setComparisonResult(""); // Reset comparisonResult state

    // Save progress
    saveProgress();
  };

  const compareQuestion = async (userQuestion) => {
    if (!flashcards[currentCardIndex]) {
      console.error("Flashcard not found for current index:", currentCardIndex);
      return;
    }
    const originalQuestion = flashcards[currentCardIndex].question;
    const originalAnswer = flashcards[currentCardIndex].answer;
    const userAnswer = typingMode ? typedAnswer : userQuestion;

    const messages = [
      {
        role: "system",
        content:
          'You are a helpful assistant. You will be provided with an original question, its correct answer, and a user-provided answer. Your task is to determine if the user-provided answer is correct. Answer strictly with "yes" or "no".',
      },
      { role: "user", content: `Original Question: ${originalQuestion}` },
      { role: "user", content: `Original Answer: ${originalAnswer}` },
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
            model: "gpt-4o",
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

      const currentQuestionState = questionStates[currentCardIndex] || {
        attempts: 0,
        correct: false,
        hintUsed: false,
        skipped: false,
        multipleAttempts: false,
        firstAttemptIncorrect: false,
      };
      const isFirstAttempt = currentQuestionState.attempts === 0;
      const isFirstAttemptIncorrect = isFirstAttempt && result === "no";

      const updatedQuestionState = {
        ...currentQuestionState,
        attempts: currentQuestionState.attempts + 1,
        correct: result === "yes",
        hintUsed: false,
        hint: "",
        multipleAttempts: currentQuestionState.attempts > 0 || result === "no",
        firstAttemptIncorrect:
          isFirstAttemptIncorrect || currentQuestionState.firstAttemptIncorrect,
      };

      setQuestionStates((prevStates) => {
        const updatedStates = {
          ...prevStates,
          [currentCardIndex]: updatedQuestionState,
        };

        updateQuestionStates(deckName, updatedStates);
        return updatedStates;
      });

      if (result === "yes") {
        setCorrectlyAnsweredQuestions((prevQuestions) => {
          const updatedQuestions = new Set(prevQuestions).add(currentCardIndex);
          updateCorrectlyAnsweredQuestions(deckName, updatedQuestions);
          saveProgress(); // Add this line
          return updatedQuestions;
        });

        updateScore(true);
        setComparisonResult("Correct");
        setWasCorrect(true);
        setNewAnswerProvided(true);
        setHasFeedbackBeenProvided((prev) => ({
          ...prev,
          [currentCardIndex]: false,
        }));
        setLastCorrectAnswer(userAnswer);

        setReport((prevReport) => {
          const updatedReport = { ...prevReport };
          if (!updatedQuestionState.firstAttemptIncorrect) {
            updatedReport.answeredPerfectly += 1;
          }
          return updatedReport;
        });

        setSendButtonDisabled((prev) => ({
          ...prev,
          [currentCardIndex]: true,
        }));

        setHintUsed(false);
        setHint("");
      } else {
        updateScore(false);
        setComparisonResult("Incorrect");

        setReport((prevReport) => ({
          ...prevReport,
          multipleAttempts:
            currentQuestionState.attempts === 0
              ? prevReport.multipleAttempts + 1
              : prevReport.multipleAttempts,
        }));
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setIsLoading(false);
      saveProgress(); // Ensure this captures the latest state after all updates
    }
  };

  const handleShowAnswer = () => {
    if (!showAnswer) {
      setShowAnswer(true);
      updateScore(false);
      setCorrectlyAnsweredQuestions((prev) =>
        new Set(prev).add(currentCardIndex)
      );

      setQuestionStates((prevStates) => {
        const updatedStates = {
          ...prevStates,
          [currentCardIndex]: {
            ...prevStates[currentCardIndex],
            skipped: true,
            showAnswer: true,
          },
        };
        updateQuestionStates(deckName, updatedStates);
        return updatedStates;
      });

      setReport((prevReport) => ({
        ...prevReport,
        answersShown: prevReport.answersShown + 1,
      }));

      saveProgress();
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
            model: "gpt-4o",
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
        setHintsUsed((prevHintsUsed) => prevHintsUsed + 1);

        setQuestionStates((prevStates) => {
          const updatedStates = {
            ...prevStates,
            [currentCardIndex]: {
              ...prevStates[currentCardIndex],
              hintUsed: true,
              hint: newHint,
              firstAttemptIncorrect: true,
            },
          };
          updateQuestionStates(deckName, updatedStates);
          return updatedStates;
        });

        setReport((prevReport) => ({
          ...prevReport,
          hintsUsed: prevReport.hintsUsed + 1,
        }));
      } else {
        setHint("Error: No response from model");
      }
    } catch (error) {
      setHint(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      saveProgress();
    }
  };

  const generateReportContent = () => (
    <>
      <p>Hints Used: {report.hintsUsed}</p>
      <p>Answers Shown: {report.answersShown}</p>
      <p>Multiple Attempts: {report.multipleAttempts}</p>
      <p>Perfectly Answered: {report.answeredPerfectly}</p>
    </>
  );

  const handleDone = () => {
    setShowSaveProgressModal(true);
  };

  const calculateScoreForCurrentQuestion = () => {
    const deduction =
      (hintUsed ? HINT_DEDUCTION : 0) + wrongAttempts * WRONG_ATTEMPT_DEDUCTION;
    return Math.max(100 - deduction, 0);
  };

  const calculateFinalScore = () => {
    const totalScore = flashcards.length * 100;
    return Math.min((score / totalScore) * 100, 100);
  };

  const updateScore = (isCorrect) => {
    if (isCorrect) {
      if (!correctlyAnsweredQuestions.has(currentCardIndex)) {
        const currentQuestionScore = calculateScoreForCurrentQuestion();
        setScore((prevScore) => prevScore + currentQuestionScore);
        setCorrectAnswers((prevCorrectAnswers) => prevCorrectAnswers + 1);
      }
    } else {
      setWrongAttempts((prevWrongAttempts) => prevWrongAttempts + 1);
    }
  };

  const handleNextCard = () => {
    preserveCurrentQuestionState();
    let nextIndex = currentCardIndex;

    do {
      nextIndex = (nextIndex + 1) % flashcards.length;
    } while (
      correctlyAnsweredQuestions.has(nextIndex) &&
      nextIndex !== currentCardIndex
    );

    setCurrentCardIndex(nextIndex);
    loadQuestionState(nextIndex);
    setWasCorrect(false); // Reset wasCorrect state
    setComparisonResult(""); // Reset comparisonResult state
    saveProgress();
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
        tracks.forEach((track) => track.stop()); // Stop all tracks
        setIsRecording(false); // Update recording state
        setMediaRecorder(null); // Reset mediaRecorder
        setIsLoading(true);
        saveProgress();
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

    // Log the transcription to the console
    console.log("Transcription:", data.text);

    // Instead of comparing, set the transcription into the typedAnswer
    setTypedAnswer(data.text);
  } catch (error) {
    setComparisonResult(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
    saveProgress();
  }
};


  useEffect(() => {
    // console.log("Question States:", questionStates);
    // console.log("Report:", report);
  }, [questionStates, report]);

  const renderSendButton = () => (
    <button
      className="send-button"
      onClick={() => {
        setIsLoading(true);
        compareQuestion(typedAnswer).finally(() => setIsLoading(false));
      }}
      disabled={
        sendButtonDisabled[currentCardIndex] ||
        !(typedAnswer && typedAnswer.trim && typedAnswer.trim()) ||
        isLoading
      }
    >
      {isLoading ? "Loading..." : "Send"}
    </button>
  );

  const provideFeedback = async () => {
    if (feedbackButtonDisabled[currentCardIndex]) {
      return;
    }

    setIsFeedbackLoading(true);

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `Original Question: ${flashcards[currentCardIndex].question}`,
      },
      {
        role: "user",
        content: `Original Answer: ${flashcards[currentCardIndex].answer}`,
      },
      {
        role: "user",
        content:
          "The user's answer was correct. Provide praise and suggestions for improvement.",
      },
      { role: "user", content: `User's Correct Answer: ${lastCorrectAnswer}` },
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
            model: "gpt-4o",
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
      const newFeedback = data.choices[0].message.content.trim();

      setFeedbacks((prev) => ({
        ...prev,
        [currentCardIndex]: newFeedback,
      }));
      setShowFeedbacks((prev) => ({
        ...prev,
        [currentCardIndex]: true,
      }));
      setFeedbackButtonDisabled((prev) => ({
        ...prev,
        [currentCardIndex]: true,
      }));
      setHasFeedbackBeenProvided((prev) => ({
        ...prev,
        [currentCardIndex]: true,
      }));
    } catch (error) {
      setFeedbacks((prev) => ({
        ...prev,
        [currentCardIndex]: `Error: ${error.message}`,
      }));
    } finally {
      setIsFeedbackLoading(false);
      saveProgress();
    }
  };

  const NavigationBar = ({ totalCards, currentCardIndex, navigateToCard }) => (
    <div className="navigation-bar">
      {Array.from({ length: totalCards }).map((_, index) => (
        <button
          key={index}
          className={`nav-button ${index === currentCardIndex ? "active" : ""}`}
          onClick={() => navigateToCard(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );

  return (
    <div className="test-yourself">
      <NavigationBar
        totalCards={flashcards.length}
        currentCardIndex={currentCardIndex}
        navigateToCard={navigateToCard}
      />
      
      <h3>{deckName}</h3>
      {!finished && (
        <button className="btn btn-secondary" onClick={handleDone}>
          Done
        </button>
      )}
      {isLoading ? (
        <p>Loading flashcards...</p>
      ) : flashcards.length > 0 && currentCardIndex < flashcards.length ? (
        finished ? (
          <div className="completion-message">
            <h2>Way to go! You've reviewed all {flashcards.length} cards.</h2>
            <div className="score-display">{generateReportContent()}</div>
            <div className="final-score">
              <h2>Final Score: {calculateFinalScore().toFixed(2)}%</h2>
              <button className="btn btn-primary" onClick={retakeTest}>
                Retake Test
              </button>
              <button
                className="btn btn-secondary"
                onClick={wipeProgressAndNavigate}
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          
          <>
            <div className="comparison-result">
              <p>
                <strong>Result:</strong>{" "}
                {comparisonResult === "Correct" &&
                questionStates[currentCardIndex]?.skipped
                  ? "Correct (Skipped)"
                  : comparisonResult}
              </p>
              {questionStates[currentCardIndex]?.skipped && (
                <p>
                  <em>
                    Note: This question was skipped, and the result does not
                    count towards your score.
                  </em>
                </p>
              )}
              {(showAnswer ||
                wasCorrect ||
                correctlyAnsweredQuestions.has(currentCardIndex)) && (
                <>
                  {currentCardIndex < flashcards.length - 1 ? (
                    <button
                      className="btn btn-primary"
                      onClick={handleNextCard}
                    >
                      Next
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={handleFinish}>
                      Finish
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowFeedbacks((prev) => ({
                        ...prev,
                        [currentCardIndex]: true,
                      }));
                      provideFeedback();
                    }}
                    disabled={
                      isFeedbackLoading ||
                      (feedbackButtonDisabled[currentCardIndex] &&
                        hasFeedbackBeenProvided[currentCardIndex])
                    }
                  >
                    {isFeedbackLoading ? "Loading..." : "Get Feedback"}
                  </button>
                  {showFeedbacks[currentCardIndex] &&
                    feedbacks[currentCardIndex] && (
                      <div className="feedback-modal">
                        <p>{feedbacks[currentCardIndex]}</p>
                      </div>
                    )}
                </>
              )}
            </div>

            <div className="flashcard">
              <p>
                <strong>Q:</strong> {flashcards[currentCardIndex].question}
              </p>
              {showAnswer && (
                <p>
                  <strong>A:</strong> {flashcards[currentCardIndex].answer}
                </p>
              )}

              {(hint || questionStates[currentCardIndex]?.hint) && (
                <p className="hint">
                  <strong>Hint:</strong>{" "}
                  {hint || questionStates[currentCardIndex]?.hint}
                </p>
              )}
            </div>

            <div className="flashcard-buttons">
              <div className="flashcard-answer-container">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => {
                    setTypedAnswer(e.target.value);
                  }}
                  placeholder="Type your answer here"
                />
              </div>

              {renderSendButton()}

              <button
                className={`btn ${isRecording ? "btn-danger" : "btn-primary"}`}
                onClick={isRecording ? finishRecording : startRecording}
                disabled={isLoading} // Disable the button if loading
              >
                {isRecording ? "Recording..." : "Start Recording"}
              </button>

              {comparisonResult === "Incorrect" &&
                !isRecording &&
                !isLoading && (
                  <button className="btn btn-primary" onClick={startRecording}>
                    Try Again
                  </button>
                )}
            </div>





            
            {isLoading && <p>Loading...</p>}
            {comparisonResult !== "Correct" && !showAnswer && (
              <button
                className="btn btn-secondary"
                onClick={getHint}
                disabled={
                  hintUsed || questionStates[currentCardIndex]?.hintUsed
                }
              >
                Get Hint
              </button>
            )}
            <button className="btn btn-warning" onClick={handleShowAnswer}>
              Show Answer
            </button>


            <div className="progress-tracker">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${
                      (correctlyAnsweredQuestions.size / flashcards.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p>
                {correctlyAnsweredQuestions.size} out of {flashcards.length}{" "}
                completed
              </p>
            </div>
          </>
        )
      ) : (
        <p>No flashcards available in this deck.</p>
      )}
      {showSaveProgressModal && (
        <div className="modal">
          <div className="modal-content">
            <p>Are you sure you want to leave?</p>
            <button
              className="btn btn-primary"
              onClick={saveProgressAndNavigate}
            >
              Leave and Save
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setShowSaveProgressModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
