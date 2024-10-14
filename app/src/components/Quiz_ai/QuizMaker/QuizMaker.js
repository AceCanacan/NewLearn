// File: src/components/Quiz_ai/QuizMaker/QuizMaker.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebase'; // Ensure this path is correct
import { onAuthStateChanged } from 'firebase/auth';
import {
  Container,
  Button,
  Form,
  Alert,
  Spinner,
  Card,
  Modal,
} from 'react-bootstrap';

const QuizMaker = () => {
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState('flashcard'); // Single question type
  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10); // Default to 10 questions
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const [pastedOutput, setPastedOutput] = useState('');
  const [isOutputConfirmed, setIsOutputConfirmed] = useState(false);
  const [parsingErrors, setParsingErrors] = useState([]); // To store parsing errors

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

  // Handler to generate prompt based on selected type
  const handleGeneratePrompt = (type) => {
    let promptTemplate = '';

    switch (type) {
      case 'flashcard':
        promptTemplate = `You are an expert quiz creator. Based on the following content, generate a series of flashcards for a study deck.

**Content:**
${inputText}

**Instructions:**
1. **Number of Flashcards:** Generate exactly ${numQuestions} flashcards.
2. **Format:** 
   - Each flashcard must follow this exact format:
     - **Q1.** Question text here?
     - **A1.** Answer text here.
     - **Q2.** Next question text here?
     - **A2.** Next answer text here.
   - **Important:** Ensure that each question starts with "Q" followed by its number and a dot, and each answer starts with "A" followed by its number and a dot. There should be no additional text or explanations.
3. **Sample Output:**
\`\`\`
Q1. What is the capital of France?
A1. Paris.
Q2. What is the largest planet in our solar system?
A2. Jupiter.
...
\`\`\`
4. **Formatting Requirements:**
   - Use proper punctuation.
   - Each Q&A pair should be on separate lines.
   - Maintain sequential numbering without skipping numbers.
`;
        break;

      case 'multiple_choice':
        promptTemplate = `You are an expert quiz creator. Based on the following content, generate a series of multiple-choice questions for a quiz.

**Content:**
${inputText}

**Instructions:**
1. **Number of Questions:** Generate exactly ${numQuestions} multiple-choice questions.
2. **Format:** 
   - Each question must follow this exact format:

     Q1. Question text here?
     A. Option A
     B. Option B
     C. Option C
     D. Option D
     // Correct Answer: [A/B/C/D]
   - **Important:** Ensure that each question starts with "Q" followed by its number and a dot, each option starts with "A.", "B.", etc., and the correct answer is indicated precisely as shown.
3. **Sample Output:**
\`\`\`
Q1. What is the capital of France?
A. Berlin
B. Madrid
C. Paris
D. Rome
// Correct Answer: C

Q2. Which planet is known as the Red Planet?
A. Earth
B. Mars
C. Jupiter
D. Venus
// Correct Answer: B
...
\`\`\`
4. **Formatting Requirements:**
   - Use proper punctuation.
   - Each Q&A pair should be separated by a newline.
   - Maintain sequential numbering without skipping numbers.
`;
        break;

      case 'true_false':
        promptTemplate = `You are an expert quiz creator. Based on the following content, generate a series of true or false questions for a quiz.

**Content:**
${inputText}

**Instructions:**
1. **Number of Questions:** Generate exactly ${numQuestions} true or false questions.
2. **Format:** 
   - Each statement must follow this exact format:

     Q1. Statement text here.
     A1. True

   - **Important:** Ensure that each question starts with "Q" followed by its number and a dot, and each answer starts with "A" followed by its number and a dot.
3. **Sample Output:**
\`\`\`
Q1. The sky is blue.
A1. True

Q2. The capital of Germany is Berlin.
A2. True
...
\`\`\`
4. **Formatting Requirements:**
   - Use proper punctuation.
   - Each Q&A pair should be separated by a newline.
   - Maintain sequential numbering without skipping numbers.
`;
        break;

      case 'identification':
        promptTemplate = `You are an expert quiz creator. Based on the following content, generate a series of identification questions for a quiz.

**Content:**
${inputText}

**Instructions:**
1. **Number of Questions:** Generate exactly ${numQuestions} identification questions.
2. **Format:** 
   - Each question must follow this exact format:

     Q1. What is the capital of France?
     A1. Paris

   - **Important:** Ensure that each question starts with "Q" followed by its number and a dot, and each answer starts with "A" followed by its number and a dot. Answers should be concise, typically one or two words.
3. **Sample Output:**
\`\`\`
Q1. What is the capital of France?
A1. Paris

Q2. Who wrote "Romeo and Juliet"?
A2. William Shakespeare
...
\`\`\`
4. **Formatting Requirements:**
   - Use proper punctuation.
   - Each Q&A pair should be separated by a newline.
   - Maintain sequential numbering without skipping numbers.
`;
        break;

      default:
        promptTemplate = '';
    }

    setGeneratedPrompt(promptTemplate);
  };

  // Handler for confirming pasted output
  const handleConfirmOutput = async () => {
    if (!pastedOutput.trim()) {
      setAlert({ show: true, variant: 'danger', message: `Please paste the output from ChatGPT for ${formatQuestionType(selectedType)}.` });
      return;
    }

    setIsLoading(true);
    setAlert({ show: false, variant: '', message: '' });
    setParsingErrors([]); // Reset parsing errors

    try {
      let qaPairs = [];
      let errors = [];

      // Separate parsing logic based on question type
      switch (selectedType) {
        case 'flashcard':
          ({ qaPairs, errors } = parseFlashcards(pastedOutput));
          break;
        case 'multiple_choice':
          ({ qaPairs, errors } = parseMultipleChoice(pastedOutput));
          break;
        case 'true_false':
          ({ qaPairs, errors } = parseTrueFalse(pastedOutput));
          break;
        case 'identification':
          ({ qaPairs, errors } = parseIdentification(pastedOutput));
          break;
        default:
          break;
      }

      if (errors.length > 0) {
        setParsingErrors(errors);
        setIsLoading(false);
        setAlert({
          show: true,
          variant: 'danger',
          message: `There were issues parsing your ${formatQuestionType(selectedType)} output. Please review the suggestions below.`,
        });
        return;
      }

      if (qaPairs.length === 0) {
        setAlert({
          show: true,
          variant: 'danger',
          message: `Failed to parse any questions and answers for ${formatQuestionType(selectedType)}. Please check the pasted output.`,
        });
        setIsLoading(false);
        return;
      }

      // Map QA pairs to flashcards with appropriate type
      const newFlashcards = qaPairs.map((pair) => ({
        type: selectedType,
        question: pair.question,
        answer: pair.answer,
      }));

      const deckDocRef = doc(db, `users/${user.uid}/decks/${deckName}`);

      // Fetch existing flashcards
      const deckDocSnapshot = await getDoc(deckDocRef);
      const deckData = deckDocSnapshot.data();

      // Merge new flashcards with existing ones
      const updatedFlashcards = deckData.flashcards ? [...deckData.flashcards, ...newFlashcards] : [...newFlashcards];

      await setDoc(
        deckDocRef,
        {
          flashcards: updatedFlashcards,
          totalFlashcardsCreated: updatedFlashcards.length,
          questionType: selectedType, // Store the question type
        },
        { merge: true }
      );

      setIsOutputConfirmed(true);
      setAlert({ show: true, variant: 'success', message: `${formatQuestionType(selectedType)} questions saved successfully.` });
      setHasCopiedPrompt(false);
      setPastedOutput('');
    } catch (error) {
      console.error(`Error saving ${formatQuestionType(selectedType)} questions:`, error);
      setAlert({ show: true, variant: 'danger', message: `Failed to save ${formatQuestionType(selectedType)} questions. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  };

  // Parsing functions for different question types

  // 1. Flashcard Parsing
  const parseFlashcards = (text) => {
    const qaPairs = [];
    const errors = [];
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    let currentQA = { question: '', answer: '' };
    const questionRegex = /^Q(\d+)\.\s*(.+)$/i;
    const answerRegex = /^A(\d+)\.\s*(.+)$/i;

    lines.forEach((line) => {
      const questionMatch = line.match(questionRegex);
      const answerMatch = line.match(answerRegex);

      if (questionMatch) {
        if (currentQA.question && currentQA.answer) {
          qaPairs.push({ ...currentQA });
          currentQA = { question: '', answer: '' };
        }
        currentQA.question = questionMatch[2].trim();
      } else if (answerMatch) {
        if (currentQA.question) {
          currentQA.answer = answerMatch[2].trim();
        } else {
          errors.push(`Answer found without a corresponding question: "${line}"`);
        }
      } else {
        errors.push(`Unrecognized line format: "${line}"`);
      }
    });

    // Push the last QA pair if it exists
    if (currentQA.question && currentQA.answer) {
      qaPairs.push(currentQA);
    }

    // Check for numbering consistency
    for (let i = 0; i < qaPairs.length; i++) {
      const expectedNumber = i + 1;
      const qNumber = qaPairs[i].question.match(/^Q(\d+)\./i);
      const aNumber = qaPairs[i].answer.match(/^A(\d+)\./i);
      if (qNumber && Number(qNumber[1]) !== expectedNumber) {
        errors.push(`Question number mismatch: expected Q${expectedNumber}, found ${qaPairs[i].question.match(/^(Q\d+)\./i)[1]}`);
      }
      if (aNumber && Number(aNumber[1]) !== expectedNumber) {
        errors.push(`Answer number mismatch: expected A${expectedNumber}, found ${qaPairs[i].answer.match(/^(A\d+)\./i)[1]}`);
      }
    }

    return { qaPairs, errors };
  };

  // 2. Multiple Choice Parsing
  const parseMultipleChoice = (text) => {
    const qaPairs = [];
    const errors = [];
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    let currentQA = { question: '', options: {}, correctOption: '' };
    const questionRegex = /^Q(\d+)\.\s*(.+)$/i;
    const optionRegex = /^([A-D])\.\s*(.+)$/i;
    const correctAnswerRegex = /^\/\/\s*Correct Answer:\s*([A-D])$/i;

    lines.forEach((line) => {
      const questionMatch = line.match(questionRegex);
      const optionMatch = line.match(optionRegex);
      const correctAnswerMatch = line.match(correctAnswerRegex);

      if (questionMatch) {
        if (currentQA.question && Object.keys(currentQA.options).length > 0 && currentQA.correctOption) {
          // Validate current QA before pushing
          const validationError = validateMultipleChoiceQA(currentQA);
          if (validationError) {
            errors.push(`Q${questionMatch[1]}: ${validationError}`);
          } else {
            qaPairs.push({
              question: currentQA.question,
              options: currentQA.options,
              correctAnswer: currentQA.correctOption,
            });
          }
          currentQA = { question: '', options: {}, correctOption: '' };
        }
        currentQA.question = questionMatch[2].trim();
      } else if (optionMatch) {
        if (currentQA.question) {
          currentQA.options[optionMatch[1]] = optionMatch[2].trim();
        } else {
          errors.push(`Option found without a corresponding question: "${line}"`);
        }
      } else if (correctAnswerMatch) {
        if (currentQA.question) {
          currentQA.correctOption = correctAnswerMatch[1].trim();
        } else {
          errors.push(`Correct answer found without a corresponding question: "${line}"`);
        }
      } else {
        errors.push(`Unrecognized line format: "${line}"`);
      }
    });

    // Push the last QA pair if it exists
    if (currentQA.question && Object.keys(currentQA.options).length > 0 && currentQA.correctOption) {
      const validationError = validateMultipleChoiceQA(currentQA);
      if (validationError) {
        errors.push(`Final Question: ${validationError}`);
      } else {
        qaPairs.push({
          question: currentQA.question,
          options: currentQA.options,
          correctAnswer: currentQA.correctOption,
        });
      }
    }

    // Convert multiple choice to a standardized format
    const formattedQAPairs = qaPairs.map((pair, index) => {
      const { question, options, correctAnswer } = pair;
      return {
        question: `${question}\nA. ${options['A']}\nB. ${options['B']}\nC. ${options['C']}\nD. ${options['D']}\nCorrect Answer: ${correctAnswer}`,
        answer: options[correctAnswer],
      };
    });

    return { qaPairs: formattedQAPairs, errors };
  };

  // Helper function to validate multiple choice QA
  const validateMultipleChoiceQA = (qa) => {
    const optionKeys = ['A', 'B', 'C', 'D'];
    const missingOptions = optionKeys.filter((key) => !qa.options[key]);
    if (missingOptions.length > 0) {
      return `Missing options: ${missingOptions.join(', ')}`;
    }
    if (!qa.correctOption) {
      return 'Missing correct answer declaration.';
    }
    if (!optionKeys.includes(qa.correctOption)) {
      return `Invalid correct answer option: ${qa.correctOption}`;
    }
    return null;
  };

  // 3. True/False Parsing
  const parseTrueFalse = (text) => {
    const qaPairs = [];
    const errors = [];
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    let currentQA = { question: '', answer: '' };
    const questionRegex = /^Q(\d+)\.\s*(.+)$/i;
    const answerRegex = /^A(\d+)\.\s*(True|False)$/i;

    lines.forEach((line) => {
      const questionMatch = line.match(questionRegex);
      const answerMatch = line.match(answerRegex);

      if (questionMatch) {
        if (currentQA.question && currentQA.answer) {
          qaPairs.push({ ...currentQA });
          currentQA = { question: '', answer: '' };
        }
        currentQA.question = questionMatch[2].trim();
      } else if (answerMatch) {
        if (currentQA.question) {
          currentQA.answer = answerMatch[2].trim();
        } else {
          errors.push(`Answer found without a corresponding question: "${line}"`);
        }
      } else {
        errors.push(`Unrecognized line format: "${line}"`);
      }
    });

    // Push the last QA pair if it exists
    if (currentQA.question && currentQA.answer) {
      qaPairs.push(currentQA);
    }

    // Check for numbering consistency
    for (let i = 0; i < qaPairs.length; i++) {
      const expectedNumber = i + 1;
      const qNumber = qaPairs[i].question.match(/^Q(\d+)\./i);
      const aNumber = qaPairs[i].answer.match(/^A(\d+)\./i);
      if (qNumber && Number(qNumber[1]) !== expectedNumber) {
        errors.push(`Question number mismatch: expected Q${expectedNumber}, found ${qaPairs[i].question.match(/^(Q\d+)\./i)[1]}`);
      }
      if (aNumber && Number(aNumber[1]) !== expectedNumber) {
        errors.push(`Answer number mismatch: expected A${expectedNumber}, found ${qaPairs[i].answer.match(/^(A\d+)\./i)[1]}`);
      }
    }

    return { qaPairs, errors };
  };

  // 4. Identification Parsing
  const parseIdentification = (text) => {
    const qaPairs = [];
    const errors = [];
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    let currentQA = { question: '', answer: '' };
    const questionRegex = /^Q(\d+)\.\s*(.+)$/i;
    const answerRegex = /^A(\d+)\.\s*(.+)$/i;

    lines.forEach((line) => {
      const questionMatch = line.match(questionRegex);
      const answerMatch = line.match(answerRegex);

      if (questionMatch) {
        if (currentQA.question && currentQA.answer) {
          qaPairs.push({ ...currentQA });
          currentQA = { question: '', answer: '' };
        }
        currentQA.question = questionMatch[2].trim();
      } else if (answerMatch) {
        if (currentQA.question) {
          currentQA.answer = answerMatch[2].trim();
        } else {
          errors.push(`Answer found without a corresponding question: "${line}"`);
        }
      } else {
        errors.push(`Unrecognized line format: "${line}"`);
      }
    });

    // Push the last QA pair if it exists
    if (currentQA.question && currentQA.answer) {
      qaPairs.push(currentQA);
    }

    // Check for numbering consistency
    for (let i = 0; i < qaPairs.length; i++) {
      const expectedNumber = i + 1;
      const qNumber = qaPairs[i].question.match(/^Q(\d+)\./i);
      const aNumber = qaPairs[i].answer.match(/^A(\d+)\./i);
      if (qNumber && Number(qNumber[1]) !== expectedNumber) {
        errors.push(`Question number mismatch: expected Q${expectedNumber}, found ${qaPairs[i].question.match(/^(Q\d+)\./i)[1]}`);
      }
      if (aNumber && Number(aNumber[1]) !== expectedNumber) {
        errors.push(`Answer number mismatch: expected A${expectedNumber}, found ${qaPairs[i].answer.match(/^(A\d+)\./i)[1]}`);
      }
    }

    return { qaPairs, errors };
  };

  // Helper function to format question type for display
  const formatQuestionType = (type) => {
    switch (type) {
      case 'flashcard':
        return 'Flashcard';
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True or False';
      case 'identification':
        return 'Identification';
      default:
        return 'Flashcard';
    }
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
          {parsingErrors.length > 0 && (
            <ul className="mt-2">
              {parsingErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          )}
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

            <Form.Group controlId="questionType" className="mb-3">
              <Form.Label>Select Question Type to Generate</Form.Label>
              <Form.Check
                type="radio"
                label="Flashcard"
                name="questionType"
                value="flashcard"
                checked={selectedType === 'flashcard'}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="Multiple Choice"
                name="questionType"
                value="multiple_choice"
                checked={selectedType === 'multiple_choice'}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="True or False"
                name="questionType"
                value="true_false"
                checked={selectedType === 'true_false'}
                onChange={(e) => setSelectedType(e.target.value)}
              />
              <Form.Check
                type="radio"
                label="Identification"
                name="questionType"
                value="identification"
                checked={selectedType === 'identification'}
                onChange={(e) => setSelectedType(e.target.value)}
              />
            </Form.Group>

            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={isLoading || !inputText.trim() || !selectedType}
              className="w-100"
            >
              {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Confirm Input'}
            </Button>
          </Card.Body>
        </Card>
      )}

      {confirmed && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <h5>Select Prompt to Generate</h5>
              <Button
                variant="success"
                onClick={() => handleGeneratePrompt(selectedType)}
                className="me-2 mb-2"
              >
                Generate {formatQuestionType(selectedType)} Prompt
              </Button>
            </Card.Body>
          </Card>

          {generatedPrompt && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>{formatQuestionType(selectedType)} Prompt</h5>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setShowPromptModal(true);
                  }}
                >
                  Edit Prompt
                </Button>
              </Card.Header>
              <Card.Body>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{generatedPrompt}</pre>
                <Button
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPrompt);
                    setAlert({ show: true, variant: 'success', message: `${formatQuestionType(selectedType)} prompt copied to clipboard.` });
                    setHasCopiedPrompt(true);
                  }}
                  className="mt-2"
                >
                  Copy {formatQuestionType(selectedType)} Prompt
                </Button>
              </Card.Body>

              {/* Confirmation for Copied Prompt */}
              {hasCopiedPrompt && (
                <Alert
                  variant="success"
                  onClose={() => setHasCopiedPrompt(false)}
                  dismissible
                  className="m-3"
                >
                  {formatQuestionType(selectedType)} prompt copied successfully.
                </Alert>
              )}

              {/* Paste Output Section */}
              {!isOutputConfirmed && hasCopiedPrompt && (
                <Card.Footer>
                  <Form.Group controlId={`pastedOutput-${selectedType}`} className="mb-3">
                    <Form.Label>Paste ChatGPT Output for {formatQuestionType(selectedType)} Below</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      value={pastedOutput}
                      onChange={(e) => setPastedOutput(e.target.value)}
                      placeholder={`Paste the output generated by ChatGPT for ${formatQuestionType(selectedType)} here...`}
                    />
                  </Form.Group>
                  <Button
                    variant="success"
                    onClick={handleConfirmOutput}
                    disabled={isLoading || !pastedOutput.trim()}
                    className="w-100"
                  >
                    {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Save Questions'}
                  </Button>
                </Card.Footer>
              )}

              {/* Confirmation Message */}
              {isOutputConfirmed && (
                <Alert
                  variant="success"
                  onClose={() => setIsOutputConfirmed(false)}
                  dismissible
                  className="m-3"
                >
                  {formatQuestionType(selectedType)} questions saved successfully.
                </Alert>
              )}
            </Card>
          )}

          {/* Prompt Modal for Editing */}
          <Modal show={showPromptModal} onHide={() => setShowPromptModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Edit {formatQuestionType(selectedType)} Prompt</Modal.Title>
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
              <Button variant="primary" onClick={() => setShowPromptModal(false)}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Button to Finish and Navigate */}
          <Button
            variant="success"
            onClick={() => navigate(`/deck/${deckName}/flashcard-input`)}
            className="w-100 mt-3"
          >
            Finish and Return to Deck
          </Button>
        </>
      )}
    </Container>
  );
};

// Enhanced Helper function to format question type for display
const formatQuestionType = (type) => {
  switch (type) {
    case 'flashcard':
      return 'Flashcard';
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'true_false':
      return 'True or False';
    case 'identification':
      return 'Identification';
    default:
      return 'Flashcard';
  }
};

export default QuizMaker;
