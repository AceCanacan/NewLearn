import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa"; // Importing from react-icons

const PDFReader = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const API_KEY = `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`;

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
      setUploadStatus("Error processing query. Please try again.");
    } finally {
      console.log("Resetting loading state...");
      setIsLoading(false);
      console.log("Final state after query:", { query, response, isLoading });
    }
  };

  return (
    <Container className="my-4">
      <Card className="p-4 shadow-sm">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>PDF Underscore Reader</h2>
          </Card.Title>

          {isLoading && (
            <Modal show={isLoading} backdrop="static" keyboard={false} centered>
              <Modal.Header>
                <Modal.Title>Processing PDF</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                <Spinner animation="border" role="status" className="mb-3">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>{progress || "Please wait while we process your PDF."}</p>
              </Modal.Body>
            </Modal>
          )}

          {!uploadStatus && (
            <Form onSubmit={handleFileUpload}>
              <Form.Group controlId="file" className="mb-3">
                <Form.Label>Upload PDF</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="w-100"
              >
                Upload PDF
              </Button>
            </Form>
          )}

          {uploadStatus && (
            <Alert
              variant={uploadStatus.includes("successfully") ? "success" : "danger"}
              className="mt-4"
            >
              {uploadStatus}
            </Alert>
          )}

          {uploadStatus && uploadStatus.includes("successfully") && (
            <>
              <Form onSubmit={handleQuerySubmit} className="mt-4">
                <Form.Group controlId="query" className="mb-3">
                  <Form.Label>Enter your query:</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Type your question here..."
                    value={query}
                    onChange={handleQueryChange}
                    required
                  />
                </Form.Group>
                <Button
                  variant="success"
                  type="submit"
                  disabled={isLoading}
                  className="w-100"
                >
                  Submit Query
                </Button>
              </Form>

              {response && (
                <Card className="mt-4">
                  <Card.Header>Response</Card.Header>
                  <Card.Body>
                    <Card.Text>{response}</Card.Text>
                  </Card.Body>
                </Card>
              )}

              <Button
                variant="outline-primary"
                onClick={() => {
                  setUploadStatus("");
                  setFile(null);
                  setQuery("");
                  setResponse("");
                }}
                className="mt-3 w-100"
              >
                Upload New PDF
              </Button>
            </>
          )}

          {uploadStatus && !uploadStatus.includes("successfully") && (
            <Button
              variant="warning"
              onClick={() => {
                setUploadStatus("");
                setFile(null);
              }}
              className="mt-3 w-100"
            >
              Try Again
            </Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PDFReader;
