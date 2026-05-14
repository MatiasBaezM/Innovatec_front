import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
  };

  return (
    <div className={`admin-layout ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      <Sidebar isHidden={isSidebarHidden} toggleSidebar={toggleSidebar} />
      <main className="admin-content">
        <div className="admin-topbar">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar} title="Alternar panel lateral">
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

export default AdminLayout;
