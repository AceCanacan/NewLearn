import React, { useState, useEffect } from "react";
import "./pdf_reader_styles.css";

const PDFReader = () => {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const API_KEY =
    "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";

  console.log("API Key in component:", API_KEY); // Log the API key

  const handleFileChange = (e) => {
    console.log("File selected:", e.target.files[0]);
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    console.log("Attempting file upload");
    console.log("API Key before upload:", API_KEY); // Log the API key before upload
    if (!file) {
      console.log("No file selected");
      setUploadStatus("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setProgress("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Sending file upload request");
      console.log("Headers being sent:", {
        "X-Api-Key": API_KEY,
      });
      const res = await fetch("http://localhost:8002/upload", {
        method: "POST",
        body: formData,
        headers: {
          "X-Api-Key": API_KEY,
        },
      });

      console.log("Upload response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Upload response data:", data);
      setUploadStatus(data.message);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Error uploading file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Setting up EventSource");
    const eventSource = new EventSource("http://localhost:8002/progress");
    eventSource.onmessage = (event) => {
      console.log("Progress update:", event.data);
      setProgress(event.data);
    };
    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
    };
    return () => {
      console.log("Closing EventSource");
      eventSource.close();
    };
  }, []);

  const handleQueryChange = (e) => {
    console.log("Query changed:", e.target.value);
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting query:", query);
    console.log("Current state before query:", { query, response, isLoading });

    try {
      console.log("Setting loading state...");
      setIsLoading(true);

      console.log("Preparing fetch request...");
      console.log("URL:", "http://localhost:8002/query");
      console.log("Headers:", {
        "Content-Type": "application/json",
      });
      console.log("Body:", JSON.stringify({ question: query }));

      console.log("Sending query request...");
      const res = await fetch("http://localhost:8002/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: query }),
      });

      console.log("Query response received");
      console.log("Response status:", res.status);
      console.log("Response OK:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response text:", errorText);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      console.log("Parsing JSON response...");
      const data = await res.json();
      console.log("Parsed response data:", data);

      console.log("Setting response in state...");
      setResponse(data.answer);
    } catch (error) {
      console.error("Error details:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } finally {
      console.log("Resetting loading state...");
      setIsLoading(false);
      console.log("Final state after query:", { query, response, isLoading });
    }
  };

  return (
    <div className="pdf-reader-container">
      {isLoading && (
        <div className="modal">
          <div className="modal-content">
            <h3>Processing PDF</h3>
            <p>{progress}</p>
          </div>
        </div>
      )}
      <h2 className="pdf-reader-title">PDF Underscore Reader</h2>

      {!uploadStatus && (
        <form className="pdf-reader-form" onSubmit={handleFileUpload}>
          <div>
            <label className="pdf-reader-label" htmlFor="file">
              Upload PDF:
            </label>
            <input
              className="pdf-reader-input"
              type="file"
              id="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
          </div>
          <button className="pdf-reader-button" type="submit">
            Upload PDF
          </button>
        </form>
      )}

      {uploadStatus && (
        <div className="pdf-reader-status-container">
          <p className="pdf-reader-status">{uploadStatus}</p>
          {!uploadStatus.includes("successfully") && (
            <button
              className="pdf-reader-button"
              onClick={() => {
                setUploadStatus("");
                setFile(null);
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {uploadStatus && uploadStatus.includes("successfully") && (
        <>
          <form className="pdf-reader-form" onSubmit={handleQuerySubmit}>
            <div>
              <label className="pdf-reader-label" htmlFor="query">
                Enter your query:
              </label>
              <input
                className="pdf-reader-input"
                type="text"
                id="query"
                value={query}
                onChange={handleQueryChange}
                required
              />
            </div>
            <button className="pdf-reader-button" type="submit">
              Submit Query
            </button>
          </form>
          {response && (
            <div className="pdf-reader-response">
              <h3 className="pdf-reader-response-title">Response:</h3>
              <p className="pdf-reader-response-text">{response}</p>
            </div>
          )}
          <button
            className="pdf-reader-button"
            onClick={() => {
              setUploadStatus("");
              setFile(null);
              setQuery("");
              setResponse("");
            }}
          >
            Upload New PDF
          </button>
        </>
      )}
    </div>
  );
};

export default PDFReader;
