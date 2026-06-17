import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from './AdminLayout';

// Aislamos el Sidebar (se prueba aparte) para no arrastrar router/auth
vi.mock('./Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));

const notifs = [{ id: 1, titulo: 'Proyecto finalizado', fecha: '2026-06-01T10:00:00Z', leida: false }];
const marcarTodasLeidasMock = vi.fn(() => notifs.map(n => ({ ...n, leida: true })));
vi.mock('../../utils/notificationsUtils', () => ({
  loadNotificaciones: () => notifs,
  contarNoLeidas: (list: any[]) => list.filter(n => !n.leida).length,
  marcarTodasLeidas: () => marcarTodasLeidasMock(),
}));

describe('AdminLayout', () => {
  beforeEach(() => marcarTodasLeidasMock.mockClear());
  afterEach(() => vi.restoreAllMocks());

  it('renderiza el sidebar y el contenido hijo', () => {
    render(<AdminLayout><div>Contenido Admin</div></AdminLayout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Contenido Admin')).toBeInTheDocument();
  });

  it('muestra el contador de notificaciones no leídas', () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('abre el panel de notificaciones y las marca como leídas', async () => {
    render(<AdminLayout><div /></AdminLayout>);
    await userEvent.click(screen.getByTitle('Notificaciones'));
    expect(screen.getByText('Proyecto finalizado')).toBeInTheDocument();
    expect(marcarTodasLeidasMock).toHaveBeenCalled();
  });
});
