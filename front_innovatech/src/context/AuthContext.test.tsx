import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, getRoleFromToken, getValidToken } from './AuthContext';

/**
 * Construye un JWT de juguete (header.payload.signature) con el payload indicado.
 * decodeToken sólo decodifica la parte central, así que header y firma son ficticios.
 */
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (obj: object) => btoa(JSON.stringify(obj));
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.firma`;
}

// Componente de prueba que expone el contexto en el DOM
function Consumer() {
  const { userInfo, isAdmin, isGestor, refreshUser, logout } = useAuth();
  return (
    <div>
      <span data-testid="nombre">{userInfo?.nombre ?? 'sin-usuario'}</span>
      <span data-testid="rol">{userInfo?.rol ?? 'sin-rol'}</span>
      <span data-testid="isAdmin">{String(isAdmin())}</span>
      <span data-testid="isGestor">{String(isGestor())}</span>
      <button onClick={refreshUser}>refrescar</button>
      <button onClick={logout}>salir</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getRoleFromToken', () => {
    it('devuelve null cuando no hay token', () => {
      expect(getRoleFromToken()).toBeNull();
    });

    it('devuelve null cuando el token está malformado', () => {
      localStorage.setItem('token', 'no-es-un-jwt');
      expect(getRoleFromToken()).toBeNull();
    });

    it('extrae el rol y lo normaliza a mayúsculas', () => {
      localStorage.setItem('token', makeToken({ rol: 'administrador' }));
      expect(getRoleFromToken()).toBe('ADMINISTRADOR');
    });

    it('soporta el rol expresado en el arreglo roles[]', () => {
      localStorage.setItem('token', makeToken({ roles: ['GESTOR_PROYECTOS'] }));
      expect(getRoleFromToken()).toBe('GESTOR_PROYECTOS');
    });

    it('usa COLABORADOR como rol por defecto', () => {
      localStorage.setItem('token', makeToken({ sub: '11111111-1' }));
      expect(getRoleFromToken()).toBe('COLABORADOR');
    });

    it('rechaza un token expirado (exp en el pasado)', () => {
      const expirado = makeToken({ rol: 'ADMINISTRADOR', exp: Math.floor(Date.now() / 1000) - 60 });
      localStorage.setItem('token', expirado);
      expect(getRoleFromToken()).toBeNull();
    });

    it('acepta un token con exp en el futuro', () => {
      const vigente = makeToken({ rol: 'ADMINISTRADOR', exp: Math.floor(Date.now() / 1000) + 3600 });
      localStorage.setItem('token', vigente);
      expect(getRoleFromToken()).toBe('ADMINISTRADOR');
    });
  });

  describe('getValidToken', () => {
    it('devuelve null cuando no hay token', () => {
      expect(getValidToken()).toBeNull();
    });

    it('devuelve el token cuando es válido', () => {
      const token = makeToken({ rol: 'COLABORADOR' });
      localStorage.setItem('token', token);
      expect(getValidToken()).toBe(token);
    });

    it('borra y devuelve null cuando el token está expirado', () => {
      localStorage.setItem('token', makeToken({ rol: 'ADMINISTRADOR', exp: Math.floor(Date.now() / 1000) - 60 }));
      expect(getValidToken()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('borra y devuelve null cuando el token está malformado', () => {
      localStorage.setItem('token', 'no-es-jwt');
      expect(getValidToken()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('AuthProvider', () => {
    function renderConProvider() {
      return render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );
    }

    it('arranca sin usuario cuando no hay token', () => {
      renderConProvider();
      expect(screen.getByTestId('nombre')).toHaveTextContent('sin-usuario');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
      expect(screen.getByTestId('isGestor')).toHaveTextContent('false');
    });

    it('decodifica el usuario del token al montar', () => {
      localStorage.setItem('token', makeToken({ nombre: 'Ana', rol: 'ADMINISTRADOR', id: 7 }));
      renderConProvider();
      expect(screen.getByTestId('nombre')).toHaveTextContent('Ana');
      expect(screen.getByTestId('rol')).toHaveTextContent('ADMINISTRADOR');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
      expect(screen.getByTestId('isGestor')).toHaveTextContent('false');
    });

    it('isGestor es true para el rol GESTOR_PROYECTOS', () => {
      localStorage.setItem('token', makeToken({ nombre: 'Gus', rol: 'GESTOR_PROYECTOS' }));
      renderConProvider();
      expect(screen.getByTestId('isGestor')).toHaveTextContent('true');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    });

    it('refreshUser sincroniza el usuario cuando cambia el token', async () => {
      renderConProvider();
      expect(screen.getByTestId('nombre')).toHaveTextContent('sin-usuario');

      localStorage.setItem('token', makeToken({ nombre: 'Beto', rol: 'COLABORADOR' }));
      await userEvent.click(screen.getByRole('button', { name: 'refrescar' }));

      expect(screen.getByTestId('nombre')).toHaveTextContent('Beto');
    });

    it('logout limpia el token y redirige a /login', async () => {
      const hrefSpy = vi.fn();
      const original = window.location;
      // Reemplaza window.location para capturar la asignación de href
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...original, set href(v: string) { hrefSpy(v); } },
      });

      localStorage.setItem('token', makeToken({ nombre: 'Ana', rol: 'ADMINISTRADOR' }));
      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      );

      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: 'salir' }));
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('nombre')).toHaveTextContent('sin-usuario');
      expect(hrefSpy).toHaveBeenCalledWith('/login');

      Object.defineProperty(window, 'location', { configurable: true, value: original });
    });
  });

  describe('useAuth', () => {
    it('lanza error si se usa fuera del AuthProvider', () => {
      // Silencia el error que React imprime al propagar la excepción del render
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<Consumer />)).toThrow(/useAuth must be used within AuthProvider/);
      errSpy.mockRestore();
    });
  });
});
