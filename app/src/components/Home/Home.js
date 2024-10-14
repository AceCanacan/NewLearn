// src/components/Home/Sidebar.js
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button, Navbar, Nav, Offcanvas, Container } from 'react-bootstrap';
import { signOutUser } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import quizmakerLogo from "../../assets/icons/quizmaker_logo.png";
import { 
  BsFillHouseDoorFill, 
  BsFileEarmarkTextFill, 
  BsCardList, 
  BsBookFill, 
  BsBoxArrowRight,
  BsList
} from 'react-icons/bs'; // Importing Bootstrap icons from react-icons

const Sidebar = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Define navigation links
  const navLinks = [
    { to: "/deck/home", icon: <BsFillHouseDoorFill />, label: "Quiz Maker" },
    { to: "/notesmaker", icon: <BsCardList />, label: "Notes" },
    // { to: "/pdfreader", icon: <BsBookFill />, label: "PDF Reader" },
  ];

  return (
    <>
      {/* Navbar for mobile */}
      <Navbar bg="dark" variant="dark" expand={false} className="d-md-none fixed-top">
        <Container fluid>
          <Button 
            variant="dark" 
            onClick={handleShow} 
            aria-label="Toggle navigation" 
            className="me-2"
          >
            <BsList size={24} />
          </Button>
          <Navbar.Brand href="/" className="ms-2 d-flex align-items-center">
            <img
              src={quizmakerLogo}
              alt="Quiz Maker Logo"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            <span className="ms-2">Quiz AI</span>
          </Navbar.Brand>
        </Container>
      </Navbar>

      {/* Offcanvas for mobile */}
      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        backdrop="static" 
        keyboard={false}
        placement="start"
        className="bg-dark text-white"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="d-flex align-items-center">
            <img
              src={quizmakerLogo}
              alt="Quiz Maker Logo"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            <span className="ms-2">Quiz AI</span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column justify-content-between">
          <Nav className="flex-column">
            {navLinks.map((link, idx) => (
              <Nav.Link 
                as={NavLink} 
                to={link.to} 
                key={idx}
                onClick={handleClose}
                className="d-flex align-items-center mb-2"
                style={({ isActive }) => ({
                  color: isActive ? '#0d6efd' : '#ffffff',
                  backgroundColor: isActive ? '#e7f1ff' : 'transparent',
                  borderRadius: '4px',
                  padding: '8px 12px',
                })}
              >
                {link.icon}
                <span className="ms-2">{link.label}</span>
              </Nav.Link>
            ))}
          </Nav>
          <div className="mt-auto">
            <Button 
              variant="outline-danger" 
              className="w-100 d-flex align-items-center justify-content-center mt-3"
              onClick={handleLogout}
            >
              <BsBoxArrowRight className="me-2" />
              Logout
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Sidebar for desktop */}
      <div className="d-none d-md-flex">
        <Navbar 
          bg="dark" 
          variant="dark" 
          className="flex-column vh-100 p-3 position-fixed" 
          style={{ width: '250px' }}
        >
          <Navbar.Brand href="/" className="mb-4 d-flex align-items-center">
            <img
              src={quizmakerLogo}
              alt="Quiz Maker Logo"
              width="40"
              height="40"
              className="d-inline-block align-top"
            />
            <span className="ms-2">Quiz AI</span>
          </Navbar.Brand>
          <Nav className="flex-column w-100">
            {navLinks.map((link, idx) => (
              <Nav.Link 
                as={NavLink} 
                to={link.to} 
                key={idx}
                className="d-flex align-items-center mb-2"
                style={({ isActive }) => ({
                  color: isActive ? '#0d6efd' : '#ffffff',
                  backgroundColor: isActive ? '#e7f1ff' : 'transparent',
                  borderRadius: '4px',
                  padding: '8px 12px',
                })}
              >
                {link.icon}
                <span className="ms-2">{link.label}</span>
              </Nav.Link>
            ))}
          </Nav>
          <div className="mt-auto">
            <Button 
              variant="outline-danger" 
              className="w-100 d-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <BsBoxArrowRight className="me-2" />
              Logout
            </Button>
          </div>
        </Navbar>
      </div>

      {/* Main Content */}
      <div className="d-md-none" style={{ marginTop: '60px', padding: '20px' }}>
        <Outlet />
      </div>
      <div className="d-none d-md-block" style={{ marginLeft: '250px', padding: '20px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default Sidebar;
