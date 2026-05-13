import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/proyectos', label: 'Proyectos', icon: '📁' },
    { path: '/analiticas', label: 'Analíticas', icon: '📈' },
    { path: '/config', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-logo">Innovatech</h3>
      </div>
      
      <Nav className="flex-column sidebar-nav">
        {menuItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link 
              as={Link} 
              to={item.path} 
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="sidebar-footer">
        <Nav.Link as={Link} to="/login" className="sidebar-link logout">
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Cerrar Sesión</span>
        </Nav.Link>
      </div>
    </div>
  );
};

export default Sidebar;
