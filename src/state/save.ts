import type { GameState } from '../types';

// v6: DungeonRunState ahora requiere `depth` (campo no-opcional, no tiene
// default seguro vía spread-merge porque `dungeon` se carga entero o null).
const SAVE_KEY = 'wanderhold-save-v6';

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
