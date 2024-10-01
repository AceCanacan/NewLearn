import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./transcribe.css";
import { useNavigate } from "react-router-dom";

import { setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { saveToFirestore } from "../../firebase/firebase";

function Transcribe() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [result, setResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileValid, setIsFileValid] = useState(false);
  const [error, setError] = useState("");
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const navigate = useNavigate();
  const [showSaveDisclaimer, setShowSaveDisclaimer] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [user, setUser] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setGenerationCount(userDoc.data().generationCount || 0);
        }
      }
    };
    fetchData();
    console.log("API Key:", process.env.REACT_APP_OPENAI_API_KEY);
  }, []);

  const validFileTypes = ["image/png", "image/jpeg", "audio/mpeg"];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileType = selectedFile.type.split("/")[0];
      setFileType(fileType);
      setIsFileValid(
        validFileTypes.includes(selectedFile.type) &&
          selectedFile.size <= 2 * 1024 * 1024
      );
      setError("");
    } else {
      setFile(null);
      setFileType("");
      setIsFileValid(false);
      setError("Please select a file.");
    }
  };

  const handleUpload = async () => {
    if (generationCount >= 15) {
      alert("You have reached the maximum number of generations.");
      return;
    }
  
    alert(
      `You have ${
        3 - generationCount
      } transcriptions left. This action cannot be undone.`
    );
  
    setIsProcessing(true);
    setError("");
    try {
      let transcribedText = "";
  
      if (fileType === "image") {
        transcribedText = await processImage(file);
      } else if (fileType === "audio") {
        transcribedText = await processAudio(file);
      }
  
      const organizedText = await organizeText(transcribedText);
      setResult(organizedText);
  
      // Fetch the current user's document
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        let currentCount = userDoc.data().generationCount || 0;
  
        // Update the generation count in Firestore
        await updateDoc(userDocRef, { generationCount: currentCount + 1 });
        setGenerationCount(currentCount + 1);
      } else {
        setError("User document does not exist.");
      }
    } catch (error) {
      console.error("Error during processing:", error);
  
      // Check for specific error types related to API keys
      if (error.message.includes("invalid key") || error.message.includes("Invalid API key")) {
        setError("The provided API key is invalid. Please check your key and try again.");
      } else if (
        error.message.includes("no key") ||
        error.message.includes("missing key") ||
        error.message.includes("No API key provided")
      ) {
        setError("No API key provided. Please provide a valid API key to proceed.");
      } else {
        setError(`An error occurred during processing: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileType("");
    setResult("");
    setIsFileValid(false);
    setError("");
  };

  const processAudio = async (file) => {
    return await transcribeAudio(file);
  };

  const processImage = async (file) => {
    try {
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(fileData).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
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
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "What's in this image?" },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          }),
        }
      );

      const data = await response.json();

      if (
        data.choices &&
        data.choices.length > 0 &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        return data.choices[0].message.content;
      } else if (data.error) {
        console.error("API returned an error:", data.error);
        throw new Error(data.error.message);
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      console.error("Error details:", error.message);
      throw error;
    }
  };

  const transcribeAudio = async (audioFile) => {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");

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

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", responseData);
        throw new Error(
          `API request failed with status ${response.status}: ${JSON.stringify(
            responseData
          )}`
        );
      }

      return responseData.text;
    } catch (error) {
      console.error("Error during audio transcription:", error);
      throw error;
    }
  };

  const organizeText = async (text) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that organizes text.",
          },
          {
            role: "user",
            content: `Organize the following text: ${text}`,
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleDeleteClick = () => {
    setShowDisclaimer(true); // Show the disclaimer when the delete button is clicked
  };

  const confirmDelete = () => {
    setResult(""); // Clear the transcription result
    setShowDisclaimer(false); // Hide the disclaimer
    handleReset();
  };

  const cancelDelete = () => {
    setShowDisclaimer(false); // Hide the disclaimer without deleting
  };

  const handleSaveClick = () => {
    setShowSaveDisclaimer(true); // Show the save disclaimer
  };

  const confirmSave = async () => {
    console.log("confirmSave: Initiating save process.");

    const currentUser = auth.currentUser;
    console.log("confirmSave: Current user:", currentUser);

    if (currentUser && saveName) {
      console.log("confirmSave: Save name provided:", saveName);

      // Upload the image to Firebase Storage
      let imageUrl = "";
      if (fileType === "image" && file) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `images/${currentUser.uid}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      const userDocPath = `users/${currentUser.uid}/transcriptions/${saveName}`;
      console.log("confirmSave: Document path constructed:", userDocPath);

      const newTranscription = {
        id: Date.now(),
        title: saveName || `Transcription ${generationCount + 1}`,
        text: result,
        imageUrl: imageUrl, // Save the image URL in Firestore
      };

      setSavedTranscriptions([...savedTranscriptions, newTranscription]);

      await saveToFirestore(userDocPath, newTranscription);

      handleReset();

      setShowSaveDisclaimer(false);

      navigate("/savedtranscriptions");
    } else {
      console.error("confirmSave: Missing currentUser or saveName.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileChange({ target: { files: [file] } });
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div>
      <button
        className="rt-back-button"
        onClick={() => navigate("/savedtranscriptions")}
      >
        &#9664;
      </button>

      <div className="transcribe-result-upload-wrapper">
        <div className="st-squircle-banner">
          Convert images and audio to text
        </div>
        {!file && !result && (
          <div
            className="transcribe-result-upload-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="transcribe-result-arrow-up-logo">
              <i className="fas fa-upload"></i>
            </div>
            <div className="transcribe-result-text">
              Drag and drop your audio file here
            </div>
            <button
              className="transcribe-result-upload-button"
              onClick={() => document.getElementById("fileInput").click()}
            >
              Select from Device
            </button>
            <input
              id="fileInput"
              type="file"
              accept=".png,.jpg,.jpeg,.mp3"
              onChange={handleFileChange}
              className="transcribe-result-hidden"
            />
            <div className="transcribe-result-drag-and-drop-text">
              MP3, WAV, M4A, MP4, MPEG, MPGA, WEBM
            </div>
          </div>
        )}

        {file && (
          <div className="transcribe-result-wrapper">
            <div className="transcribe-result-container">
              <div className="transcribe-result-preview">
                {fileType === "image" ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Uploaded file preview"
                    className="transcribe-result-uploaded-image"
                  />
                ) : (
                  <div className="transcribe-result-audio-logo">🎵</div>
                )}
              </div>
              {result ? (
                <div className="transcribe-result-transcription">
                  <h3>Transcription Result:</h3>
                  <ReactMarkdown className="transcribe-result-markdown-result">
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <button
                  className="transcribe-result-generate-button"
                  onClick={handleUpload}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Loading..." : "Generate"}
                </button>
              )}
            </div>

            {!result && (
              <button
                className="transcribe-result-upload-another-button"
                onClick={resetUpload}
                disabled={isProcessing}
              >
                Upload Another File
              </button>
            )}

            {result && (
              <div className="transcribe-result-buttons-container">
                <button onClick={handleSaveClick}>Save</button>
                <button onClick={handleDeleteClick}>Delete</button>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="transcribe-result-disclaimer-container">
            {showSaveDisclaimer && (
              <div className="transcribe-result-disclaimer-overlay">
                <div className="transcribe-result-disclaimer-content">
                  <p>Please provide a name for your transcription:</p>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter name"
                  />
                  <button onClick={confirmSave}>Save</button>
                  <button onClick={() => setShowSaveDisclaimer(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showDisclaimer && (
              <div className="transcribe-result-disclaimer-overlay">
                <div className="transcribe-result-disclaimer-content">
                  <p>
                    Are you sure you want to delete this transcription? This
                    action cannot be undone.
                  </p>
                  <button onClick={confirmDelete}>Yes, Delete</button>
                  <button onClick={cancelDelete}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="transcribe-result-error-text">{error}</p>}
      </div>
    </div>
  );
}

export default Transcribe;
