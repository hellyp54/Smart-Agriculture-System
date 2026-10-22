import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/NavbarComponent';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import Market from './pages/Market';
import Services from './pages/Services';
import Weather from './pages/Weather';
import Alerts from './pages/Alerts';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="d-flex" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <Sidebar />
        <div className="flex-grow-1 d-flex flex-column">
          <Navbar />
          <div className="container-fluid p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/monitoring" element={<PrivateRoute><Monitoring /></PrivateRoute>} />
              <Route path="/market" element={<PrivateRoute><Market /></PrivateRoute>} />
              <Route path="/weather" element={<PrivateRoute><Weather /></PrivateRoute>} />
              <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
export default App;