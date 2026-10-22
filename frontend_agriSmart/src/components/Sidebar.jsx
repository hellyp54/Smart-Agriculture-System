import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, ShoppingCart, ShieldCheck, CloudSun, AlertTriangle, Home } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Market', path: '/market', icon: ShoppingCart },
    // { name: 'Services', path: '/services', icon: ShieldCheck },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'Alerts', path: '/alerts', icon: AlertTriangle },
  ];

  return (
    <div className="bg-white border-right" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="p-4">
        <h4 className="text-success fw-bold">AgriSmart</h4>
        <small className="text-muted">Digital Agronomist</small>
      </div>
      <Nav className="flex-column px-2">
        {menuItems.map((item) => (
          <Nav.Link
            as={Link}
            to={item.path}
            key={item.name}
            className={`d-flex align-items-center mb-2 rounded p-3 ${location.pathname === item.path ? 'bg-success text-white' : 'text-dark hover-bg-light'}`}
          >
            <item.icon size={18} className="me-3" />
            {item.name}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};
export default Sidebar;