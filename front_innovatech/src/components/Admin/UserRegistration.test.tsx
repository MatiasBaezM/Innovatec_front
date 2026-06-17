import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserRegistration from './UserRegistration';
import { API_ENDPOINTS } from '../../config/api';

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}

function campo(name: string): HTMLInputElement {
  return document.querySelector(`[name="${name}"]`) as HTMLInputElement;
}

describe('UserRegistration', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('renderiza el formulario de registro', () => {
    vi.stubGlobal('fetch', vi.fn(() => okJson({})));
    render(<UserRegistration />);
    expect(screen.getByText('Registro de Usuarios')).toBeInTheDocument();
    expect(campo('rut')).toBeInTheDocument();
    expect(campo('nombre')).toBeInTheDocument();
    expect(campo('clave')).toBeInTheDocument();
  });

  it('rechaza el registro con RUT inválido y no llama a la API', async () => {
    const fetchMock = vi.fn(() => okJson({}));
    vi.stubGlobal('fetch', fetchMock);
    render(<UserRegistration />);

    await userEvent.type(campo('rut'), '12345');
    await userEvent.type(campo('nombre'), 'Pedro');
    await userEvent.type(campo('clave'), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: /Registrar Usuario/i }));

    expect(await screen.findByText(/RUT ingresado no es válido/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registra un usuario válido y muestra mensaje de éxito', async () => {
    const fetchMock = vi.fn(() => okJson({}));
    vi.stubGlobal('fetch', fetchMock);
    render(<UserRegistration />);

    await userEvent.type(campo('rut'), '111111111'); // → 11.111.111-1
    await userEvent.type(campo('nombre'), 'Pedro Soto');
    await userEvent.type(campo('clave'), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: /Registrar Usuario/i }));

    expect(await screen.findByText(/registrado exitosamente/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      API_ENDPOINTS.AUTH.REGISTER,
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
