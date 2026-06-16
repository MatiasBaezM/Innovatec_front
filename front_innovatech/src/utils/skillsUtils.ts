import { API_ENDPOINTS } from '../config/api';

export interface Habilidad {
  id: number;
  nombre: string;
  color: string;
}

// Paleta de colores sugeridos al crear/editar una habilidad
export const COLORES_SKILLS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b',
  '#ec4899','#ef4444','#8b5cf6','#14b8a6',
  '#64748b','#f97316','#a855f7','#22c55e',
];

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Catálogo de habilidades (GET/POST/PUT/DELETE /api/habilidades) ──

export async function fetchSkills(): Promise<Habilidad[]> {
  try {
    const res = await fetch(API_ENDPOINTS.HABILIDADES.BASE, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function createSkill(skill: Omit<Habilidad, 'id'>): Promise<Habilidad | null> {
  try {
    const res = await fetch(API_ENDPOINTS.HABILIDADES.BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(skill),
    });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function updateSkill(skill: Habilidad): Promise<Habilidad | null> {
  try {
    const res = await fetch(`${API_ENDPOINTS.HABILIDADES.BASE}/${skill.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(skill),
    });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function deleteSkill(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_ENDPOINTS.HABILIDADES.BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.ok;
  } catch { return false; }
}

// ── Habilidades por usuario (GET/PUT /auth/users/{id}/habilidades) ──

// Devuelve las habilidades completas asignadas a un usuario
export async function fetchUserSkills(userId: number): Promise<Habilidad[]> {
  try {
    const res = await fetch(API_ENDPOINTS.AUTH.USER_SKILLS(userId), { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// Devuelve solo los IDs de habilidad asignados a un usuario
export async function fetchUserSkillIds(userId: number): Promise<number[]> {
  return (await fetchUserSkills(userId)).map(h => h.id);
}

// Reemplaza la lista completa de habilidades de un usuario
export async function saveUserSkillIds(userId: number, skillIds: number[]): Promise<boolean> {
  try {
    const res = await fetch(API_ENDPOINTS.AUTH.USER_SKILLS(userId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ habilidadIds: skillIds }),
    });
    return res.ok;
  } catch { return false; }
}
