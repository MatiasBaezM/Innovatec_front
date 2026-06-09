import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderKanban, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Admin/AdminLayout.css';
import '../Admin/Sidebar.css';

interface GestorLayoutProps {
  children: React.ReactNode;
}

const GestorLayout: React.FC<GestorLayoutProps> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const location = useLocation();
  const { userInfo, logout } = useAuth();

  const menuItems = [
    { path: '/gestor/proyectos', label: 'Mis Proyectos', icon: <FolderKanban size={20} /> },
  ];

  return (
    <div className={`admin-layout ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-logo">Innovatech</h3>
          {userInfo && (
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Gestor de Proyectos
            </p>
          )}
        </div>

        <nav className="flex-column sidebar-nav">
          {menuItems.map(item => (
            <div key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${location.pathname.startsWith('/gestor') ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {userInfo && (
            <div className="sidebar-user-row" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.85rem', marginBottom: '0.35rem',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(139,92,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={13} color="#c4b5fd" />
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

      {/* Main content */}
      <main className="admin-content">
        <div className="admin-topbar">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            title="Alternar panel lateral"
          >
            {isSidebarHidden ? <Menu size={24} /> : <X size={24} />}
          </button>
        </div>
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default GestorLayout;
