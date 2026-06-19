/**
 * En desarrollo, Vite redirige /auth y /api → http://localhost:8080 (API Gateway).
 * En producción, configurar VITE_BACKEND_URL con la URL del Load Balancer.
 */
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? (import.meta.env.VITE_BACKEND_URL as string).replace(/\/+$/, '')
  : '';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:    `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    USERS:    `${API_BASE_URL}/auth/users`,
    VALIDATE: `${API_BASE_URL}/auth/validate`,
    ME:       `${API_BASE_URL}/auth/me`,
    // Habilidades asignadas a un usuario (GET lista, PUT reemplaza)
    USER_SKILLS: (id: number | string) => `${API_BASE_URL}/auth/users/${id}/habilidades`,
  },
  PROJECTS: {
    BASE:       `${API_BASE_URL}/api/proyectos`,
    ACTIVITIES: `${API_BASE_URL}/api/proyectos/actividades`,
    // Feed del gestor: actividades de sus proyectos + tareas por aprobar
    GESTOR_ACTIVITIES: `${API_BASE_URL}/api/proyectos/actividades/gestor`,
    // Tarea individual (para aprobar desde el panel): GET full + PUT REVISADO
    TASK: (proyectoId: number | string, tareaId: number | string) =>
      `${API_BASE_URL}/api/proyectos/${proyectoId}/tareas/${tareaId}`,
  },
  RESOURCES: {
    WORKERS:     `${API_BASE_URL}/api/trabajadores`,
    ASSIGNMENTS: `${API_BASE_URL}/api/asignaciones`,
    TEAMS:       `${API_BASE_URL}/api/equipos`,
  },
  ANALYTICS: {
    BASE: `${API_BASE_URL}/api/analiticas`,
  },
  // Catálogo de habilidades (gestionado por ADMINISTRADOR)
  HABILIDADES: {
    BASE: `${API_BASE_URL}/api/habilidades`,
  },
};

export default API_BASE_URL;
