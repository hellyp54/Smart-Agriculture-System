// AgriSmart Weather Page - Dynamic with Local Storage Data
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { CloudRain, Sun, Thermometer, Wind, Sprout } from 'lucide-react';

const Weather = () => {
  const [context, setContext] = useState(null);
  const [stats, setStats] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedContext = localStorage.getItem('lastContext');
    const savedStats = localStorage.getItem('lastStats');
    if (savedContext) setContext(JSON.parse(savedContext));
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedPoints = localStorage.getItem('dashboard_selectedPoints');
    const points = savedPoints ? JSON.parse(savedPoints) : null;
    const lat = points && points.length > 0 ? points[0][0] : 21.1702;
    const lon = points && points.length > 0 ? points[0][1] : 72.8311;

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,precipitation,wind_speed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        const data = await res.json();
        
        if (data && data.current_weather) {
          const timeIndex = (data.hourly?.time || []).indexOf(data.current_weather.time);
          const safeTimeIndex = timeIndex >= 0 ? timeIndex : 0;
          
          const current = {
            temperature_2m: data.current_weather.temperature,
            relative_humidity_2m: data.hourly?.relativehumidity_2m?.[safeTimeIndex] ?? null,
            wind_speed_10m: data.hourly?.wind_speed_10m?.[safeTimeIndex] ?? data.current_weather.windspeed,
            precipitation: data.hourly?.precipitation?.[safeTimeIndex] ?? 0,
          };
          setWeatherData({ current, daily: data.daily || {} });
        } else {
          setError('Unable to load weather details from API');
        }
      } catch (err) {
        console.error('Failed to fetch weather', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const locationName = context?.displayName?.split(',').slice(0, 2).join(', ') || context?.state || 'Surat, Gujarat';
  
  const temp = weatherData?.current?.temperature_2m ?? (stats?.temperature ?? 24);
  const humidity = weatherData?.current?.relative_humidity_2m ?? (stats?.humidity ?? 42);
  const windSpeed = weatherData?.current?.wind_speed_10m ?? 12;
  const precipitation = weatherData?.current?.precipitation ?? 0;
  const visibility = 15; 

  const soilMoisture = stats?.soilMoisture ?? 30;
  const isRaining = precipitation > 0 || humidity > 85;
  const rainProb = weatherData?.daily?.precipitation_probability_max?.[0] || (isRaining ? 85 : 10);

  const commonCrops = context?.stateProfile?.commonCrops || ['Corn', 'Winter Wheat', 'Soybeans'];

  const getPlantingWindow = (crop, moisture, t) => {
    if (moisture > 60) return { status: 'Poor Now', statusColor: 'danger', window: 'Wait 3-4 days', score: 30, note: 'Wait for soil drainage after heavy moisture.' };
    if (moisture < 20) return { status: 'Poor Now', statusColor: 'danger', window: 'Needs Irrigation', score: 20, note: 'Soil is too dry for optimal germination.' };
    if (t > 30) return { status: 'Acceptable', statusColor: 'warning', window: 'Next Week', score: 65, note: 'Temperatures are slightly high, wait for cooling.' };
    if (t < 15) return { status: 'Acceptable', statusColor: 'warning', window: 'Wait for warmth', score: 60, note: 'Soil temperature needs to rise for optimal growth.' };
    return { status: 'Optimal', statusColor: 'success', window: 'Current Week', score: 95, note: 'Ideal temperature and moisture for seeding.' };
  };

  const plantingWindows = commonCrops.slice(0, 3).map(crop => {
    return { crop, ...getPlantingWindow(crop, soilMoisture, temp) };
  });

  const getNextDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    return Array.from({length: 5}, (_, i) => days[(today + i + 1) % 7]);
  };

  const nextDays = getNextDays();

  const dailyForecast = weatherData?.daily ? Array.from({length: 5}).map((_, i) => {
    const maxTemp = weatherData.daily.temperature_2m_max?.[i+1] || temp;
    const rainProb = weatherData.daily.precipitation_probability_max?.[i+1] || 10;
    return {
      day: nextDays[i],
      temp: `${Math.round(maxTemp)}°`,
      condition: rainProb > 50 ? 'Rain' : (maxTemp > 28 ? 'Sunny' : 'Partly Cloudy'),
      rain: `${rainProb}%`
    };
  }) : [
    { day: nextDays[0], temp: `${temp + 2}°`, condition: temp > 28 ? 'Sunny' : 'Partly Cloudy', rain: '5%' },
    { day: nextDays[1], temp: `${temp}°`, condition: 'Partly Cloudy', rain: '10%' },
    { day: nextDays[2], temp: `${temp - (isRaining ? 5 : 2)}°`, condition: isRaining ? 'Rain' : 'Cloudy', rain: isRaining ? '85%' : '40%' },
    { day: nextDays[3], temp: `${temp - 1}°`, condition: 'Cloudy', rain: '30%' },
    { day: nextDays[4], temp: `${temp + 1}°`, condition: 'Sunny', rain: '0%' }
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h6 className="text-muted small fw-bold text-uppercase">{context?.landDisplayName || 'NORTH PLOT'} TELEMETRY</h6>
        <h2 className="fw-bold">Weather Intelligence</h2>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-warning">{error}</div>
      ) : null}

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm p-4 h-100 overflow-hidden">
            <Row className="align-items-center">
              <Col md={6}>
                <div className="d-flex align-items-center gap-2 text-success mb-2">
                  <span className="p-1 bg-success bg-opacity-10 rounded-circle"><Sun size={16} /></span>
                  <span className="small fw-bold">{locationName}</span>
                </div>
                <h1 className="display-1 fw-black mb-0">{Number(temp).toFixed(2)}°</h1>
                <p className="text-muted">{isRaining ? 'Rainy' : 'Sunny'} • Feels like {Number(temp + 2).toFixed(2)}°</p>
                <div className="d-flex gap-4 mt-4">
                  <div><small className="text-muted d-block">HUMIDITY</small><strong>{humidity}%</strong></div>
                  <div><small className="text-muted d-block">WIND SPEED</small><strong>{windSpeed} km/h</strong></div>
                  <div><small className="text-muted d-block">VISIBILITY</small><strong>{visibility} km</strong></div>
                </div>
              </Col>
              <Col md={6} className="d-none d-md-block">
                <div className="bg-light rounded-4 h-100 d-flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                  {isRaining ? <CloudRain size={80} className="text-muted opacity-25" /> : <Sun size={80} className="text-warning opacity-50" />}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className={`border-0 shadow-sm p-4 h-100 text-white ${isRaining ? 'bg-primary' : 'bg-success'}`}>
            <Badge bg="light" className={`text-${isRaining ? 'primary' : 'success'} mb-3 w-fit`}>
              {isRaining ? 'PRECIPITATION ALERT' : 'FAVORABLE CONDITIONS'}
            </Badge>
            <h4 className="fw-bold">{isRaining ? 'High Probability of Rain' : 'Optimal Weather Outlook'}</h4>
            <p className="opacity-75 small mb-4">
              {isRaining 
                ? 'System tracking light showers expected soon. Irrigation systems should be suspended for the next 4 hours.'
                : 'Clear conditions expected for the next 48 hours. Excellent window for outdoor field operations and scheduled irrigation.'}
            </p>
            <div className="mt-auto">
              <div className="d-flex justify-content-between small mb-1">
                <span>{isRaining ? 'RAIN PROBABILITY' : 'CLEAR SKY PROBABILITY'}</span>
                <span>{isRaining ? rainProb : 100 - rainProb}%</span>
              </div>
              <ProgressBar now={isRaining ? rainProb : 100 - rainProb} variant="white" style={{ height: '4px' }} />
            </div>
          </Card>
        </Col>
      </Row>

      <div className="mb-4 mt-5">
        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <Sprout className="text-success" /> Optimal Planting Windows
        </h4>
        <Row className="g-4">
          {plantingWindows.map((item, idx) => (
            <Col md={4} key={idx}>
              <Card className="border-0 shadow-sm p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold mb-0">{item.crop}</h5>
                    <small className="text-muted">Field: {context?.landDisplayName !== 'administrative' ? context?.landDisplayName : 'Primary Plot'}</small>
                  </div>
                  <Badge bg={item.statusColor === 'warning' ? 'warning' : item.statusColor} className={item.statusColor === 'warning' ? 'text-dark' : ''}>
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">Irrigation Needs</span>
                    <span className="fw-bold text-success">{item.window}</span>
                  </div>
                  <div className="d-flex gap-1" style={{ height: '8px' }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-grow-1 rounded" style={{ backgroundColor: i < (item.score/20) ? 'var(--bs-success)' : '#eee' }}></div>
                    ))}
                  </div>
                </div>
                <p className="small text-muted mb-0 italic">{item.note}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div className="mt-5">
        <h5 className="fw-bold mb-3">5-Day Agricultural Forecast</h5>
        <Row className="g-2 text-center">
          {dailyForecast.map((day, idx) => (
            <Col key={idx}>
              <Card className="border-0 shadow-sm p-3 h-100">
                <small className="text-muted uppercase fw-bold mb-2">{day.day}</small>
                <div className="h4 mb-2">{day.condition === 'Sunny' ? '☀️' : (day.condition === 'Rain' ? '🌧️' : '⛅')}</div>
                <div className="fw-bold h5 mb-1">{day.temp}</div>
                <small className="text-muted">Rain: {day.rain}</small>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Weather;