import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from './Analytics';

const resumen = {
  totalProyectos: 10, proyectosActivos: 6, totalTrabajadores: 8,
  tareasPendientes: 5, tareasCompletadas: 12, presupuestoTotal: 1_000_000,
};
const proyectosEstado = [{ label: 'EN_PROGRESO', cantidad: 6 }];
const costos = [{ proyectoId: 1, costoEstimado: 500000 }];
const carga = [{ nombre: 'Juan Pérez', totalHoras: 40 }];
const proyectos = [{ id: 1, nombre: 'Plataforma Web' }];

function okJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);
}
const notOk = () => Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response);

function stubFetch(full = true) {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (!full) return notOk();
    if (url.includes('/analiticas/resumen')) return okJson(resumen);
    if (url.includes('/analiticas/proyectos')) return okJson(proyectosEstado);
    if (url.includes('/analiticas/tareas/prioridad')) return okJson([{ label: 'ALTA', cantidad: 3 }]);
    if (url.includes('/analiticas/tareas/estado')) return okJson([{ label: 'COMPLETADO', cantidad: 12 }]);
    if (url.includes('/analiticas/carga-trabajo')) return okJson(carga);
    if (url.includes('/analiticas/costos')) return okJson(costos);
    if (url.includes('/api/proyectos')) return okJson(proyectos);
    return okJson(null);
  }));
}

describe('Analytics', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('renderiza las analíticas con los KPIs del resumen', async () => {
    stubFetch();
    render(<Analytics />);
    expect(screen.getByText('Analíticas')).toBeInTheDocument();
    expect(await screen.findByText(/de 10 totales/)).toBeInTheDocument();
    expect(screen.getByText('Carga de Trabajo — Top 5')).toBeInTheDocument();
  });

  it('muestra estados vacíos y deshabilita Exportar sin datos', async () => {
    stubFetch(false);
    render(<Analytics />);
    expect(await screen.findAllByText(/Sin datos disponibles/)).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeDisabled();
  });

  it('exporta un CSV al hacer click en Exportar', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    stubFetch();
    render(<Analytics />);
    const btn = await screen.findByRole('button', { name: /Exportar CSV/i });
    await waitFor(() => expect(btn).toBeEnabled());
    await userEvent.click(btn);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
