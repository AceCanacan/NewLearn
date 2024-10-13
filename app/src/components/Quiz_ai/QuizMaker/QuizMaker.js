import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebase'; // Ensure this path is correct
import { onAuthStateChanged } from 'firebase/auth';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Spinner,
  Card,
  InputGroup,
  Modal,
} from 'react-bootstrap';

const QuizMaker = () => {
  const [user, setUser] = useState(null);
  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10); // Default to 10 questions
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [hasGeneratedPrompt, setHasGeneratedPrompt] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const [pastedOutput, setPastedOutput] = useState('');
  const [isOutputConfirmed, setIsOutputConfirmed] = useState(false);

  const { deckName } = useParams();
  const navigate = useNavigate();

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAlert({
          show: true,
          variant: 'warning',
          message: 'You must be signed in to use the QuizMaker.',
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Handler to confirm input and number of questions
  const handleConfirm = () => {
    if (!inputText.trim()) {
      setAlert({ show: true, variant: 'danger', message: 'Please enter some text.' });
      return;
    }

    if (numQuestions < 1 || numQuestions > 50) {
      setAlert({
        show: true,
        variant: 'danger',
        message: 'Please enter a valid number of questions (1-50).',
      });
      return;
    }

    setConfirmed(true);
    setAlert({ show: true, variant: 'success', message: 'Input confirmed. You can now generate the prompt.' });
  };

  // Handler to generate prompt
  const handleGenerate = () => {
    if (!confirmed) {
      setAlert({ show: true, variant: 'warning', message: 'Please confirm your input first.' });
      return;
    }

    generatePrompt();
    setAlert({ show: true, variant: 'info', message: 'Prompt generated. You can copy it now.' });
    setHasGeneratedPrompt(true);
  };

  // Function to generate the highly detailed prompt
  const generatePrompt = () => {
    const promptTemplate = `You are an expert quiz creator. Based on the following content, generate a series of questions and answers for a quiz.

**Content:**
${inputText}

**Instructions:**
1. **Number of Questions:** Generate exactly ${numQuestions} questions.
2. **Difficulty:** Make the questions appropriately challenging.
3. **Format:** 
   - Each question should be prefixed with "Q:" and each answer with "A:".
   - Example:
     \`Q: What is the capital of France?\`
     \`A: Paris.\`
4. **Separation:** Ensure that each Q&A pair is clearly separated by a newline.
5. **Content Requirements:**
   - Focus on key concepts, definitions, and critical details from the content.
   - Avoid overly simplistic or overly complex questions.
   - Ensure that answers are concise and directly address the questions.
6. **Formatting:**
   - Use proper punctuation and grammar.
   - Number the questions sequentially.
7. **Exclusions:**
   - Do not include any additional information outside of the Q&A pairs.
   - Do not provide explanations or justifications for the answers.`;

    setGeneratedPrompt(promptTemplate);
  };

  // Handler for confirming pasted output
  const handleConfirmOutput = async () => {
    if (!pastedOutput.trim()) {
      setAlert({ show: true, variant: 'danger', message: 'Please paste the output from ChatGPT.' });
      return;
    }

    setIsLoading(true);
    setAlert({ show: false, variant: '', message: '' });

    try {
      const qaPairs = parseQAPairs(pastedOutput);

      if (qaPairs.length === 0) {
        setAlert({
          show: true,
          variant: 'danger',
          message: 'Failed to parse any questions and answers. Please check the pasted output.',
        });
        setIsLoading(false);
        return;
      }

      const deckDocRef = doc(db, `users/${user.uid}/decks`, deckName);

      await setDoc(
        deckDocRef,
        {
          flashcards: qaPairs,
          generated: true,
        },
        { merge: true }
      );

      setIsOutputConfirmed(true);
      setAlert({ show: true, variant: 'success', message: 'Questions saved successfully.' });
      navigate(`/deck/${deckName}`);
    } catch (error) {
      console.error('Error saving questions:', error);
      setAlert({ show: true, variant: 'danger', message: 'Failed to save questions. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse Q&A pairs
  const parseQAPairs = (text) => {
    const qaPairs = [];
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    let currentQA = { question: '', answer: '' };

    lines.forEach((line) => {
      if (line.startsWith('Q:')) {
        if (currentQA.question && currentQA.answer) {
          qaPairs.push({ ...currentQA });
          currentQA = { question: '', answer: '' };
        }
        currentQA.question = line.slice(2).trim();
      } else if (line.startsWith('A:')) {
        currentQA.answer = line.slice(2).trim();
      }
    });

    // Push the last QA pair if it exists
    if (currentQA.question && currentQA.answer) {
      qaPairs.push(currentQA);
    }

    return qaPairs;
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center">QuizMaker</h2>

      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}

      {!confirmed && (
        <Card className="mb-4">
          <Card.Body>
            <Form.Group controlId="quizText" className="mb-3">
              <Form.Label>Enter Text for Quiz</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter the large body of text here..."
              />
              <Form.Text className="text-muted">{inputText.length}/5000 characters</Form.Text>
            </Form.Group>

            <Form.Group controlId="numQuestions" className="mb-3">
              <Form.Label>Number of Questions</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                placeholder="Enter the number of questions you want (1-50)"
              />
            </Form.Group>

            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={isLoading || !inputText.trim()}
              className="w-100"
            >
              {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Confirm Input'}
            </Button>
          </Card.Body>
        </Card>
      )}

      {confirmed && !hasGeneratedPrompt && (
        <>
          <Button
            variant="success"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-100 mb-3"
          >
            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Generate Prompt'}
          </Button>
        </>
      )}

      {hasGeneratedPrompt && !hasCopiedPrompt && (
        <>
          <Alert variant="info">Prompt generated. You can copy it now.</Alert>
          <Button
            variant="secondary"
            onClick={() => setShowPromptModal(true)}
            className="w-100 mb-2"
          >
            View/Edit Prompt
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              navigator.clipboard.writeText(generatedPrompt);
              setAlert({ show: true, variant: 'success', message: 'Prompt copied to clipboard.' });
              setHasCopiedPrompt(true);
            }}
            className="w-100"
          >
            Copy Prompt
          </Button>

          {/* Prompt Modal */}
          <Modal show={showPromptModal} onHide={() => setShowPromptModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Generated Prompt</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Alert variant="warning">Editing this prompt might cause unexpected results.</Alert>
              <Form.Control
                as="textarea"
                rows={15}
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPromptModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}

      {hasCopiedPrompt && !isOutputConfirmed && (
        <>
          <Form.Group controlId="pastedOutput" className="mb-3">
            <Form.Label>Paste ChatGPT Output Below</Form.Label>
            <Form.Control
              as="textarea"
              rows={15}
              value={pastedOutput}
              onChange={(e) => setPastedOutput(e.target.value)}
              placeholder="Paste the output generated by ChatGPT here..."
            />
          </Form.Group>
          <Button
            variant="success"
            onClick={handleConfirmOutput}
            disabled={isLoading || !pastedOutput.trim()}
            className="w-100"
          >
            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Go'}
          </Button>
        </>
      )}

      {isOutputConfirmed && (
        <Alert variant="success">Output confirmed and saved successfully.</Alert>
      )}
    </Container>
  );
};

export default QuizMaker;
