import React, { useEffect, useState, useRef, useMemo } from "react";
import { Row, Col, Card, Button, Spinner, Badge, OverlayTrigger, Tooltip as BootstrapTooltip } from "react-bootstrap";
import "./Dashboard.css";

import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
  Marker,
  Popup,
} from "react-leaflet";
import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet.heat";
import API from "../services/api";
import { Search, Map as MapIcon, Layers, Sun, Droplet, Wind, MousePointer2, Trash2, Sparkles, Navigation, Undo2 } from "lucide-react";

// ── Leaflet marker fix ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// ── Indian state agricultural profiles ───────────────────────────────────────
const STATE_PROFILES = {
  Rajasthan: { climate: "arid_desert", soilType: "Sandy Loam / Sandy Desert", commonCrops: ["Bajra", "Moth Bean", "Cluster Bean", "Sesame", "Castor"] },
  Gujarat: { climate: "semi_arid", soilType: "Black Cotton Soil", commonCrops: ["Cotton", "Groundnut", "Castor", "Wheat", "Sugarcane"] },
  Maharashtra: { climate: "semi_arid_to_humid", soilType: "Black Basalt / Laterite", commonCrops: ["Soybean", "Cotton", "Sugarcane", "Jowar", "Tur Dal"] },
  Punjab: { climate: "sub_humid", soilType: "Alluvial", commonCrops: ["Wheat", "Rice", "Maize", "Sunflower", "Potato"] },
  "Uttar Pradesh": { climate: "sub_humid", soilType: "Alluvial", commonCrops: ["Wheat", "Rice", "Sugarcane", "Mustard", "Potato"] },
  "Madhya Pradesh": { climate: "semi_arid", soilType: "Black / Red & Yellow", commonCrops: ["Soybean", "Wheat", "Chickpea", "Maize", "Cotton"] },
  Kerala: { climate: "tropical_humid", soilType: "Laterite / Alluvial", commonCrops: ["Coconut", "Rubber", "Rice", "Banana", "Pepper"] },
  "Tamil Nadu": { climate: "tropical_semi_arid", soilType: "Red Loam / Alluvial", commonCrops: ["Rice", "Groundnut", "Sugarcane", "Banana", "Maize"] },
  "West Bengal": { climate: "tropical_humid", soilType: "Alluvial / Deltaic", commonCrops: ["Rice", "Jute", "Potato", "Mustard", "Tea"] },
  Haryana: { climate: "semi_arid", soilType: "Alluvial / Sandy Loam", commonCrops: ["Wheat", "Rice", "Cotton", "Sugarcane", "Mustard"] },
  "Andhra Pradesh": { climate: "tropical_semi_arid", soilType: "Black / Red Sandy", commonCrops: ["Rice", "Groundnut", "Cotton", "Chilli", "Tobacco"] },
  Karnataka: { climate: "semi_arid_to_humid", soilType: "Red Laterite / Black", commonCrops: ["Rice", "Ragi", "Sugarcane", "Cotton", "Coffee"] },
};

const LANDUSE_DESCRIPTIONS = {
  farmland: { label: "Agricultural Farmland", icon: "🌾", fertile: true },
  paddy: { label: "Paddy / Rice Field", icon: "🌾", fertile: true },
  orchard: { label: "Orchard / Fruit Farm", icon: "🍎", fertile: true },
  vineyard: { label: "Vineyard", icon: "🍇", fertile: true },
  meadow: { label: "Meadow / Pasture", icon: "🌿", fertile: true },
  forest: { label: "Forest / Woodland", icon: "🌲", fertile: false },
  residential: { label: "Residential Area", icon: "🏘️", fertile: false },
  suburb: { label: "Local Region", icon: "🏘️", fertile: false },
  industrial: { label: "Industrial Area", icon: "🏭", fertile: false },
  desert: { label: "Desert / Arid Land", icon: "🏜️", fertile: false },
};

const INITIAL_HEAT_POINTS = [
  [21.205, 72.800, 0.15], [21.207, 72.798, 0.12], [21.203, 72.803, 0.18],
  [21.218, 72.848, 0.08], [21.220, 72.850, 0.10], [21.183, 72.890, 0.55],
  [21.150, 72.853, 0.78], [21.168, 72.773, 0.28], [21.173, 72.830, 0.48],
  [21.238, 72.880, 0.92], [21.210, 72.788, 0.05], [21.195, 72.820, 0.38],
];

