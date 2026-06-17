import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { id: 5, nombre: 'Ana Gómez', rut: '11.111.111-1', rol: 'COLABORADOR' } }),
}));

vi.mock('../../utils/skillsUtils', () => ({
  fetchUserSkills: vi.fn(() => Promise.resolve([{ id: 1, nombre: 'React', color: '#6366f1' }])),
}));

const actividades = [{ id: 1, titulo: 'Login realizado', fechaCreacion: '2026-06-01T10:00:00Z' }];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

describe('UserProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(() => okJson(actividades)));
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra los datos de la cuenta del usuario', () => {
    render(<UserProfile />);
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Gómez').length).toBeGreaterThan(0);
    expect(screen.getByText('11.111.111-1')).toBeInTheDocument();
    // El rol COLABORADOR se muestra con su label
    expect(screen.getAllByText('Colaborador').length).toBeGreaterThan(0);
  });

  it('carga y muestra las habilidades del usuario', async () => {
    render(<UserProfile />);
    expect(await screen.findByText('React')).toBeInTheDocument();
  });

  it('muestra el historial de actividad', async () => {
    render(<UserProfile />);
    expect(await screen.findByText('Login realizado')).toBeInTheDocument();
  });

  it('incluye la tarjeta de cambio de contraseña', () => {
    render(<UserProfile />);
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
  });
});
