import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserLayout from './UserLayout';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/user' }),
  Link: ({ to, children, className, onClick }: any) =>
    <a href={to} className={className} onClick={onClick}>{children}</a>,
}));

const logoutMock = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ userInfo: { nombre: 'Juan Pérez' }, logout: logoutMock }),
}));

describe('UserLayout', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renderiza la marca, navegación, usuario y contenido', () => {
    render(<UserLayout><div>Contenido</div></UserLayout>);
    expect(screen.getByText('Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Mis Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('marca como activo el enlace de la ruta actual', () => {
    render(<UserLayout><div /></UserLayout>);
    expect(screen.getByText('Inicio').closest('a')).toHaveClass('active');
  });

  it('cierra sesión al hacer click en Cerrar Sesión', async () => {
    render(<UserLayout><div /></UserLayout>);
    await userEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(logoutMock).toHaveBeenCalled();
  });

  it('alterna el menú móvil con el botón hamburguesa', async () => {
    render(<UserLayout><div /></UserLayout>);
    const hamburguesa = document.querySelector('.user-hamburger') as HTMLButtonElement;
    await userEvent.click(hamburguesa);
    // Tras abrir, el contenedor de links recibe la clase "open"
    expect(document.querySelector('.user-nav-links.open')).toBeInTheDocument();
  });
});
