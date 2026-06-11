import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserInfo {
  id?: number;
  rut: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  userInfo: UserInfo | null;
  isAdmin: () => boolean;
  isGestor: () => boolean;
  refreshUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): UserInfo | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    const payload = JSON.parse(jsonPayload);
    const rol = (
      payload.rol || payload.roles?.[0] || payload.role || 'COLABORADOR'
    ).toString().toUpperCase();
    return {
      id: typeof payload.id === 'number' ? payload.id : undefined,
      rut: payload.sub || payload.rut || '',
      nombre: payload.nombre || payload.name || payload.sub || 'Usuario',
      rol,
    };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const refreshUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setUserInfo(decodeToken(token));
    } else {
      setUserInfo(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAdmin = () => {
    if (!userInfo) return false;
    return userInfo.rol === 'ADMINISTRADOR';
  };

  const isGestor = () => {
    if (!userInfo) return false;
    return userInfo.rol === 'GESTOR_PROYECTOS';
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUserInfo(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ userInfo, isAdmin, isGestor, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function getRoleFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const info = decodeToken(token);
  return info?.rol ?? null;
}
