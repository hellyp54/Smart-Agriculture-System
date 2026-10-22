import React, { useEffect, useState } from "react";
import { Card, Badge, ListGroup, Spinner, Button } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import API from "../services/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await API.get("/monitoring/insights"); // Uses our new secured route
      setAlerts(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDeleteAlert = async (id) => {
    try {
      await API.delete(`/monitoring/insights/${id}`);
      fetchAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  // 🕒 Helper: format time
  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 fw-bold">My Notifications</h2>

      <Card className="border-0 shadow-sm glass-card">
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="success" />
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-center p-5 text-muted">No active alerts for your zones.</p>
        ) : (
          <ListGroup variant="flush">
            {alerts.map((alert) => (
              <ListGroup.Item key={alert._id} className="p-4 bg-transparent border-bottom">
                
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Badge
                    bg={
                      alert.type === "danger" || alert.type === "Critical"
                        ? "danger"
                        : alert.type === "warning" || alert.type === "Warning"
                        ? "warning"
                        : "info"
                    }
                    text={alert.type === "warning" || alert.type === "Warning" ? "dark" : "light"}
                    className="px-3 py-2 rounded-pill"
                  >
                    {alert.title || alert.type}
                  </Badge>

                  <div className="d-flex align-items-center gap-3">
                    <small className="text-muted">
                      {getTimeAgo(alert.timestamp || alert.createdAt)}
                    </small>
                    <Button variant="link" className="p-0 text-danger opacity-75 hover-opacity-100" onClick={() => handleDeleteAlert(alert._id)}>
                        <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Message */}
                <p className="mb-0 mt-2 opacity-75">{alert.message}</p>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card>
    </div>
  );
};

export default Alerts;