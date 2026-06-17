import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/usuarios' }),
  Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
}));

const logoutMock = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { nombre: 'Admin Innovatech' }, logout: logoutMock }),
}));

describe('Sidebar', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renderiza todos los items del menú y el nombre del usuario', () => {
    render(<Sidebar />);
    ['Analíticas', 'Usuarios', 'Proyectos', 'Configuración'].forEach(label =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByText('Admin Innovatech')).toBeInTheDocument();
  });

  it('marca como activo el enlace de la ruta actual', () => {
    render(<Sidebar />);
    expect(screen.getByText('Usuarios').closest('a')).toHaveClass('active');
    expect(screen.getByText('Proyectos').closest('a')).not.toHaveClass('active');
  });

  it('cierra sesión al hacer click en Cerrar Sesión', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(logoutMock).toHaveBeenCalled();
  });
});
