import React, { useEffect, useState } from "react";
import { Row, Col, Card, Form } from "react-bootstrap";
import "./Dashboard.css";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
  FeatureGroup,
  Circle,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const Dashboard = () => {
  const [zones, setZones] = useState([]);
  const [data, setData] = useState(null);

  // ✅ Fetch zones
  const fetchZones = async () => {
    const res = await fetch("http://localhost:5000/api/zones");
    const result = await res.json();
    setZones(result);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // ✅ CREATE ZONE (handles circle + polygon)
 const handleCreate = async (e) => {
  console.log("DRAW EVENT TRIGGERED"); // ✅ check this

  const layer = e.layer;
  let geo;

  if (layer instanceof L.Circle) {
    const center = layer.getLatLng();

    geo = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [center.lng, center.lat],
      },
      properties: {
        shape: "circle",
        radius: layer.getRadius(),
      },
    };
  } else {
    geo = layer.toGeoJSON();
  }

  console.log("SENDING GEO:", geo); // ✅ VERY IMPORTANT

  const res = await fetch("http://localhost:5000/api/zones/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Zone",
      geometry: geo,
      soilMoisture: 70,
      temperature: 25,
      humidity: 60,
    }),
  });

  const data = await res.json();
  console.log("SERVER RESPONSE:", data);
};

  // ✅ CLICK ZONE (works for ALL shapes)
  const handleZoneClick = async (zone) => {
    try {
      let lat, lng;

      if (zone.geometry.properties?.shape === "circle") {
        // ✅ circle center
        lng = zone.geometry.geometry.coordinates[0];
        lat = zone.geometry.geometry.coordinates[1];
      } else {
        // ✅ polygon / rectangle
        const coords = zone.geometry.geometry.coordinates[0][0];
        lng = coords[0];
        lat = coords[1];
      }

      const res = await fetch("http://localhost:5000/api/location-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lng }),
      });

      const liveData = await res.json();
      setData(liveData);
    } catch (err) {
      console.error(err);

      // fallback
      setData({
        moisture: zone.soilMoisture,
        temperature: zone.temperature,
        humidity: zone.humidity,
      });
    }
  };

  // ✅ Zone color (vitality map)
  const getZoneStyle = (zone) => {
    const m = zone.soilMoisture;

    return {
      color: m > 60 ? "green" : m > 40 ? "orange" : "red",
      weight: 2,
      fillOpacity: 0.4,
    };
  };

  return (
    <div className="d-flex">
      <div className="main-content flex-grow-1 p-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between mb-4">
          <Form.Control
            placeholder="Search fields..."
            style={{ width: "300px" }}
          />
          <div>👤</div>
        </div>

        {/* STATS */}
        <Row className="mb-4">
          <Col>
            <StatCard title="Soil Moisture" value={data?.moisture || "--"} />
          </Col>
          <Col>
            <StatCard title="Temperature" value={data?.temperature || "--"} />
          </Col>
          <Col>
            <StatCard title="Humidity" value={data?.humidity || "--"} />
          </Col>
          <Col>
            <StatCard title="System" value="Optimal" />
          </Col>
        </Row>

        {/* MAIN */}
        <Row>
          <Col md={8}>
            <Card>
              <Card.Body className="p-0">
                <MapContainer
                  center={[21.1702, 72.8311]}
                  zoom={13}
                  style={{ height: "500px" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {/* DRAW TOOL */}
                  <FeatureGroup>
                    <EditControl
                      position="topright"
                      onCreated={handleCreate}
                      draw={{
                        rectangle: true,
                        polygon: true,
                        circle: true, // ✅ enabled
                        marker: false,
                      }}
                    />
                  </FeatureGroup>

                  {/* ZONES */}
                  {zones.map((zone, i) => {
                    const isCircle =
                      zone.geometry.properties?.shape === "circle";

                    if (isCircle) {
                      const [lng, lat] =
                        zone.geometry.geometry.coordinates;

                      return (
                        <Circle
                          key={i}
                          center={[lat, lng]}
                          radius={zone.geometry.properties.radius}
                          pathOptions={getZoneStyle(zone)}
                          eventHandlers={{
                            click: () => handleZoneClick(zone),
                          }}
                        >
                          <Popup>
                            <b>{zone.name}</b>
                            <br />
                            Soil: {zone.soilMoisture}%
                            <br />
                            Temp: {zone.temperature}°C
                            <br />
                            Humidity: {zone.humidity}%
                          </Popup>
                        </Circle>
                      );
                    }

                    return (
                      <GeoJSON
                        key={i}
                        data={zone.geometry}
                        style={getZoneStyle(zone)}
                        eventHandlers={{
                          click: () => handleZoneClick(zone),
                        }}
                      >
                        <Popup>
                          <b>{zone.name}</b>
                          <br />
                          Soil: {zone.soilMoisture}%
                          <br />
                          Temp: {zone.temperature}°C
                          <br />
                          Humidity: {zone.humidity}%
                        </Popup>
                      </GeoJSON>
                    );
                  })}
                </MapContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* ALERTS */}
          <Col md={4}>
            <div className="alert alert-danger">
              Soil Moisture: {data?.moisture || "--"}%
            </div>

            <div className="alert alert-warning">
              Temperature: {data?.temperature || "--"}°C
            </div>

            <div className="alert alert-info">
              Humidity: {data?.humidity || "--"}%
            </div>

            {data && data.moisture < 40 && (
              <div className="alert alert-dark">
                ⚠️ Irrigation Recommended
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <Card className="shadow-sm">
    <Card.Body>
      <small className="text-muted">{title}</small>
      <h4 className="fw-bold">{value}</h4>
    </Card.Body>
  </Card>
);

export default Dashboard;