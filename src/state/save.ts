import type { GameState } from '../types';

// v5: nuevo recurso Hierro (inventory.iron) y edificio Herrería (BuildingKind).
const SAVE_KEY = 'wanderhold-save-v5';

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
