import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './UserLayout.css';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { userInfo, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/user', label: 'Inicio', icon: <LayoutDashboard size={18} /> },
    { path: '/user/proyectos', label: 'Mis Proyectos', icon: <FolderKanban size={18} /> },
  ];

  const initials = userInfo?.nombre
    ? userInfo.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="user-layout">
      <nav className="user-navbar">
        <div className="user-navbar-inner">
          <Link to="/user" className="user-navbar-brand">
            Innovatech
          </Link>

          <div className={`user-nav-links ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`user-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="user-navbar-right">
            <div className="user-menu-wrapper">
              <Link
                to="/user/perfil"
                className={`user-profile-btn ${location.pathname === '/user/perfil' ? 'active' : ''}`}
              >
                <div className="user-avatar-circle">{initials}</div>
                <span className="user-display-name">{userInfo?.nombre || 'Usuario'}</span>
              </Link>
              <button className="user-logout-btn" onClick={logout} title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
            <button
              className="user-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="user-main">
        <div className="user-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
