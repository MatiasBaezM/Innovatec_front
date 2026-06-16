import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import {
  type Notificacion,
  loadNotificaciones,
  marcarTodasLeidas,
  contarNoLeidas,
} from '../../utils/notificationsUtils';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [notifs, setNotifs] = useState<Notificacion[]>(() => loadNotificaciones());
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarHidden(!isSidebarHidden);

  // Refresca periódicamente para detectar avisos nuevos
  useEffect(() => {
    const interval = setInterval(() => setNotifs(loadNotificaciones()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Cierra el panel al hacer clic fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const noLeidas = contarNoLeidas(notifs);

  const toggleNotifs = () => {
    const next = !showNotifs;
    setShowNotifs(next);
    if (next && noLeidas > 0) {
      setNotifs(marcarTodasLeidas());
    }
  };

  return (
    <div className={`admin-layout ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      <Sidebar isHidden={isSidebarHidden} toggleSidebar={toggleSidebar} />
      <main className="admin-content">
        <div className="admin-topbar">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar} title="Alternar panel lateral">
            {isSidebarHidden ? <Menu size={24} /> : <X size={24} />}
          </button>

          {/* Campana de notificaciones */}
          <div ref={notifRef} style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              onClick={toggleNotifs}
              title="Notificaciones"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', color: '#475569', padding: '0.4rem',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Bell size={22} />
              {noLeidas > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 8, background: '#ef4444', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {noLeidas}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 320, maxHeight: 400, overflowY: 'auto',
                background: '#fff', borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0', zIndex: 1000,
              }}>
                <div style={{
                  padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9',
                  fontWeight: 700, fontSize: '0.9rem', color: '#0f172a',
                }}>
                  Notificaciones
                </div>
                {notifs.length === 0 ? (
                  <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                    No tienes notificaciones.
                  </div>
                ) : (
                  notifs.map(n => (
                    <div key={n.id} style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid #f8fafc',
                      display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#10b981', flexShrink: 0, marginTop: '0.3rem',
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.35 }}>
                          {n.titulo}
                        </p>
                        <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {new Date(n.fecha).toLocaleString('es-CL', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
