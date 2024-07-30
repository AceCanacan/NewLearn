import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';


const ffmpeg = new FFmpeg({ log: true });

function Transcribe() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileValid, setIsFileValid] = useState(false);

  const validFileTypes = ['image/png', 'image/jpeg', 'video/mp4', 'audio/mpeg'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    const fileType = file.type.split('/')[0];
    setFileType(fileType);
    setIsFileValid(validFileTypes.includes(file.type) && file.size <= 2 * 1024 * 1024); // Check file type and size
  };
  

  const handleUpload = async () => {
    setIsProcessing(true);
    let transcribedText = '';

    if (fileType === 'image') {
      transcribedText = await processImage(file);
    } else if (fileType === 'video') {
      transcribedText = await processVideo(file);
    } else if (fileType === 'audio') {
      transcribedText = await processAudio(file);
    }

    const organizedText = await organizeText(transcribedText);
    setResult(organizedText);
    setIsProcessing(false);
  };


  const processVideo = async (file) => {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    await ffmpeg.run('-i', 'input.mp4', 'output.mp3');

    const data = ffmpeg.FS('readFile', 'output.mp3');
    const audioBlob = new Blob([data.buffer], { type: 'audio/mp3' });
    const audioFile = new File([audioBlob], 'output.mp3', { type: 'audio/mp3' });

    return await transcribeAudio(audioFile);
  };

  const fetchFile = async (file) => {
    return new Uint8Array(await file.arrayBuffer());
  };

  const processAudio = async (file) => {
    return await transcribeAudio(file);
  };

  const processImage = async (file) => {
    try {
      // Convert file to base64 string
      const fileData = await file.arrayBuffer();
      const base64Image = btoa(
        String.fromCharCode(...new Uint8Array(fileData))
      );
  
      // Make the API request
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
                { type: "text", text: "What’s in this image?" },
                { type: "image_url", image_url: `data:image/jpeg;base64,${base64Image}` }
              ]
            }
          ],
          max_tokens: 300
        })
      });
  
      // Process the API response
      const data = await response.json();
  
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  };
  
  
  
  

  const transcribeAudio = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch('https://api.openai.com/v1/whisper/asr', {
      method: 'POST',
      headers: {
        'Authorization': `sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    const data = await response.json();
    return data.text;
  };

  const organizeText = async (text) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `sk-proj-0rQJn442QsrpnAURUQfNT3BlbkFJ9U9wAI7IGP112CXY9v3f`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        prompt: `Organize the following text: ${text}`,
        max_tokens: 300
      })
    });

    const data = await response.json();
    return data.choices[0].text;
  };

  return (
    <div>
      <h3>Transcription Result:</h3>
      <input type="file" accept=".png,.jpg,.jpeg,.mp4,.mp3" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isProcessing || !isFileValid}>
        {isProcessing ? 'Processing...' : 'Upload and Transcribe'}
      </button>
      {result && (
        <div>
          <h3>Transcription Result:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default Transcribe;