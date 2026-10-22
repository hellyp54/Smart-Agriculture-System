// AgriSmart Soil Monitoring Page - Premium Live Data Version
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Button, Spinner } from 'react-bootstrap';
import { Activity, Droplets, Thermometer, Wind, TrendingUp, Download, Zap, RefreshCw, Trash2 } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Bar, BarChart } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import API from '../services/api';
import './Monitoring.css';

const Monitoring = () => {
  const [activeZone, setActiveZone] = useState('');
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState([]);
  const [zones, setZones] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const searchedAddress = localStorage.getItem('searchedAddress');

  const fetchData = async (zoneId = activeZone) => {
    try {
      setLoading(true);
      const zonesRes = await API.get('/monitoring/zones');
      const zonesData = zonesRes.data || [];
      setZones(zonesData);

      let selectedZone = zoneId;
      if (!selectedZone && zonesData.length > 0) {
        selectedZone = zonesData[0].zoneId || zonesData[0]._id || '';
        setActiveZone(selectedZone);
      }

      const trendsRes = await API.get(`/monitoring/trends${selectedZone ? `?zoneId=${encodeURIComponent(selectedZone)}` : ''}`);
      const insightsRes = await API.get('/monitoring/insights');

      const sortedTrends = [...(trendsRes.data || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setTrends(sortedTrends.map(d => ({
        ...d,
        date: d.timestamp ? new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '',
        nitrogen: d.metrics?.nitrogen ?? 0,
        phosphorus: d.metrics?.phosphorus ?? 0,
        potassium: d.metrics?.potassium ?? 0,
        organic: d.metrics?.organic ?? 0
      })));
      
      setInsights(insightsRes.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      await API.delete(`/monitoring/zones/${id}`);
      fetchData();
    } catch (error) { console.error("Failed to delete zone", error); }
  };

  const handleDeleteInsight = async (id) => {
    try {
      await API.delete(`/monitoring/insights/${id}`);
      fetchData();
    } catch (error) { console.error("Failed to delete insight", error); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, [activeZone]);

  const handleExportData = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    doc.setFontSize(20);
    doc.text(`AgriSmart Farm Analysis Report`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Zone: ${activeZone}`, 14, 32);
    doc.text(`Date: ${date}`, 14, 40);

    const latest = trends[trends.length - 1];
    if (latest) {
      doc.setFontSize(14);
      doc.text(`Latest Soil Metrics`, 14, 52);
      autoTable(doc, {
        startY: 56,
        head: [['Moisture', 'Temperature', 'pH Level', 'Nitrogen', 'Phosphorus', 'Potassium', 'Organic']],
        body: [[
          `${Math.round(latest.metrics.moisture)}%`,
          `${latest.metrics.temperature.toFixed(1)}°C`,
          latest.metrics.ph.toFixed(1),
          `${Math.round(latest.metrics.nitrogen)} ppm`,
          `${Math.round(latest.metrics.phosphorus)} ppm`,
          `${Math.round(latest.metrics.potassium)} ppm`,
          `${latest.metrics.organic}%`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] }
      });
    }

    if (insights.length > 0) {
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 70;
      doc.setFontSize(14);
      doc.text(`Agronomist AI Insights`, 14, finalY);
      
      const insightData = insights.map(i => [
        new Date(i.timestamp).toLocaleString(),
        i.title,
        i.message
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Time', 'Alert Type', 'Recommendation']],
        body: insightData,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210] },
        columnStyles: { 2: { cellWidth: 100 } }
      });
    }

    doc.save(`AgriSmart_Report_${activeZone}_${date.replace(/\//g, '-')}.pdf`);
  };

  const latestData = trends[trends.length - 1] || null;

  const metrics = [
    { label: 'MOISTURE', value: latestData?.metrics?.moisture != null ? `${Math.round(latestData.metrics.moisture)}%` : '--', icon: <Droplets />, status: latestData?.status || 'Searching...', color: 'primary' },
    { label: 'TEMPERATURE', value: latestData?.metrics?.temperature != null ? `${latestData.metrics.temperature.toFixed(1)}°C` : '--', icon: <Thermometer />, status: 'Optimal', color: 'danger' },
    { label: 'PH LEVEL', value: latestData?.metrics?.ph != null ? latestData.metrics.ph.toFixed(1) : '--', icon: <Activity />, status: 'Stable', color: 'success' },
    { label: 'NITROGEN', value: latestData?.metrics?.nitrogen != null ? `${Math.round(latestData.metrics.nitrogen)} ppm` : '--', icon: <TrendingUp />, status: 'High', color: 'warning' },
  ];

  if (loading && trends.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="p-4 monitoring-container">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h6 className="text-muted small fw-bold text-uppercase tracking-wider">SOIL ANALYTICS</h6>
          <h2 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Real-Time Field Telemetry</h2>
        </div>
        <div className="d-flex flex-column align-items-end gap-2">
          <Badge bg="white" className="px-3 py-2 text-dark border shadow-sm d-flex align-items-center">
            <span className="pulse-dot"></span>
            LIVE STATUS
          </Badge>
          <small className="text-muted">Last synced: {lastUpdated.toLocaleTimeString()}</small>
        </div>
      </div>

      {/* Real-Time Metrics */}
      <Row className="g-4 mb-4">
        {metrics.map((m, idx) => (
          <Col md={3} key={idx}>
            <Card className="glass-card p-4 h-100">
              <div className="d-flex justify-content-between mb-3">
                <div className={`p-2 rounded bg-${m.color} bg-opacity-10 text-${m.color}`}>{m.icon}</div>
                <Badge bg="light" className={`text-${m.color === 'warning' ? 'dark' : m.color} border px-2 py-1`}>{m.status}</Badge>
              </div>
              <h6 className="text-muted small fw-bold">{m.label}</h6>
              <h3 className="fw-bold my-1 metric-value">{m.value}</h3>
              <ProgressBar now={latestData ? (latestData.metrics.moisture) : 0} variant={m.color} style={{ height: '4px' }} className="mt-2" />
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        {/* Soil Health Trends */}
        <Col lg={12}>
          <Card className="glass-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div className="d-flex align-items-center gap-3 mb-1">
                  <h5 className="fw-bold mb-0">Soil Health Trends (NPK)</h5>
                  <select 
                    className="form-select form-select-sm shadow-sm" 
                    style={{ width: 'auto', fontWeight: 'bold', cursor: 'pointer' }} 
                    value={activeZone} 
                    onChange={e => setActiveZone(e.target.value)}
                  >
                    {zones.length > 0 ? (
                      Array.from(new Set(zones.map(z => z.zoneId || z._id))).map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))
                    ) : (
                      <option value={activeZone}>{activeZone}</option>
                    )}
                  </select>
                </div>
                <p className="small text-muted mb-0">Nutrient composition levels over the last 7 days</p>
              </div>

            </div>
            <div style={{ height: '300px', width: '100%' }} className="chart-container">
              {trends.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>Awaiting sensor data...</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorNit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="nitrogen" name="Nitrogen" stroke="#2E7D32" fillOpacity={1} fill="url(#colorNit)" strokeWidth={3} />
                    <Area type="monotone" dataKey="potassium" name="Potassium" stroke="#1976D2" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="phosphorus" name="Phosphorus" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Agronomist Insights */}
        <Col lg={4}>
          <Card className="glass-card p-4 h-100 bg-dark text-white border-0 shadow-lg">
            <div className="d-flex justify-content-between align-items-center mb-4">
               <h5 className="fw-bold mb-0">Agronomist AI Insights</h5>
               <Badge bg="success" className="rounded-pill px-2">v2.4</Badge>
            </div>
            <div className="space-y-4 activity-log pe-2">
              {insights.filter(i => !i.zoneId || i.zoneId === activeZone || i.title.includes(activeZone)).map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-3 border-start border-${insight.type} border-4 mb-3 position-relative`} style={{ backgroundColor: insight.type === 'warning' ? '#fffbeb' : '#fef2f2' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className={`fw-bold mb-1 pe-4`} style={{ color: insight.type === 'warning' ? '#d97706' : '#dc2626' }}>{insight.title}</h6>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <Button variant="link" className="p-0 text-dark opacity-50 hover-opacity-100" onClick={() => handleDeleteInsight(insight._id)}>
                        <Trash2 size={14} />
                      </Button>
                      <small className="opacity-50 text-dark" style={{ fontSize: '0.65rem' }}>{new Date(insight.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </div>
                  </div>
                  <p className="small mb-0 text-dark opacity-75">{insight.message}</p>
                </div>
              ))}
              {insights.filter(i => !i.zoneId || i.zoneId === activeZone || i.title.includes(activeZone)).length === 0 && <p className="text-center opacity-50 py-4 text-dark">No new insights detected today.</p>}
            </div>

          </Card>
        </Col>

        {/* Zone Status Grid */}
        <Col lg={8}>
          <Card className="glass-card overflow-hidden border-0">
            <div className="p-4 bg-white bg-opacity-50 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Multi-Zone Telemetry Grid</h5>
              <Badge bg="light" className="text-dark border">{zones.length} ACTIVE ZONES</Badge>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0 custom-table">
                <thead className="bg-light bg-opacity-50">
                  <tr className="small text-muted text-uppercase">
                    <th className="px-4 py-3">Zone / Segment</th>
                    <th className="py-3">Moisture</th>
                    <th className="py-3">Temp</th>
                    <th className="py-3">Soil pH</th>
                    <th className="py-3">Nutrient Status</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((row, i) => (
                    <tr key={i} className="align-middle border-bottom border-light">
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.status === 'Optimal' ? '#22c55e' : (row.status === 'Attention' || row.status === 'Critical' ? '#ef4444' : '#f59e0b') }}></div>
                            <span className="fw-bold">{searchedAddress || row.zoneId}</span>
                        </div>
                      </td>
                      <td className="py-3">{Math.round(row.metrics.moisture)}%</td>
                      <td className="py-3">{row.metrics.temperature.toFixed(1)}°C</td>
                      <td className="py-3">{row.metrics.ph.toFixed(1)}</td>
                      <td className="py-3">
                        <Badge bg={row.status === 'Optimal' ? 'success' : (row.status === 'Stable' ? 'info' : (row.status === 'Critical' ? 'danger' : 'warning'))} className="px-3 rounded-pill">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-end pe-4">
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteZone(row._id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-muted">Awaiting sensor data...</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Monitoring;