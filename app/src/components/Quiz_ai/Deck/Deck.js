import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  addDoc,
  deleteDoc,
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
  Alert,
  Badge,
} from "react-bootstrap";
import { FaPlus, FaTrash, FaEye, FaCheckCircle } from "react-icons/fa";

function Deck() {
  const [decks, setDecks] = useState({});
  const [groups, setGroups] = useState({});
  const [user, setUser] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showViewGroupModal, setShowViewGroupModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setDecks({});
        setGroups({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch decks from Firebase
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

  // Fetch groups from Firebase
  useEffect(() => {
    const fetchGroups = async () => {
      if (user) {
        const groupsCollectionRef = collection(db, `users/${user.uid}/groups`);
        const groupsSnapshot = await getDocs(groupsCollectionRef);
        const groupsData = {};

        groupsSnapshot.forEach((groupDoc) => {
          const data = groupDoc.data();
          groupsData[groupDoc.id] = { groupName: data.groupName, deckIds: data.deckIds };
        });

        setGroups(groupsData);
      }
    };

    fetchGroups();
  }, [user]);

  // Save a new deck to Firebase
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
        setSuccessMessage(`Deck "${deckName}" created successfully!`);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } catch (error) {
        console.error("Error saving deck:", error);
      }
    } else {
      alert("Deck name already exists or user not authenticated.");
    }
  };

  // Handle creating a new deck
  const handleCreateNewDeck = () => {
    setShowDisclaimer(true);
  };

  // Confirm and save the new deck
  const handleConfirmNewDeck = async () => {
    if (newDeckName && user) {
      await saveDeck(newDeckName, newDeckDescription);
      setShowDisclaimer(false);
      setNewDeckName("");
      setNewDeckDescription("");
    } else {
      alert("Please provide a deck name.");
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedDecks([]);
    setSelectedGroups([]);
  };

  // Handle deck selection
  const handleSelectDeck = (deckName) => {
    if (selectedDecks.includes(deckName)) {
      setSelectedDecks(selectedDecks.filter((name) => name !== deckName));
    } else {
      setSelectedDecks([...selectedDecks, deckName]);
    }
  };

  // Handle group selection
  const handleSelectGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // Handle grouping selected decks
  const handleGroupDecks = () => {
    if (selectedDecks.length < 2) {
      alert("Please select at least two decks to form a group.");
      return;
    }
    setShowGroupModal(true);
  };

  // Confirm and create the group
  const handleConfirmGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Please provide a group name.");
      return;
    }

    try {
      const groupsCollectionRef = collection(db, `users/${user.uid}/groups`);
      const newGroupDoc = await addDoc(groupsCollectionRef, {
        groupName: newGroupName,
        deckIds: selectedDecks,
      });

      const groupId = newGroupDoc.id;
      setGroups({
        ...groups,
        [groupId]: { groupName: newGroupName, deckIds: selectedDecks },
      });

      // Prepare group details for modal display
      const groupedDecks = selectedDecks.map((deckName) => ({
        name: deckName,
        ...decks[deckName],
      }));
      setGroupDetails({
        groupName: newGroupName,
        decks: groupedDecks,
      });

      // Reset selections and modal states
      setShowGroupModal(false);
      setNewGroupName("");
      setSelectedDecks([]);
      setIsEditMode(false);
      setSuccessMessage(`Group "${newGroupName}" created successfully!`);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    }
  };

  // Close group modal
  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setNewGroupName("");
  };

  // Handle viewing group details
  const handleViewGroup = (groupId) => {
    const group = groups[groupId];
    if (group) {
      const groupedDecks = group.deckIds.map((deckName) => ({
        name: deckName,
        ...decks[deckName],
      }));
      setSelectedGroup({
        id: groupId,
        groupName: group.groupName,
        decks: groupedDecks,
      });
      setShowViewGroupModal(true);
    }
  };

  // Close view group modal
  const handleCloseViewGroupModal = () => {
    setShowViewGroupModal(false);
    setSelectedGroup(null);
  };

  // Handle deleting selected groups
  const handleDeleteSelectedGroups = async () => {
    if (selectedGroups.length === 0) {
      alert("No groups selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedGroups.length} group(s)?`
    );

    if (!confirmDelete) return;

    try {
      const updatedGroups = { ...groups };
      for (const groupId of selectedGroups) {
        await deleteDoc(doc(db, `users/${user.uid}/groups`, groupId));
        delete updatedGroups[groupId];
      }
      setGroups(updatedGroups);
      setSelectedGroups([]);
      setIsEditMode(false);
      setSuccessMessage("Selected group(s) deleted successfully.");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      console.error("Error deleting groups:", error);
      alert("Failed to delete selected groups. Please try again.");
    }
  };

  // Compute a set of deck names that are already grouped
  const groupedDeckNames = new Set();
  Object.values(groups).forEach((group) => {
    group.deckIds.forEach((deckId) => groupedDeckNames.add(deckId));
  });

  // Filter decks to exclude those that are part of any group
  const availableDecks = Object.entries(decks).filter(
    ([deckName]) => !groupedDeckNames.has(deckName)
  );

  return (
    <Container fluid className="py-4">
      <Row className="mb-3 align-items-center">

        <Col className="text-end">
          <Button
            variant={isEditMode ? "secondary" : "primary"}
            onClick={toggleEditMode}
          >
            {isEditMode ? (
              <>
                <FaTrash className="me-2" />
                Exit Edit Mode
              </>
            ) : (
              <>
                Group
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert variant="success" onClose={() => setShowSuccessAlert(false)} dismissible>
          <FaCheckCircle className="me-2" />
          {successMessage}
        </Alert>
      )}

      {/* Groups Section */}
      {Object.keys(groups).length > 0 && (
        <Row className="mb-4">
          <Col>
            <h4>
              Your Groups <Badge bg="secondary">{Object.keys(groups).length}</Badge>
            </h4>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
              {Object.entries(groups).map(([groupId, { groupName, deckIds }]) => (
                <Col key={groupId}>
                  <Card
                    className="h-100 shadow-sm"
                    style={{ cursor: isEditMode ? "default" : "pointer" }}
                  >
                    <Card.Body className="d-flex flex-column">
                      {isEditMode && (
                        <Form.Check
                          type="checkbox"
                          className="mb-3"
                          checked={selectedGroups.includes(groupId)}
                          onChange={() => handleSelectGroup(groupId)}
                        />
                      )}
                      <Card.Title className="d-flex align-items-center">
                        {groupName}
                      </Card.Title>
                      <Card.Text>
                        <strong>{deckIds.length}</strong> Deck{deckIds.length > 1 ? "s" : ""}
                      </Card.Text>
                      <div className="mt-auto">
                        {!isEditMode && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewGroup(groupId)}
                          >
                            View Group
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
              {/* Manage Groups Button in Edit Mode */}
              {isEditMode && selectedGroups.length > 0 && (
                <Col className="d-flex align-items-center">
                  <Button
                    variant="danger"
                    onClick={handleDeleteSelectedGroups}
                  >
                    <FaTrash className="me-2" />
                    Delete Selected Groups
                  </Button>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      )}

      {/* Decks Section */}












<Row>
  <Col>
    <h4>
      Your Decks <Badge bg="secondary">{availableDecks.length}</Badge>
    </h4>
    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
      {availableDecks.map(([deckName, { numCards, description }]) => (
        <Col key={deckName}>
          {/* Existing Deck Card */}
          <Card
            className="h-100 shadow-sm"
            onClick={() => {
              if (!isEditMode) navigate(`/deck/${encodeURIComponent(deckName)}/flashcard-input`);
            }}
            style={{
              cursor: isEditMode ? "default" : "pointer",
              position: "relative",
            }}
          >
            <Card.Body className="d-flex flex-column">
              {isEditMode && (
                <Form.Check
                  type="checkbox"
                  className="mb-3"
                  checked={selectedDecks.includes(deckName)}
                  onChange={() => handleSelectDeck(deckName)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <Card.Title>{deckName}</Card.Title>
              <Card.Text className="flex-grow-1">{description}</Card.Text>
              <div className="mt-auto">
                {/* Additional actions can be added here */}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
      
      {/* Always render the "Create New Deck" card */}
      <Col>
        <Card
          className="h-100 d-flex align-items-center justify-content-center text-center border-dashed"
          onClick={handleCreateNewDeck}
          style={{ cursor: "pointer", borderStyle: "dashed" }}
        >
          <Card.Body>
            <FaPlus size={40} className="text-primary mb-3" />
            <Card.Text className="fw-bold">Create New Deck</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Col>
</Row>






      {/* Edit Mode Actions */}
      {isEditMode && availableDecks.length > 0 && (
        <Row className="mt-3">
          <Col>
            <Button
              variant="success"
              onClick={handleGroupDecks}
              disabled={selectedDecks.length < 2}
            >
              <FaCheckCircle className="me-2" />
              Group Selected Decks
            </Button>
          </Col>
        </Row>
      )}

      {/* Create New Deck Modal */}
      <Modal show={showDisclaimer} onHide={() => setShowDisclaimer(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Deck</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please enter a unique name and a brief description for your new deck. This will help you organize your flashcards better.
          </p>
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

      {/* Group Creation Modal */}
      <Modal show={showGroupModal} onHide={handleCloseGroupModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formGroupName">
                <Form.Label>Group Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <h5>
                <FaCheckCircle className="me-2 text-success" />
                Selected Decks
              </h5>
              <div className="d-flex flex-wrap">
                {selectedDecks.map((deckName) => (
                  <Badge bg="primary" key={deckName} className="me-2 mb-2">
                    {deckName}
                  </Badge>
                ))}
              </div>
            </Col>
          </Row>
          {groupDetails && (
            <Alert variant="success" className="mt-3">
              <Alert.Heading>Group Created Successfully!</Alert.Heading>
              <p>
                <strong>Group Name:</strong> {groupDetails.groupName}
              </p>
              <hr />
              <p className="mb-0">
                <strong>Decks in this group:</strong>
              </p>
              <div className="d-flex flex-wrap">
                {groupDetails.decks.map((deck) => (
                  <Badge bg="secondary" key={deck.name} className="me-2 mb-2">
                    {deck.name} ({deck.numCards} {deck.numCards !== 1 ? "cards" : "card"})
                  </Badge>
                ))}
              </div>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseGroupModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmGroup}>
            <FaCheckCircle className="me-2" />
            Create Group
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Group Modal */}
      <Modal show={showViewGroupModal} onHide={handleCloseViewGroupModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Group Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <>
              <h5 className="mb-3">
                {selectedGroup.groupName}
              </h5>
              <h6>Decks in this group:</h6>
              <Row className="g-3">
                {selectedGroup.decks.map((deck) => (
                  <Col key={deck.name} xs={12} sm={6} md={4}>
                    <Card className="h-100 shadow-sm">
                      <Card.Body className="d-flex flex-column">
                        <Card.Title>
                          {deck.name}
                        </Card.Title>
                        <Card.Text>
                        </Card.Text>
                        <Button
                          variant="outline-primary"
                          onClick={() =>
                            navigate(`/deck/${encodeURIComponent(deck.name)}/flashcard-input`)
                          }
                          className="mt-auto"
                        >
                          <FaEye className="me-2" />
                          View Deck
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewGroupModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Deck;
