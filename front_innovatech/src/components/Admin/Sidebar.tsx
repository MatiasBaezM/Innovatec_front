import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, TrendingUp, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isHidden?: boolean;
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isHidden, toggleSidebar: _toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/usuarios', label: 'Usuarios', icon: <Users size={20} /> },
    { path: '/proyectos', label: 'Proyectos', icon: <FolderKanban size={20} /> },
    { path: '/analiticas', label: 'Analíticas', icon: <TrendingUp size={20} /> },
    { path: '/config', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <div className={`sidebar ${isHidden ? 'hidden' : ''}`}>
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
        <button onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }} className="sidebar-link logout" style={{width: '100%', background: 'none', border: 'none', textAlign: 'left'}}>
          <span className="sidebar-icon"><LogOut size={20} /></span>
          <span className="sidebar-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
