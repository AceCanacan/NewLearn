// src/components/Home/Home.js
import React from "react";
import { Navbar, Container, Button } from 'react-bootstrap';
import { signOutUser } from "../../firebase/auth";
import { useNavigate, Outlet } from "react-router-dom"; // Make sure Outlet is imported
import nlLogo from "../../assets/NL_logo.png";
import { BsBoxArrowRight } from 'react-icons/bs'; 

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      {/* Standard Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="fixed-top">
        <Container fluid>
          <Navbar.Brand href="/" className="d-flex align-items-center">
            <img
              src={nlLogo}
              alt="NewLearn Logo"
              width="40"
              height="40"
              className="d-inline-block align-top"
            />
            <span className="ms-2">NewLearn</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse className="justify-content-end">
            <Button 
              variant="outline-danger" 
              className="d-flex align-items-center"
              onClick={handleLogout}
            >
              <BsBoxArrowRight className="me-2" />
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <div style={{ marginTop: '70px', padding: '20px' }}>
        <Outlet /> {/* This is where nested routes will be rendered */}
      </div>
    </>
  );
};

export default Home;
