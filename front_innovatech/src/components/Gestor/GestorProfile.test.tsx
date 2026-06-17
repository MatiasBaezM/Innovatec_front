import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GestorProfile from './GestorProfile';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { id: 3, nombre: 'Gustavo Torres', rut: '22.222.222-2', rol: 'GESTOR_PROYECTOS' } }),
}));

describe('GestorProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
  });
  afterEach(() => vi.restoreAllMocks());

  it('muestra los datos del gestor', () => {
    render(<GestorProfile />);
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getAllByText('Gustavo Torres').length).toBeGreaterThan(0);
    expect(screen.getByText('22.222.222-2')).toBeInTheDocument();
    expect(screen.getAllByText('Gestor de Proyectos').length).toBeGreaterThan(0);
  });

  it('calcula las iniciales del nombre en el avatar', () => {
    render(<GestorProfile />);
    expect(screen.getByText('GT')).toBeInTheDocument();
  });

  it('incluye la tarjeta de cambio de contraseña', () => {
    render(<GestorProfile />);
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
  });
});
