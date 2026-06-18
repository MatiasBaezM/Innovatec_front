import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GestorProjects from './GestorProjects';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const proyectos = [
  { id: 1, nombre: 'Sistema Innovatech', descripcion: 'Plataforma central', estado: 'EN_PROGRESO',
    colaboradores: [{ id: 1, nombre: 'Juan Pérez', rol: 'COLABORADOR' }] },
  { id: 2, nombre: 'App Móvil', descripcion: 'Seguimiento', estado: 'INICIO', colaboradores: [] },
];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

// JWT de prueba válido (no expirado) para que authHeaders() no redirija al login
function validToken() {
  const payload = btoa(JSON.stringify({ sub: 'gestor', rol: 'GESTOR_PROYECTOS', exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

describe('GestorProjects', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', validToken());
    navigateMock.mockClear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lista los proyectos gestionados', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<GestorProjects />);
    expect(await screen.findByText('Sistema Innovatech')).toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
  });

  it('usa datos de respaldo cuando la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
    render(<GestorProjects />);
    expect(await screen.findByText('Sistema Innovatech')).toBeInTheDocument();
  });

  it('filtra por estado', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<GestorProjects />);
    await screen.findByText('Sistema Innovatech');
    await userEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(screen.queryByText('Sistema Innovatech')).not.toBeInTheDocument();
    expect(screen.getByText('App Móvil')).toBeInTheDocument();
  });

  it('navega al tablero del gestor al hacer click en una tarjeta', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<GestorProjects />);
    await userEvent.click(await screen.findByText('Sistema Innovatech'));
    expect(navigateMock).toHaveBeenCalledWith('/gestor/proyectos/1');
  });

  it('abre el modal con los colaboradores del proyecto', async () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson(proyectos)));
    render(<GestorProjects />);
    await screen.findByText('Sistema Innovatech');
    await userEvent.click(screen.getByRole('button', { name: /1 colaborador/i }));
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
