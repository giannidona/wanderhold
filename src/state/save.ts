import type { GameState } from '../types';

// v7: VillageState pasó de {gridSize, resourceNodes[]} (grid fijo) a
// {seed, chunks} (mundo infinito por chunks) — cambio de forma totalmente
// incompatible con saves anteriores, no hay merge posible.
const SAVE_KEY = 'wanderhold-save-v7';

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
