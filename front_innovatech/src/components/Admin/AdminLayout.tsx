import React from 'react';
import Sidebar from './Sidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
