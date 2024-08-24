import React, { useState, useEffect } from 'react';
import './pdf_reader_styles.css';

const PDFReader = () => {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

  useEffect(() => {
    console.log("API_KEY:", API_KEY); // Log the API key (be cautious with this in production)
  }, []);

  const handleFileChange = (e) => {
    console.log("File selected:", e.target.files[0]);
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    console.log("Attempting file upload");
    if (!file) {
        console.log("No file selected");
        setUploadStatus('Please select a file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log("Sending file upload request");
        const res = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Api-Key': API_KEY,
                // Don't set Content-Type header for FormData
            }
        });

        console.log("Upload response status:", res.status);
        if (!res.ok) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Upload response data:", data);
        setUploadStatus(data.message);
    } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('Error uploading file. Please try again.');
    }
};

  const handleQueryChange = (e) => {
    console.log("Query changed:", e.target.value);
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting query:", query);

    try {
        console.log("Sending query request");
        const res = await fetch('http://localhost:5000/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': API_KEY
            },
            body: JSON.stringify({ question: query })
        });

        console.log("Query response status:", res.status);
        if (!res.ok) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Query response data:", data);
        setResponse(data.answer);
    } catch (error) {
        console.error('Error querying the backend:', error);
        setResponse('There was an error processing your request.');
    }
};


  return (
    <div className="pdf-reader-container">
      <h2 className="pdf-reader-title">PDF Underscore Reader</h2>
      
      <form className="pdf-reader-form" onSubmit={handleFileUpload}>
        <div>
          <label className="pdf-reader-label" htmlFor="file">Upload PDF:</label>
          <input
            className="pdf-reader-input"
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>
        <button className="pdf-reader-button" type="submit">Upload PDF</button>
      </form>
      {uploadStatus && <p className="pdf-reader-status">{uploadStatus}</p>}

      <form className="pdf-reader-form" onSubmit={handleQuerySubmit}>
        <div>
          <label className="pdf-reader-label" htmlFor="query">Enter your query:</label>
          <input
            className="pdf-reader-input"
            type="text"
            id="query"
            value={query}
            onChange={handleQueryChange}
            required
          />
        </div>
        <button className="pdf-reader-button" type="submit">Submit Query</button>
      </form>
      {response && (
        <div className="pdf-reader-response">
          <h3 className="pdf-reader-response-title">Response:</h3>
          <p className="pdf-reader-response-text">{response}</p>
        </div>
      )}
    </div>
  );
};

export default PDFReader;
