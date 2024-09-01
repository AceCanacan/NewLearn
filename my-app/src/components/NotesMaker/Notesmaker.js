import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "./Notesmaker.css";

import { setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";

const saveToFirestore = async (docPath, value) => {
  try {
    const docRef = doc(db, ...docPath.split("/"));
    await setDoc(docRef, value, { merge: true }); // Ensure merging to avoid overwriting the entire document
  } catch (error) {
    console.error("Error saving to Firestore:", error);
  }
};

const NotesMaker = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [customSuggestions, setCustomSuggestions] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [user, setUser] = useState(null);
  const [popupContent, setPopupContent] = useState("");
  const [showSaveDisclaimer, setShowSaveDisclaimer] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().notesGenerationCount >= 3) {
          alert("You have reached the maximum number of generations.");
          // Disable the generate button or take necessary action
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGenerate = async () => {
    if (!user) {
      alert("You need to be signed in to generate notes.");
      return;
    }

    if (!inputText.trim()) {
      alert("Please enter some text.");
      return;
    }

    if (!confirmed) {
      alert("Please confirm your suggestions first.");
      return;
    }

    setIsLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let notesGenerationCount = 0;

      if (userDoc.exists()) {
        notesGenerationCount = userDoc.data().notesGenerationCount || 0;
      }

      if (notesGenerationCount >= 3) {
        alert("You have reached the maximum number of notes generations.");
        setIsLoading(false);
        return;
      }

      const remainingGenerations = 3 - notesGenerationCount;
      const userConfirmed = window.confirm(
        `You have ${remainingGenerations} notes generations left. Do you want to proceed with generating notes?`
      );

      if (!userConfirmed) {
        setIsLoading(false);
        return;
      }

      // Combine AI-generated and custom suggestions
      const allSuggestions = [
        ...suggestions.filter((suggestion) =>
          selectedSuggestions.has(suggestion.id)
        ),
        ...customSuggestions.filter((suggestion) =>
          selectedSuggestions.has(suggestion.id)
        ),
      ];
      const finalPrompt = allSuggestions
        .map((suggestion) => suggestion.text)
        .join(" ");

      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Given this text: "${inputText}". Please create organized notes from the provided text.`,
        },
        {
          role: "user",
          content: `Include these suggestions: ${finalPrompt} when creating the notes.`,
        },
      ];

      console.log("Messages:", messages); // Log the messages array

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 300,
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
        const notes = data.choices[0].message.content.trim();
        setPopupContent(notes);
      } else {
        alert("Failed to generate notes. Please try again.");
      }

      await updateDoc(userDocRef, {
        notesGenerationCount: notesGenerationCount + 1,
      });
    } catch (error) {
      console.error("Error generating notes:", error);
      alert("Error generating notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text.");
      return;
    }

    setIsLoading(true);

    // Split the input text into sentences
    const sentences = inputText
      .split(".")
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence);

    // Randomize sentences and always include the first two to three sentences
    const shuffledSentences = sentences.sort(() => 0.5 - Math.random());
    const randomSentences = shuffledSentences.slice(0, 4);

    // Combine first two sentences with random sentences
    const selectedSentences = [
      sentences[0],
      sentences[1],
      ...(sentences[2] ? [sentences[2]] : []),
      ...randomSentences,
    ].slice(0, 4);

    const prompt = selectedSentences.join(" ");

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `Here is some text: "${prompt}". This information will be used to create organized notes. Provide four detailed and varied suggestions on how to create these notes based on this content. 
                
          Examples of suggestions:
          1. Make it bulleted.
          2. Organize it in chronological order to show cause and effect.

          Maximum 4 words each suggestion
          
          The output should be formatted as follows:
          1. [Suggestion 1]
          2. [Suggestion 2]
          
          Maximum 4 words each suggestion
          Maximum 4 words each suggestion
          Maximum 4 words each suggestion
          `,
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
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 150,
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
        const suggestionsText = data.choices[0].message.content.trim();
        const suggestionPattern = /\d\.\s*(.*?)(?=\n|$)/g;
        let match;
        const generatedSuggestions = [];
        let index = 0;

        while ((match = suggestionPattern.exec(suggestionsText)) !== null) {
          generatedSuggestions.push({
            id: index,
            text: match[1].trim(),
          });
          index++;
        }

        // Log each suggestion individually for debugging
        generatedSuggestions.forEach((suggestion, idx) => {});

        setSuggestions(generatedSuggestions);
        setConfirmed(true);
      } else {
        alert("Failed to generate suggestions. Please try again.");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Error generating suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async (title, notes) => {
    const uniqueId = Date.now().toString();
    const newNote = {
      id: uniqueId,
      title: title || `Note ${uniqueId}`,
      text: notes,
    };

    try {
      const user = auth.currentUser;
      if (!user) return; // Ensure the user is authenticated
      const userDocPath = `users/${user.uid}/savedNotes/${uniqueId}`;
      await saveToFirestore(userDocPath, newNote); // Save under the user's directory
      console.log("Notes saved with ID:", uniqueId);
      handleReset();
    } catch (error) {
      console.error("Error saving note:", error);
    }
    navigate("/savednotes");
  };

  const deleteNotes = () => {
    setPopupContent("");
    setConfirmed(false);
    setInputText("");
    setSuggestions([]);
    setCustomSuggestions([]);
    setSelectedSuggestions(new Set());
    console.log("Notes deleted and state reverted.");
  };

  const toggleSuggestion = (id) => {
    setSelectedSuggestions((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const addCustomSuggestion = () => {
    if (!customInput.trim()) {
      return;
    }

    const newSuggestion = {
      id: suggestions.length + customSuggestions.length + 1, // Ensure unique ID
      text: customInput.trim(),
    };

    const updatedCustomSuggestions = [...customSuggestions, newSuggestion];
    setCustomSuggestions(updatedCustomSuggestions);

    const updatedSelectedSuggestions = new Set(selectedSuggestions);
    updatedSelectedSuggestions.add(newSuggestion.id);
    setSelectedSuggestions(updatedSelectedSuggestions); // Activate the new suggestion

    console.log("Custom suggestions:", updatedCustomSuggestions); // Log the updated suggestions
    setCustomInput(""); // Clear the input field
  };

  const removeCustomSuggestion = (id) => {
    setCustomSuggestions(
      customSuggestions.filter((suggestion) => suggestion.id !== id)
    );
    setSelectedSuggestions((prev) => {
      const newSelected = new Set(prev);
      newSelected.delete(id);
      return newSelected;
    });
  };

  const handleReset = () => {
    setInputText("");
    setIsLoading(false);
    setSuggestions([]);
    setCustomSuggestions([]);
    setCustomInput("");
    setSelectedSuggestions(new Set());
    setConfirmed(false);
    setPopupContent("");
  };

  const handleSaveClick = () => {
    setShowSaveDisclaimer(true);
  };

  const confirmSave = async () => {
    if (noteTitle) {
      await saveNotes(noteTitle, popupContent);
      setShowSaveDisclaimer(false);
    } else {
      alert("Please enter a title for your notes.");
    }
  };

  return (
    <>
      <div className="sn-squircle-banner">Generate notes with AI</div>
      <button
        className="rt-back-button"
        onClick={() => navigate("/savedtranscriptions")}
      >
        &#9664;
      </button>

      <div className="input-container">
        <textarea
          className="input-box"
          rows="5"
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
          placeholder="Enter the large body of text here..."
          disabled={confirmed}
          maxLength={1000}
        ></textarea>

        {!confirmed && (
          <button className="start-button" onClick={handleConfirm}>
            Start
          </button>
        )}
      </div>

      {confirmed && (
        <>
          <div className="suggestions-container">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`suggestion-box ${
                  selectedSuggestions.has(suggestion.id) ? "selected" : ""
                }`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                {suggestion.text}
              </div>
            ))}
            {customSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`suggestion-box ${
                  selectedSuggestions.has(suggestion.id) ? "selected" : ""
                }`}
                onClick={() => toggleSuggestion(suggestion.id)}
              >
                {suggestion.text}
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomSuggestion(suggestion.id);
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div className="custom-suggestions">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Add your own suggestion"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCustomSuggestion();
                }
              }}
              onFocus={(e) => (e.target.style.backgroundColor = "#E0F7FA")} // Light blue on focus
              onBlur={(e) => (e.target.style.backgroundColor = "#FFFFFF")} // White on blur
            />
          </div>

          <button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Questions"}
          </button>
        </>
      )}

      {showSaveDisclaimer && (
        <div className="sn-disclaimer-overlay">
          <div className="sn-disclaimer-content">
            <p>Please provide a title for your notes:</p>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter title"
            />
            <button onClick={confirmSave}>Save</button>
            <button onClick={() => setShowSaveDisclaimer(false)}>Cancel</button>
          </div>
        </div>
      )}
      {popupContent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>{popupContent}</p>
            <button className="modal-save-button" onClick={handleSaveClick}>
              Save
            </button>
            <button className="modal-delete-button" onClick={deleteNotes}>
              Deletee
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NotesMaker;
