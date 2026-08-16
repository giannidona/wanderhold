import type { GameState } from '../types';

// v4: el jugador suma armor (casco/pechera/botas) y la mazmorra playerDefense.
const SAVE_KEY = 'wanderhold-save-v4';

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
