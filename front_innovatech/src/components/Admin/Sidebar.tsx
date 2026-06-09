import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Users, FolderKanban, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isHidden?: boolean;
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isHidden, toggleSidebar: _toggleSidebar }) => {
  const location = useLocation();
  const { userInfo, logout } = useAuth();

  const menuItems = [
    { path: '/analiticas', label: 'Analíticas', icon: <TrendingUp size={20} /> },
    { path: '/usuarios',   label: 'Usuarios',   icon: <Users size={20} /> },
    { path: '/proyectos',  label: 'Proyectos',  icon: <FolderKanban size={20} /> },
    { path: '/config',     label: 'Configuración', icon: <Settings size={20} /> },
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
        {userInfo && (
          <div className="sidebar-user-row" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.85rem', marginBottom: '0.35rem',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={13} color="#a5b4fc" />
            </div>
            <span className="sidebar-user-name" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userInfo.nombre}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link logout"
          style={{ width: '100%', background: 'none', border: 'none' }}
        >
          <span className="sidebar-icon"><LogOut size={18} /></span>
          <span className="sidebar-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