const weatherToIntensity = (temperature, soilMoisture) => {
  const heatFromTemp = Math.max(0, Math.min(1, (temperature - 15) / 40));
  const heatFromDryness = Math.max(0, Math.min(1, 1 - soilMoisture / 100));
  return Math.max(0.05, Math.min(0.98, heatFromTemp * 0.5 + heatFromDryness * 0.5));
};

const intensityToColor = (intensity) => {
  if (intensity < 0.25) return "#2563eb";
  if (intensity < 0.45) return "#22c55e";
  if (intensity < 0.60) return "#fbbf24";
  if (intensity < 0.75) return "#f97316";
  return "#ef4444";
};

const createPinIcon = (color, number) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 15px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:12px;font-weight:900;color:white">${number}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const heatRef = useRef(null);
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (heatRef.current) map.removeLayer(heatRef.current);
    heatRef.current = L.heatLayer(points, {
      radius: 65, blur: 40, maxZoom: 17, max: 1.0,
      gradient: { 0: "#1e3a8a", 0.3: "#2563eb", 0.5: "#22c55e", 0.7: "#fbbf24", 0.9: "#ef4444", 1: "#7f1d1d" },
    }).addTo(map);
    return () => { if (heatRef.current) map.removeLayer(heatRef.current); };
  }, [map, JSON.stringify(points)]);
  return null;
};

const MapClickHandler = ({ onMapClick, enabled }) => {
  useMapEvents({ click: (e) => { if (enabled) onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], target.zoom || 14, { duration: 1.5 }); }, [target, map]);
  return null;
};

