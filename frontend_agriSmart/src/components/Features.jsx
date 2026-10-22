import React from "react";
import { Container, Row, Col, Card, ProgressBar } from "react-bootstrap";

function Features() {
  const features = [
    {
      type: "monitoring",
      title: "Real-Time Field Telemetry",
      description: "Monitor NPK, moisture, and pH levels across your farm with sub-meter accuracy using our satellite-connected sensor arrays.",
      image: "https://images.unsplash.com/photo-1592982537447-6f2f6a0c5c4e?auto=format&fit=crop&q=80&w=800",
    },
    {
      type: "market",
      title: "Global Market Sync",
      description: "Live commodity prices and demand predictions.",
      data: [
        { name: "Soybeans", price: "+2.4%", status: "up" },
        { name: "Winter Wheat", price: "-0.8%", status: "down" },
        { name: "Corn", price: "+1.1%", status: "up" }
      ]
    },

    {
      type: "cta",
      title: "Ready to Upgrade Your Farm?",
      description: "Join thousands of data-driven farmers maximizing their yield with AgriSmart.",
      buttonText: "Start Free Trial"
    }
  ];

  return (
    <section style={{ background: "#f3f3f3", padding: "80px 20px" }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold">Precision Ecosystem</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: "650px" }}>
            Our modular approach ensures every seed, drop of water, and market fluctuation is optimized for your farm's unique profile.
          </p>
        </div>

        <Row className="g-4">

          {features.map((f, index) => {

            /* ================= MONITORING (BIG CARD) ================= */
            if (f.type === "monitoring") {
              return (
                <Col md={8} key={index}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <Row className="align-items-center">

                        {/* TEXT */}
                        <Col md={6}>
                          

                          <h4 className="fw-bold">{f.title}</h4>
                          
                          <p className="text-muted">{f.description}</p>
                        </Col>

                        <Col md={6}>
                          <img
                            src={f.image}
                            alt="monitoring"
                            style={{
                              width: "100%",
                              height: "200px",
                              objectFit: "cover",
                              borderRadius: "12px",
                            }}
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              );
            }

            /* ================= MARKET SYNC ================= */
            if (f.type === "market") {
              return (
                <Col md={4} key={index}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>

                      <h4 className="fw-bold mt-2">{f.title}</h4>
                      <p className="text-muted small">{f.description}</p>

                      

                      {/* MARKET DATA */}
                      {f.data?.map((item, i) => (
                        <div
                          key={i}
                          className="d-flex justify-content-between border-bottom py-2"
                        >
                          <span>{item.name}</span>
                          <span
                            style={{
                              color: item.status === "up" ? "green" : "red",
                              fontWeight: "bold",
                            }}
                          >
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
              );
            }

            /* ================= IRRIGATION ================= */
            if (f.type === "irrigation") {
              return (
                <Col md={4} key={index}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>

                      <h4 className="fw-bold mt-2">{f.title}</h4>
                      <p className="text-muted">{f.description}</p>

                      <img
                        src={f.image}
                        alt="irrigation"
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          marginBottom: "15px",
                        }}
                      />

                      {/* PROGRESS BAR */}
                      <ProgressBar now={f.progress} className="mt-3" />
                      <div className="d-flex justify-content-between mt-2 small text-muted">
                        <span>RESERVOIR LEVEL</span>
                        <span>{f.progress}%</span>
                      </div>

                    </Card.Body>
                  </Card>
                </Col>
              );
            }

            /* ================= CTA (BIG CARD) ================= */
            if (f.type === "cta") {
              return (
                <Col md={8} key={index}>
                  <Card
                    className="border-0 shadow text-white"
                    style={{
                      background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                      position: "relative",
                      overflow: "hidden",
                      height: "100%",
                      display: "flex"
                    }}
                  >
                    <Card.Body className="p-4" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>

                      <h3 className="fw-bold">{f.title}</h3>
                      <p className="opacity-75">{f.description}</p>

                      {/* <Button variant="light" className="fw-bold mt-3"> */}
                        {/* {f.buttonText} */}
                      {/* </Button> */}

                    </Card.Body>
                  </Card>
                </Col>
              );
            }

            return null;
          })}
        </Row>
      </Container>
    </section>
  );
}

export default Features;