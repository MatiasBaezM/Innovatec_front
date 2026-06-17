import { describe, it, expect } from 'vitest';
import API_BASE_URL, { API_ENDPOINTS } from './api';

describe('config/api', () => {
  it('expone una base URL (vacía cuando no hay VITE_BACKEND_URL en test)', () => {
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('define los endpoints de autenticación', () => {
    expect(API_ENDPOINTS.AUTH.LOGIN).toContain('/auth/login');
    expect(API_ENDPOINTS.AUTH.REGISTER).toContain('/auth/register');
    expect(API_ENDPOINTS.AUTH.USERS).toContain('/auth/users');
    expect(API_ENDPOINTS.AUTH.VALIDATE).toContain('/auth/validate');
    expect(API_ENDPOINTS.AUTH.ME).toContain('/auth/me');
  });

  it('USER_SKILLS construye la ruta con el id del usuario', () => {
    expect(API_ENDPOINTS.AUTH.USER_SKILLS(42)).toContain('/auth/users/42/habilidades');
    expect(API_ENDPOINTS.AUTH.USER_SKILLS('abc')).toContain('/auth/users/abc/habilidades');
  });

  it('define los endpoints de proyectos, recursos, analíticas y habilidades', () => {
    expect(API_ENDPOINTS.PROJECTS.BASE).toContain('/api/proyectos');
    expect(API_ENDPOINTS.PROJECTS.ACTIVITIES).toContain('/api/proyectos/actividades');
    expect(API_ENDPOINTS.RESOURCES.WORKERS).toContain('/api/trabajadores');
    expect(API_ENDPOINTS.RESOURCES.ASSIGNMENTS).toContain('/api/asignaciones');
    expect(API_ENDPOINTS.RESOURCES.TEAMS).toContain('/api/equipos');
    expect(API_ENDPOINTS.ANALYTICS.BASE).toContain('/api/analiticas');
    expect(API_ENDPOINTS.HABILIDADES.BASE).toContain('/api/habilidades');
  });
});