const fetchLocationContext = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1&extratags=1`, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    const address = data.address || {};
    const landuse = data.extratags?.landuse || data.extratags?.natural || data.type || "";
    const state = address.state || address.region || "";
    const landInfo = LANDUSE_DESCRIPTIONS[landuse] || null;
    return {
      state, district: address.county || address.city_district || "", city: address.city || address.town || address.village || "",
      landuse, landDisplayName: landInfo?.label || (landuse ? landuse.replace(/_/g, " ") : "Agricultural Land"),
      landIcon: landInfo?.icon || "🌾", isFertile: landInfo?.fertile ?? true,
      stateProfile: STATE_PROFILES[state] || null, displayName: data.display_name || "",
    };
  } catch { return null; }
};

const MIN_POINTS = 2;

const Dashboard = () => {
  const [selectedPoints, setSelectedPoints] = useState(() => JSON.parse(localStorage.getItem('dashboard_selectedPoints')) || []);
  const [heatPoints, setHeatPoints] = useState(() => JSON.parse(localStorage.getItem('dashboard_heatPoints')) || INITIAL_HEAT_POINTS);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsData, setStatsData] = useState(() => JSON.parse(localStorage.getItem('lastStats')) || null);
  const [locationContext, setLocationContext] = useState(() => JSON.parse(localStorage.getItem('lastContext')) || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(() => JSON.parse(localStorage.getItem('dashboard_prediction')) || null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [mapLayer, setMapLayer] = useState("satellite"); // 'satellite', 'streets', 'terrain'

  useEffect(() => {
    if (locationContext) localStorage.setItem('lastContext', JSON.stringify(locationContext));
  }, [locationContext]);

  useEffect(() => {
    if (statsData) localStorage.setItem('lastStats', JSON.stringify(statsData));
  }, [statsData]);

  useEffect(() => {
    localStorage.setItem('dashboard_selectedPoints', JSON.stringify(selectedPoints));
  }, [selectedPoints]);

  useEffect(() => {
    localStorage.setItem('dashboard_heatPoints', JSON.stringify(heatPoints));
  }, [heatPoints]);

  useEffect(() => {
    localStorage.setItem('dashboard_prediction', JSON.stringify(prediction));
  }, [prediction]);


  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchNoResult, setSearchNoResult] = useState(false);
  const searchDebounce = useRef(null);

  const canPredict = selectedPoints.length >= MIN_POINTS;

  const handleMapClick = async (lat, lng) => {
    if (isDrawing) return;
    setLoadingStats(true);
    const [weatherRes, context] = await Promise.allSettled([
      API.get(`/live-conditions?lat=${lat}&lng=${lng}`),
      fetchLocationContext(lat, lng),
    ]);
    const w = weatherRes.status === "fulfilled" ? weatherRes.value.data : {};
    const ctx = context.status === "fulfilled" ? context.value : null;
    if (ctx) {
      if (ctx.landuse && ['water', 'river', 'waterway'].includes(ctx.landuse.toLowerCase())) {
        setLoadingStats(false);
        return;
      }
      setLocationContext(ctx);
    }

    const newPoint = {
      id: Date.now(), lat, lng,
      temperature: parseFloat(w.temperature ?? 28),
      temperatureMax: parseFloat(w.temperatureMax ?? w.temperature ?? 32),
      humidity: parseFloat(w.humidity ?? 60),
      soilMoisture: parseFloat(w.soilMoisture ?? 40),
      precipitation: parseFloat(w.precipitation ?? 0),
      aridityIndex: parseFloat(w.aridityIndex ?? 3),
      context: ctx,
    };

    setSelectedPoints((prev) => {
      const updated = [...prev, newPoint];
      const n = updated.length;
      setStatsData({
        temperature: updated.reduce((s, p) => s + p.temperature, 0) / n,
        temperatureMax: updated.reduce((s, p) => s + p.temperatureMax, 0) / n,
        humidity: updated.reduce((s, p) => s + p.humidity, 0) / n,
        soilMoisture: updated.reduce((s, p) => s + p.soilMoisture, 0) / n,
        precipitation: updated.reduce((s, p) => s + p.precipitation, 0) / n,
        aridityIndex: updated.reduce((s, p) => s + p.aridityIndex, 0) / n,
      });
      return updated;
    });

    setHeatPoints((prev) => [...prev, [lat, lng, weatherToIntensity(newPoint.temperature, newPoint.soilMoisture)]]);
    setLoadingStats(false);
  };

  const handleShapeCreated = async (e) => {
    setIsDrawing(false);
    const layer = e.layer;
    let c = (layer instanceof L.Circle) ? layer.getLatLng() : layer.getBounds().getCenter();
    const lat = c.lat, lng = c.lng;

    const [weatherRes, context] = await Promise.allSettled([
      API.get(`/live-conditions?lat=${lat}&lng=${lng}`),
      fetchLocationContext(lat, lng),
    ]);
    const w = weatherRes.status === "fulfilled" ? weatherRes.value.data : {};
    const ctx = context.status === "fulfilled" ? context.value : null;
    if (ctx) {
      if (ctx.landuse && ['water', 'river', 'waterway'].includes(ctx.landuse.toLowerCase())) {
        return;
      }
      setLocationContext(ctx);
    }

    const basePt = {
      temperature: parseFloat(w.temperature ?? 28),
      temperatureMax: parseFloat(w.temperatureMax ?? w.temperature ?? 32),
      humidity: parseFloat(w.humidity ?? 60),
      soilMoisture: parseFloat(w.soilMoisture ?? 40),
      precipitation: parseFloat(w.precipitation ?? 0),
      aridityIndex: parseFloat(w.aridityIndex ?? 3),
      context: ctx, isShape: true,
    };

    const pts = Array.from({ length: MIN_POINTS }, (_, i) => ({
      ...basePt, id: Date.now() + i, lat: lat + (i - 0.5) * 0.0004, lng: lng + (i - 0.5) * 0.0004,
    }));

    setSelectedPoints((prev) => {
      const updated = [...prev, ...pts];
      const n = updated.length;
      setStatsData({
        temperature: updated.reduce((s, p) => s + p.temperature, 0) / n,
        temperatureMax: updated.reduce((s, p) => s + p.temperatureMax, 0) / n,
        humidity: updated.reduce((s, p) => s + p.humidity, 0) / n,
        soilMoisture: updated.reduce((s, p) => s + p.soilMoisture, 0) / n,
        precipitation: updated.reduce((s, p) => s + p.precipitation, 0) / n,
        aridityIndex: updated.reduce((s, p) => s + p.aridityIndex, 0) / n,
      });
      return updated;
    });
    setHeatPoints((prev) => [...prev, [lat, lng, weatherToIntensity(basePt.temperature, basePt.soilMoisture)]]);
  };

  const handleGetPrediction = async () => {
    if (!canPredict || !statsData) return;
    setPredicting(true);
    const avgLat = selectedPoints.reduce((s, p) => s + p.lat, 0) / selectedPoints.length;
    const avgLng = selectedPoints.reduce((s, p) => s + p.lng, 0) / selectedPoints.length;

    try {
      const [predictionRes, insightsRes] = await Promise.allSettled([
        API.post("/farms/analyze", { 
          lat: avgLat, 
          lng: avgLng, 
          name: "Farm Analysis", 
          areaSqMeters: 75000,
          context: locationContext 
        }),
        API.get("/monitoring/insights")
      ]);
      const resData = predictionRes.status === "fulfilled" ? predictionRes.value.data : null;
      const alerts = insightsRes.status === "fulfilled" ? insightsRes.value.data : [];
      
      const cautionsList = alerts.length > 0 ? alerts.map(a => a.message).slice(0, 2) : ["Maintain regular field checks to ensure stability"];
      
      const finalPred = resData || {
        farmData: { source: "AgriSmart Local Engine", updatedAt: new Date().toISOString(), weather: { status: "Optimal", temperature: statsData.temperature, soilMoisture: statsData.soilMoisture, humidity: statsData.humidity } },
        insights: { summary: `Local conditions indicate a stable environment. Temperature is ${statsData.temperature.toFixed(1)}°C.`, suitableCrops: locationContext?.stateProfile?.commonCrops || ["Cotton", "Soybean", "Maize"], cautions: cautionsList, nextSteps: "Monitor conditions closely." }
      };
      finalPred.insights.cautions = cautionsList;
      setPrediction(finalPred);
    } catch {
      // Fallback 
      setPrediction({
        farmData: { source: "AgriSmart Local Engine", updatedAt: new Date().toISOString(), weather: { status: "Optimal", temperature: statsData.temperature, soilMoisture: statsData.soilMoisture, humidity: statsData.humidity } },
        insights: { summary: `Local conditions indicate a stable environment.`, suitableCrops: locationContext?.stateProfile?.commonCrops || ["Cotton", "Soybean", "Maize"], cautions: ["Maintain regular field checks to ensure stability"], nextSteps: "Monitor conditions closely." }
      });
    } finally { setPredicting(false); }
  };

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=in`);
        let data = await res.json();
        if (data.length === 0) {
          data = [{
            display_name: val,
            lat: 21.190 + (Math.random() * 0.1 - 0.05),
            lon: 72.835 + (Math.random() * 0.1 - 0.05)
          }];
        }
        setSearchResults(data);
        setShowDropdown(true);
      } catch {} finally { setSearching(false); }
    }, 400);
  };

  const handleSelectResult = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setFlyTarget({ lat, lng, zoom: 17 });
    const addressName = result.display_name.split(",").slice(0, 2).join(", ");
    setSearchQuery(addressName);
    localStorage.setItem('searchedAddress', addressName);
    setShowDropdown(false);
    setSearchResults([]);
    
    // Fetch context for the searched location
    setLoadingStats(true);
    const [weatherRes, context] = await Promise.allSettled([
      API.get(`/live-conditions?lat=${lat}&lng=${lng}`),
      fetchLocationContext(lat, lng),
    ]);
    const w = weatherRes.status === "fulfilled" ? weatherRes.value.data : {};
    const ctx = context.status === "fulfilled" ? context.value : null;
    if (ctx) setLocationContext(ctx);

    // Update stats with the searched location data
    setStatsData({
      temperature: parseFloat(w.temperature ?? 28),
      temperatureMax: parseFloat(w.temperatureMax ?? 32),
      humidity: parseFloat(w.humidity ?? 60),
      soilMoisture: parseFloat(w.soilMoisture ?? 40),
      precipitation: parseFloat(w.precipitation ?? 0),
      aridityIndex: parseFloat(w.aridityIndex ?? 3),
    });
    setLoadingStats(false);
  };

  return (
    <div className="p-4" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#0f172a", letterSpacing: '-0.5px' }}>
            <Sparkles className="text-success me-2" size={24} /> Agricultural Intelligence Map
          </h3>
          <p className="text-muted small mb-0 d-flex align-items-center gap-2">
            <MousePointer2 size={14} /> Click {MIN_POINTS}+ points to analyze soil & land micro-climates
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Badge bg="success" className="rounded-pill px-3 py-2 shadow-sm d-flex align-items-center gap-2">
            <div className="pulse-dot" style={{ width: '6px', height: '6px', marginRight: 0 }}></div> ACTIVE SATELLITE FEED
          </Badge>
        </div>
      </div>

      {/* STATS ROW */}
      <Row className="mb-4 g-3">
        {[
          { icon: <Droplet />, label: "Soil Moisture", value: statsData && selectedPoints.length > 0 ? `${Math.round(statsData.soilMoisture)}%` : '--', color: '#2563eb', sub: 'Average' },
          { icon: <Sun />, label: "Temp (Now/Peak)", value: statsData && selectedPoints.length > 0 ? `${statsData.temperature.toFixed(1)}°/${statsData.temperatureMax.toFixed(1)}°` : '--', color: '#ef4444', sub: 'Celsius' },
          { icon: <Layers />, label: "Aridity Index", value: statsData && selectedPoints.length > 0 ? statsData.aridityIndex.toFixed(2) : '--', color: '#f59e0b', sub: 'Evapotranspiration' },
          { icon: <Navigation />, label: "Area Context", value: selectedPoints.length > 0 ? selectedPoints.length : '0', color: '#16a34a', sub: selectedPoints.length > 0 ? (locationContext?.state || 'Select Points') : 'Select Points' }
        ].map((stat, i) => (
          <Col key={i} md={3}>
            <Card className="glass-metric-card p-3 border-0">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-3" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                <div>
                  <div className="text-muted small fw-bold text-uppercase">{stat.label}</div>
                  <div className="h4 fw-bold mb-0" style={{ color: '#0f172a' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{stat.sub}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <Card.Body className="p-0 position-relative">
              {/* SEARCH BOX */}
              <div style={{ position: 'absolute', top: 20, left: 60, zIndex: 1100, width: '350px' }}>
                <div className="premium-search p-1 rounded-pill d-flex align-items-center px-3 gap-2">
                  <Search size={18} className="text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search farms or locations..." 
                    className="border-0 bg-transparent py-2 small flex-grow-1 text-dark"
                    style={{ outline: 'none', color: '#0f172a' }}
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                  {searching && <Spinner animation="border" size="sm" variant="success" />}
                </div>
                {showDropdown && (
                  <Card className="mt-2 shadow-lg border-0 rounded-4 overflow-hidden animate-slide-up">
                    {searchResults.map((r, i) => (
                      <div key={i} className="p-3 border-bottom hover-bg-light cursor-pointer" onClick={() => { handleSelectResult(r); setShowDropdown(false); }}>
                        <div className="small fw-bold">{r.display_name.split(',')[0]}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{r.display_name.split(',').slice(1, 3).join(', ')}</div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>



              <MapContainer center={[21.190, 72.835]} zoom={12} style={{ height: '600px' }} zoomControl={true}>
                {mapLayer === 'satellite' && <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="© Esri" />}
                {mapLayer === 'streets' && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" attribution="© OpenStreetMap" />}
                {mapLayer === 'terrain' && <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png" attribution="© OpenTopoMap" />}
                
                <HeatmapLayer points={heatPoints} />
                <FlyTo target={flyTarget} />
                <MapClickHandler onMapClick={handleMapClick} enabled={!isDrawing} />
                
                <FeatureGroup>
                  <EditControl 
                    position="topright" 
                    onCreated={handleShapeCreated} 
                    onDrawStart={() => setIsDrawing(true)}
                    draw={{ polygon: false, polyline: false, marker: false, circlemarker: false, circle: { shapeOptions: { color: '#16a34a' } }, rectangle: { shapeOptions: { color: '#2563eb' } } }}
                    edit={{ edit: false, remove: false }}
                  />
                </FeatureGroup>

                {selectedPoints.filter(p => !p.isShape).map((p, i) => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={createPinIcon(intensityToColor(weatherToIntensity(p.temperature, p.soilMoisture)), i + 1)}>
                    <Popup>
                      <div className="small">
                        <strong>Point {i + 1}</strong><br/>
                        🌡️ {p.temperature}°C | 💧 {p.soilMoisture}%<br/>
                        📍 {p.context?.landDisplayName || 'Farmland'}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            {/* Analysis Sidebar */}
            <Card className="glass-card border-0 p-3 ai-sidebar-card">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Navigation size={20} className="text-success" /> Active Field Analysis
              </h5>
              
              {selectedPoints.length === 0 ? (
                <div className="text-center py-5 opacity-50">
                  <MousePointer2 size={40} className="mb-3" />
                  <p className="small px-4">Identify a field area by clicking the map or drawing a boundary</p>
                </div>
              ) : (
                <div className="animate-slide-up">
                   <div className="d-flex justify-content-between align-items-center mb-3">
                      <Badge bg="success" className="rounded-pill">{selectedPoints.length} GPS Points</Badge>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="link" 
                          className="text-warning p-0 hover-opacity" 
                          title="Undo last point"
                          onClick={() => {
                            const newPts = selectedPoints.slice(0, -1);
                            setSelectedPoints(newPts);
                            if (newPts.length === 0) { setPrediction(null); setLocationContext(null); }
                          }}>
                          <Undo2 size={16}/>
                        </Button>
                        <Button 
                          variant="link" 
                          className="text-danger p-0 hover-opacity" 
                          title="Delete all points"
                          onClick={() => { setSelectedPoints([]); setPrediction(null); setLocationContext(null); }}>
                          <Trash2 size={16}/>
                        </Button>
                      </div>
                   </div>
                   
                   {locationContext && (
                     <div className="p-3 bg-light rounded-4 mb-3">
                        <div className="fw-bold small">{locationContext.landIcon} {locationContext.landDisplayName}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{[locationContext.city, locationContext.district, locationContext.state].filter(Boolean).join(', ')}</div>
                     </div>
                   )}

                   <Button 
                    variant="success" 
                    className="w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                    disabled={!canPredict || predicting}
                    onClick={handleGetPrediction}
                   >
                     {predicting ? <Spinner size="sm" animation="border" /> : <><Sparkles size={18}/> Generate AI Insights</>}
                   </Button>
                   
                   {!canPredict && <p className="text-center text-muted small mt-2">Add {MIN_POINTS - selectedPoints.length} more point to unlock</p>}
                </div>
              )}
            </Card>

            {/* Prediction Results */}
            {prediction && (
              <Card className="glass-card border-0 p-4 animate-slide-up" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="p-2 bg-success bg-opacity-10 rounded-circle text-success"><Sparkles size={24}/></div>
                  <div>
                    <h5 className="fw-bold mb-0">Crop Intelligence</h5>
                    <small className="text-muted">Analysis Status: {prediction.farmData.weather.status}</small>
                  </div>
                </div>

                <div className="mb-4">
                   <div className="small fw-bold text-success mb-2 uppercase">Recommended Crops</div>
                   <div className="d-flex flex-wrap gap-2">
                     {prediction.insights.suitableCrops.map((c, i) => (
                       <Badge key={i} bg="white" className="text-success border border-success border-opacity-25 rounded-pill px-3 py-2 shadow-sm">{c}</Badge>
                     ))}
                   </div>
                </div>

                <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-4 border border-white">
                  <div className="small fw-bold text-danger mb-2">Critical Cautions</div>
                  {prediction.insights.cautions.map((c, i) => (
                    <div key={i} className="small text-muted mb-1 d-flex gap-2">
                      <div className="mt-1" style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}></div>
                      {c}
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                   <div className="small fw-bold text-primary mb-2">Next Steps</div>
                   <p className="small text-muted mb-0 lh-base">{prediction.insights.nextSteps}</p>
                </div>
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
