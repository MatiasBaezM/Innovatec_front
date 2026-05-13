/**
 * Configuracion centralizada de la API para el frontend Innovatech.
 * En desarrollo usa localhost:8080 (API Gateway local).
 * En produccion, configura VITE_BACKEND_URL con la URL del Load Balancer de EKS.
 */
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    USERS: `${API_BASE_URL}/auth/users`,
    VALIDATE: `${API_BASE_URL}/auth/validate`,
  },
  PROJECTS: {
    BASE: `${API_BASE_URL}/api/proyectos`,
  },
  RESOURCES: {
    WORKERS: `${API_BASE_URL}/api/trabajadores`,
    ASSIGNMENTS: `${API_BASE_URL}/api/asignaciones`,
  },
  ANALYTICS: {
    BASE: `${API_BASE_URL}/api/analiticas`,
  }
};

export default API_BASE_URL;
