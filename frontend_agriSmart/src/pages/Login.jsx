import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button
} from "react-bootstrap";
import { FaUser, FaLock, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const initialState = {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Expert",
    remember: false
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // 🔥 Reset form when switching tabs
  const switchToLogin = () => {
    setIsLogin(true);
    setFormData(initialState);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setFormData(initialState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const BASE_URL = "http://localhost:5000/api/auth";

    console.log("FORM DATA:", formData); // ✅ DEBUG

    try {
      if (isLogin) {
        const res = await axios.post(`${BASE_URL}/login`, {
          email: formData.email.trim(),
          password: formData.password.trim()
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        alert("Login successful");
        navigate("/dashboard");
      } else {
        await axios.post(`${BASE_URL}/register`, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password.trim(),
          role: formData.role
        });

        alert("Registered successfully");
        switchToLogin(); // go to login after register
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Something went wrong"
      );
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <Row className="w-100 justify-content-center">
          <Col lg={10}>
            <Card className="shadow-lg border-0 overflow-hidden">
              <Row className="g-0">

                {/* LEFT IMAGE */}
                <Col lg={6} className="d-none d-lg-block">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgXyDzD7NcOri-b5R0GKDOYQv6r_St-hFuDXtb41i3UfJebb95WqQ69nEIMTS98b6HIlTzg009cD9i1crAW2WhEWw2gkVuWlNoRRhRT8B7NPhPF2-JJMbEmSEr4cJq7rCtykdJ31QmYSLfdvP8YTlaYNjO9u2rHRNNVKKe28g3HTSsidr0LmfllQ9M8kOkXMGxTbXLzjTnBkE9mwhNLY2ErTCXdX4KjLnm9E1sdFMU93uLtQCMEiUdkiBsbVXvZn64hJJEjFrZdGgY"
                    alt="farm"
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                </Col>

                {/* FORM */}
                <Col lg={6}>
                  <Card.Body className="p-4 p-md-5">

                    {/* TABS */}
                    <div className="d-flex gap-4 mb-4">
                      <h5
                        className={isLogin ? "text-success border-bottom border-3" : "text-muted"}
                        style={{ cursor: "pointer" }}
                        onClick={switchToLogin}
                      >
                        Sign In
                      </h5>

                      <h5
                        className={!isLogin ? "text-success border-bottom border-3" : "text-muted"}
                        style={{ cursor: "pointer" }}
                        onClick={switchToRegister}
                      >
                        Register
                      </h5>
                    </div>

                    <Form onSubmit={handleSubmit}>

                      {/* REGISTER ONLY */}
                      {!isLogin && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                              type="text"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </>
                      )}

                      {/* EMAIL */}
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <div className="d-flex align-items-center border rounded px-2">
                          <FaUser className="me-2 text-muted" />
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            placeholder="Enter email"
                            onChange={handleChange}
                            required
                            className="border-0"
                          />
                        </div>
                      </Form.Group>

                      {/* PASSWORD */}
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <div className="d-flex align-items-center border rounded px-2">
                          <FaLock className="me-2 text-muted" />
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            placeholder="Enter password"
                            onChange={handleChange}
                            required
                            className="border-0"
                          />
                        </div>
                      </Form.Group>

                      {/* ROLE */}
                      {!isLogin && (
                        <Form.Group className="mb-3">
                          <Form.Label>Role</Form.Label>
                          <Form.Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                          >
                            <option value="Farmer">Farmer</option>
                            <option value="Expert">Agricultural Expert</option>
                          </Form.Select>
                        </Form.Group>
                      )}

                      {/* BUTTON */}
                      <Button
                        type="submit"
                        variant="success"
                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                      >
                        {isLogin ? "Access Dashboard" : "Register"}
                        <FaArrowRight />
                      </Button>

                    </Form>

                  </Card.Body>
                </Col>

              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      <footer className="text-center py-3 border-top small text-muted">
        © 2024 AgriSmart Framework
      </footer>
    </div>
  );
}

export default Auth;