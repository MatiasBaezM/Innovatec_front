import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GanttChart from './GanttChart';

// Mock de localStorage (patrón idéntico al de los otros tests del proyecto)
const mockToken =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJyb2wiOiJHRVNUT1JfUFJPWUVDVE9TIn0.sig';

beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);
  vi.stubGlobal('fetch', vi.fn());
});

describe('GanttChart', () => {
  it('muestra spinner mientras carga', () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Promise(() => {}) // pending para simular carga
    );

    render(<GanttChart proyectoId={1} nombreProyecto="Test" />);

    expect(screen.getByText(/cargando diagrama/i)).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay tareas con fechas', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        proyectoId: 1,
        nombreProyecto: 'Proyecto Test',
        estado: 'EN_PROGRESO',
        fechaInicioProyecto: null,
        fechaFinProyecto: null,
        tareas: [],
      }),
    });

    render(<GanttChart proyectoId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/no hay tareas con fechas/i)).toBeInTheDocument();
    });
  });

  it('renderiza las barras cuando hay tareas con fechas', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        proyectoId: 1,
        nombreProyecto: 'Proyecto Test',
        estado: 'EN_PROGRESO',
        fechaInicioProyecto: '2026-07-01',
        fechaFinProyecto: '2026-07-31',
        tareas: [
          {
            id: 1,
            titulo: 'Diseño UI',
            estado: 'EN_PROGRESO',
            prioridad: 'ALTA',
            asignadoNombre: 'Ana López',
            fechaInicio: '2026-07-01',
            fechaFin: '2026-07-10',
            horasEstimadas: 16,
            orden: 1,
          },
        ],
      }),
    });

    render(<GanttChart proyectoId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Diseño UI').length).toBeGreaterThan(0);
      expect(screen.getByText('Ana López')).toBeInTheDocument();
    });
  });

  it('muestra error cuando el fetch falla', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(<GanttChart proyectoId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument();
    });
  });
});
