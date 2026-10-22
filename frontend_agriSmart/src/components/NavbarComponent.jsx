import React, { useState, useEffect } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { PersonCircle } from "react-bootstrap-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

function NavbarComponent() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, [location.pathname]); // Re-check when route changes

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      bg="light"
      sticky="top"
      className="shadow-sm py-3"
      expanded={expanded}
    >
      <Container fluid>
        {/* Logo */}
        <Navbar.Brand
          as={Link}
          to="/dashboard"
          className="fw-bold text-success fs-4"
          onClick={() => setExpanded(false)}
        >
          AgriSmart
        </Navbar.Brand>

        {/* Toggle */}
        <Navbar.Toggle onClick={() => setExpanded(!expanded)} />

        <Navbar.Collapse>
          {/* Nav Links */}
          <Nav className="mx-auto gap-4 text-center">
            <Nav.Link
              as={Link}
              to="/dashboard"
              onClick={() => setExpanded(false)}
              className={
                isActive("/dashboard")
                  ? "fw-bold text-success border-bottom border-2"
                  : ""
              }
            >
              Dashboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/monitoring"
              onClick={() => setExpanded(false)}
              className={isActive("/monitoring") ? "fw-bold text-success" : ""}
            >
              Monitoring
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/market"
              onClick={() => setExpanded(false)}
              className={isActive("/market") ? "fw-bold text-success" : ""}
            >
              Market
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/weather"
              onClick={() => setExpanded(false)}
              className={isActive("/weather") ? "fw-bold text-success" : ""}
            >
              Weather
            </Nav.Link>
          </Nav>

          {user ? (
            <div className="d-flex align-items-center gap-3 justify-content-center mt-3 mt-lg-0">
              <div className="d-flex align-items-center gap-2 text-dark fw-bold">
                <PersonCircle size={20} className="text-success" />
                {user.name || user.email || 'User'}
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="d-flex align-items-center gap-2"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              as={Link}
              to="/login"
              variant="success"
              size="sm"
              className="d-flex align-items-center gap-2 mt-3 mt-lg-0 mx-auto mx-lg-0"
              onClick={() => setExpanded(false)}
            >
              <FaSignInAlt />
              Login
            </Button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
