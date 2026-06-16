import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePasswordCard from './ChangePasswordCard';

// Mock del contexto de autenticación: el componente sólo necesita userInfo
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    userInfo: { id: 42, rut: '11111111-1', nombre: 'Ana', rol: 'COLABORADOR' },
  }),
}));

function campo(name: string): HTMLInputElement {
  const el = document.querySelector(`input[name="${name}"]`);
  if (!el) throw new Error(`No se encontró el campo "${name}"`);
  return el as HTMLInputElement;
}

async function llenar(actual: string, nueva: string, confirmar: string) {
  const user = userEvent.setup();
  await user.type(campo('actual'), actual);
  await user.type(campo('nueva'), nueva);
  await user.type(campo('confirmar'), confirmar);
  await user.click(screen.getByRole('button', { name: /Actualizar Contraseña/i }));
  return user;
}

describe('ChangePasswordCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el formulario con sus tres campos', () => {
    render(<ChangePasswordCard />);
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();
    expect(campo('actual')).toBeInTheDocument();
    expect(campo('nueva')).toBeInTheDocument();
    expect(campo('confirmar')).toBeInTheDocument();
  });

  it('muestra error si la nueva contraseña es muy corta', async () => {
    render(<ChangePasswordCard />);
    await llenar('actual1', 'ab', 'ab');
    expect(await screen.findByText(/al menos 4 caracteres/i)).toBeInTheDocument();
  });

  it('muestra error si la confirmación no coincide', async () => {
    render(<ChangePasswordCard />);
    await llenar('actual1', 'nueva123', 'otra456');
    expect(await screen.findByText(/su confirmación no coinciden/i)).toBeInTheDocument();
  });

  it('muestra error si la nueva contraseña es igual a la actual', async () => {
    render(<ChangePasswordCard />);
    await llenar('iguales1', 'iguales1', 'iguales1');
    expect(await screen.findByText(/distinta a la actual/i)).toBeInTheDocument();
  });

  it('muestra error si la contraseña actual es incorrecta', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)));
    render(<ChangePasswordCard />);
    await llenar('malactual', 'nueva123', 'nueva123');
    expect(await screen.findByText(/contraseña actual es incorrecta/i)).toBeInTheDocument();
  });

  it('actualiza la contraseña correctamente en el flujo feliz', async () => {
    // 1ª llamada: login ok · 2ª llamada: PUT usuario ok
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);
    vi.stubGlobal('fetch', fetchMock);

    render(<ChangePasswordCard />);
    await llenar('actualOk1', 'nuevaPass1', 'nuevaPass1');

    expect(await screen.findByText(/actualizada correctamente/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    // El PUT va al endpoint del usuario con id 42
    expect(fetchMock.mock.calls[1][0]).toContain('/42');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
  });
});
