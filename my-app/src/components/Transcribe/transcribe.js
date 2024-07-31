import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function Transcribe() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileValid, setIsFileValid] = useState(false);
  const [error, setError] = useState('');

  const validFileTypes = ['image/png', 'image/jpeg', 'audio/mpeg'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const fileType = selectedFile.type.split('/')[0];
      setFileType(fileType);
      setIsFileValid(validFileTypes.includes(selectedFile.type) && selectedFile.size <= 5 * 1024 * 1024);
      setError('');
    } else {
      setIsFileValid(false);
      setError('Please select a file.');
    }
  };

const handleUpload = async () => {
  setIsProcessing(true);
  setError('');
  try {
    let transcribedText = '';

    console.log('Uploading file:', file);
    console.log('File type:', file.type);
    console.log('File name:', file.name);
    console.log('File size:', file.size);

    if (fileType === 'image') {
      transcribedText = await processImage(file);
    } else if (fileType === 'audio') {
      transcribedText = await processAudio(file);
    }

    const organizedText = await organizeText(transcribedText);
    setResult(organizedText);
  } catch (error) {
    console.error('Error during processing:', error);
    setError(`An error occurred during processing: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};


  const handleReset = () => {
    setFile(null);
    setFileType('');
    setResult('');
    setIsFileValid(false);
    setError('');
  };

  const processAudio = async (file) => {
    return await transcribeAudio(file);
  };

  const processImage = async (file) => {
    try {
      console.log("Starting image processing");
      
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      console.log("Image converted to base64");
  
      console.log("Sending request to OpenAI API");
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
          'Content-Type': 'application/json'
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
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });
  
      console.log("Received response from OpenAI API");
      const data = await response.json();
      console.log("API Response:", data);
  
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        console.log("Successfully extracted content from API response");
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
      console.log('Starting audio transcription process');
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
  
      console.log('FormData created:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
  
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`
        },
        body: formData
      });
  
      console.log('Response received from API:', response);
  
      const responseData = await response.json();
      console.log('Response JSON:', responseData);
  
      if (!response.ok) {
        console.error('Error response from API:', responseData);
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(responseData)}`);
      }
  
      return responseData.text;
    } catch (error) {
      console.error('Error during audio transcription:', error);
      throw error;
    }
  };
  
  

  const organizeText = async (text) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that organizes text."
          },
          {
            role: "user",
            content: `Organize the following text: ${text}`
          }
        ],
        max_tokens: 300
      })
    });
  
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const ResultContainer = ({ children }) => (
    <div style={{
      border: '1px solid #ddd',
      padding: '10px',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
      marginTop: '10px',
    }}>
      {children}
    </div>
  );

  return (
    <div>
      <h2>File Transcription</h2>
      {!result && (
        <>
          <input 
            type="file" 
            accept=".png,.jpg,.jpeg,.mp3" 
            onChange={handleFileChange} 
            disabled={isProcessing}
          />
          {file && !isFileValid && (
            <p style={{color: 'red'}}>
              File must be a valid type (PNG, JPEG, or MP3) and no larger than 5 MB.
            </p>
          )}
          <button 
            onClick={handleUpload} 
            disabled={isProcessing || !isFileValid}
            style={{marginTop: '10px', marginBottom: '10px'}}
          >
            {isProcessing ? 'Processing...' : 'Upload and Transcribe'}
          </button>
        </>
      )}
      {isProcessing && <p>Processing your file. Please wait...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {result && (
        <div>
  <ResultContainer>
  <ResultContainer>
    <h3>Transcription Result:</h3>
    <ReactMarkdown>{result}</ReactMarkdown>
    <button onClick={handleReset} style={{ marginTop: '10px' }}>Upload Another File</button>
  </ResultContainer>
  </ResultContainer>
        </div>
      )}
    </div>
  );
}

export default Transcribe;