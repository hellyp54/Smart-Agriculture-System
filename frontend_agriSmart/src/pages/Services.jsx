import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

const Services = () => (
  <div>
    <h2 className="mb-4 fw-bold">Agricultural Services</h2>
    <Row className="g-4">
      {[
        { title: 'Pest Detection', desc: 'AI-driven analysis to identify disease clusters.' },
        { title: 'Smart Irrigation', desc: 'Automated water distribution based on soil needs.' },
        { title: 'Expert Consultation', desc: 'Connect with certified agronomists for planning.' },
        { title: 'Soil Lab Analysis', desc: 'Deep-strata nutrient profiling and mapping.' }
      ].map((service, idx) => (
        <Col md={6} lg={3} key={idx}>
          <Card className="h-100 border-0 shadow-sm p-3">
            <Card.Body className="d-flex flex-column">
              <h5 className="fw-bold text-success">{service.title}</h5>
              <p className="text-muted small">{service.desc}</p>
              <Button variant="outline-success" className="mt-auto">Launch Service</Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </div>
);
export default Services;