import React from "react";
import { Container, Row, Col, Button, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <Container className="py-5">
      <Row className="align-items-center">
        <Col lg={7}>
          <span className="text-success fw-bold small">
            FUTURE OF AGRICULTURE
          </span>

          <h1 className="display-4 fw-bold mt-3">
            Cultivate Success with{" "}
            <span className="text-success">Data-Driven</span> Insight.
          </h1>

          <p className="text-muted mt-3">
            Transform your farming operations with real-time field telemetry,
            automated irrigation precision, and global market synchronization.
          </p>

          <div className="d-flex gap-3 mt-4">
            <Button as={Link} to="/login" variant="success">
              Get Started
            </Button>
            {/* <Button variant="success">Get Started</Button> */}
            {/* <Button variant="outline-dark">Learn More</Button> */}
          </div>
        </Col>

        <Col lg={5}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDin2wBccz6ww4FoJktI2yJ4okp8ehJSi0JYPjiErLPmhS2TdPnV7V5a17aRsW6QT0xkH1x7uPsxnI0DIjEOAzDNpxFmiOX2pNS873avZWcaoj1qbYXOU8lAY-9kpBtDrlTgWjId63GeXeBk0lmO48X_FG7j0LtsqdBeU09vl5UXxMnJ7kKuB0wmjv4snBIgAVkiX5nYwPpUtbxqXvhp54SgdYOey8pWT-OnkcsKlxWVn6fH8IIjEYu7J__aR0UPvxvWNJ9Ospjk5EN"
            alt="farm"
            className="img-fluid rounded shadow"
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Hero;
