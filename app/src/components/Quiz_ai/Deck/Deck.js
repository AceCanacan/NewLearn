import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
} from "react-bootstrap";

function Deck() {
  const [decks, setDecks] = useState({});
  const [user, setUser] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDecks = async () => {
      if (user) {
        const decksCollectionRef = collection(db, `users/${user.uid}/decks`);
        const decksSnapshot = await getDocs(decksCollectionRef);
        const decksData = {};

        decksSnapshot.forEach((deckDoc) => {
          const data = deckDoc.data();
          const numCards = Array.isArray(data.cards) ? data.cards.length : 0;
          const description = data.description || "No description";
          decksData[deckDoc.id] = { numCards, description };
        });

        setDecks(decksData);
      }
    };

    fetchDecks();
  }, [user]);

  const saveDeck = async (deckName, deckDescription) => {
    if (!decks[deckName] && user) {
      const newDecks = {
        ...decks,
        [deckName]: { numCards: 0, description: deckDescription },
      };
      setDecks(newDecks);

      try {
        await setDoc(doc(db, `users/${user.uid}/decks`, deckName), {
          cards: [],
          description: deckDescription,
        });
        console.log(
          "Deck saved with name:",
          deckName,
          "and description:",
          deckDescription
        );
      } catch (error) {
        console.error("Error saving deck:", error);
      }
    } else {
      alert("Deck name already exists or user not authenticated.");
    }
  };

  const handleCreateNewDeck = () => {
    setShowDisclaimer(true);
  };

  const handleConfirmNewDeck = async () => {
    if (newDeckName && user) {
      await saveDeck(newDeckName, newDeckDescription);
      setShowDisclaimer(false);
      setNewDeckName("");
      setNewDeckDescription(""); // Clear the description after saving
    } else {
      alert("Please provide a deck name.");
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-3">
        <Col>
          <h2>Convert Images and Audio to Text</h2>
        </Col>
        <Col className="text-end">
        </Col>
      </Row>

      <Row>
        <Col>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {Object.entries(decks).map(
              ([deckName, { numCards, description }]) => (
                <Col key={deckName}>
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>{deckName}</Card.Title>
                      <Card.Text className="flex-grow-1">{description}</Card.Text>
                      <div className="mt-auto">
                        <Link to={`/deck/${deckName}/flashcard-input`} className="btn btn-outline-primary btn-sm">
                          Manage Deck
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            )}
            <Col>
              <Card
                className="h-100 d-flex align-items-center justify-content-center text-center border-dashed"
                onClick={handleCreateNewDeck}
                style={{ cursor: "pointer" }}
              >
                <Card.Body>
                  <div className="display-4">+</div>
                  <Card.Text>Create New Deck</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Create New Deck Modal */}
      <Modal show={showDisclaimer} onHide={() => setShowDisclaimer(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Deck</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter a unique name and a brief description for your new deck. This will help you organize your flashcards better.</p>
          <Form>
            <Form.Group className="mb-3" controlId="formDeckName">
              <Form.Label>Deck Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formDeckDescription">
              <Form.Label>Deck Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter deck description"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisclaimer(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmNewDeck}>
            Create Deck
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Deck;