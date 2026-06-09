export interface Habilidad {
  id: number;
  nombre: string;
  color: string;
}

export const SKILLS_KEY = 'innovatech_habilidades';
export const USER_SKILLS_KEY = 'innovatech_user_skills';

export const DEFAULT_SKILLS: Habilidad[] = [
  { id: 1, nombre: 'Desarrollador Backend',  color: '#6366f1' },
  { id: 2, nombre: 'Desarrollador Frontend', color: '#0ea5e9' },
  { id: 3, nombre: 'DBA',                    color: '#10b981' },
  { id: 4, nombre: 'Analista QA',            color: '#f59e0b' },
  { id: 5, nombre: 'Diseñador UX/UI',        color: '#ec4899' },
  { id: 6, nombre: 'DevOps',                 color: '#ef4444' },
  { id: 7, nombre: 'Scrum Master',           color: '#8b5cf6' },
  { id: 8, nombre: 'Analista de Negocio',    color: '#14b8a6' },
];

export const COLORES_SKILLS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b',
  '#ec4899','#ef4444','#8b5cf6','#14b8a6',
  '#64748b','#f97316','#a855f7','#22c55e',
];

export function loadSkillsFromStorage(): Habilidad[] {
  try {
    const s = localStorage.getItem(SKILLS_KEY);
    if (s) return JSON.parse(s);
    localStorage.setItem(SKILLS_KEY, JSON.stringify(DEFAULT_SKILLS));
    return DEFAULT_SKILLS;
  } catch { return DEFAULT_SKILLS; }
}

export function saveSkillsToStorage(skills: Habilidad[]) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
}

// Returns the skill IDs assigned to a given user
export function loadUserSkillIds(userId: number): number[] {
  try {
    const raw = localStorage.getItem(USER_SKILLS_KEY);
    if (!raw) return [];
    const map: Record<string, number[]> = JSON.parse(raw);
    return map[String(userId)] ?? [];
  } catch { return []; }
}

// Saves the skill IDs for a given user
export function saveUserSkillIds(userId: number, skillIds: number[]) {
  try {
    const raw = localStorage.getItem(USER_SKILLS_KEY);
    const map: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    map[String(userId)] = skillIds;
    localStorage.setItem(USER_SKILLS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}
