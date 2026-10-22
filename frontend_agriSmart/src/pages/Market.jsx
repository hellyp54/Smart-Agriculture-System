import React, { useEffect, useState } from "react";
import { Row, Col, Card, Table, Spinner } from "react-bootstrap";
import API from "../services/api";

const Market = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get("/market/prices")
      .then((res) => {
        setPrices(res.data || []);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch market prices:", err);
        setError("Failed to load market data");
        setLoading(false);
      });
  }, []);

  // find top performer (highest price)
  const topPerformer = prices.length
    ? [...prices].sort((a, b) => b.price - a.price)[0]
    : null;

  return (
    <div>
      <h2 className="mb-4 fw-bold">Market Prices</h2>

      {/* TOP PERFORMER CARD */}
      {topPerformer && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="bg-success text-white border-0 shadow-sm p-3 text-center">
              <h6>Top Performer</h6>
              <h4>{topPerformer.cropName}</h4>
              <h5 className="fw-bold">
                ${topPerformer.price}{" "}
                <small>
                  {topPerformer.trend === "up" ? "+📈" : "-📉"}
                </small>
              </h5>
            </Card>
          </Col>
        </Row>
      )}

      {/* TABLE */}
      <Card className="border-0 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <p className="text-center text-danger p-4">{error}</p>
        ) : prices.length === 0 ? (
          <p className="text-center text-muted p-4">No market data available</p>
        ) : (
          <Table hover responsive>
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Trend</th>
              </tr>
            </thead>

            <tbody>
              {prices.map((crop, idx) => (
                <tr key={idx}>
                  <td>{crop.cropName}</td>

                  <td className="fw-bold">${crop.price}</td>

                  <td>{crop.unit}</td>

                  <td>
                    <span
                      style={{
                        color: crop.trend === "up" ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {crop.trend === "up" ? "↑ Up" : "↓ Down"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Market;