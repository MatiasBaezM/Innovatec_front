import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  fetchUserSkillIds,
  saveUserSkillIds,
  type Habilidad,
} from './skillsUtils';

const habilidad: Habilidad = { id: 1, nombre: 'React', color: '#6366f1' };

function mockFetch(impl: (url: string, init?: RequestInit) => Partial<Response>) {
  return vi.fn((url: string, init?: RequestInit) =>
    Promise.resolve(impl(url, init) as Response),
  );
}

describe('skillsUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSkills', () => {
    it('devuelve la lista cuando la respuesta es ok', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({
        ok: true,
        json: () => Promise.resolve([habilidad]),
      })));
      expect(await fetchSkills()).toEqual([habilidad]);
    });

    it('devuelve [] cuando la respuesta no es ok', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({ ok: false, json: () => Promise.resolve(null) })));
      expect(await fetchSkills()).toEqual([]);
    });

    it('devuelve [] cuando el payload no es un arreglo', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({ ok: true, json: () => Promise.resolve({}) })));
      expect(await fetchSkills()).toEqual([]);
    });

    it('devuelve [] cuando fetch lanza error', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))));
      expect(await fetchSkills()).toEqual([]);
    });

    it('incluye el header Authorization si hay token', async () => {
      localStorage.setItem('token', 'abc123');
      const spy = mockFetch(() => ({ ok: true, json: () => Promise.resolve([]) }));
      vi.stubGlobal('fetch', spy);
      await fetchSkills();
      const init = spy.mock.calls[0][1] as RequestInit;
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc123');
    });
  });

  describe('createSkill', () => {
    it('devuelve la habilidad creada en éxito', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({ ok: true, json: () => Promise.resolve(habilidad) })));
      expect(await createSkill({ nombre: 'React', color: '#6366f1' })).toEqual(habilidad);
    });

    it('devuelve null cuando la respuesta no es ok', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({ ok: false, json: () => Promise.resolve(null) })));
      expect(await createSkill({ nombre: 'X', color: '#000' })).toBeNull();
    });
  });

  describe('updateSkill', () => {
    it('llama al endpoint con el id e devuelve la habilidad', async () => {
      const spy = mockFetch(() => ({ ok: true, json: () => Promise.resolve(habilidad) }));
      vi.stubGlobal('fetch', spy);
      const res = await updateSkill(habilidad);
      expect(res).toEqual(habilidad);
      expect(spy.mock.calls[0][0]).toContain('/1');
      expect((spy.mock.calls[0][1] as RequestInit).method).toBe('PUT');
    });
  });

  describe('deleteSkill', () => {
    it('devuelve true cuando la respuesta es ok', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({ ok: true })));
      expect(await deleteSkill(1)).toBe(true);
    });

    it('devuelve false cuando fetch lanza error', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('x'))));
      expect(await deleteSkill(1)).toBe(false);
    });
  });

  describe('fetchUserSkillIds', () => {
    it('mapea las habilidades a sus ids', async () => {
      vi.stubGlobal('fetch', mockFetch(() => ({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]),
      })));
      expect(await fetchUserSkillIds(99)).toEqual([1, 2, 3]);
    });
  });

  describe('saveUserSkillIds', () => {
    it('envía habilidadIds en el cuerpo con método PUT', async () => {
      const spy = mockFetch(() => ({ ok: true }));
      vi.stubGlobal('fetch', spy);
      const ok = await saveUserSkillIds(7, [1, 2]);
      expect(ok).toBe(true);
      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string)).toEqual({ habilidadIds: [1, 2] });
    });
  });
});
