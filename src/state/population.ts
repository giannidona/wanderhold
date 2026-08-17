import type { GameState } from '../types';
import { addResourceCapped, getBuildingCount } from './buildings';

export const POPULATION_TICK_MS = 10_000;
export const WOOD_PER_POPULATION = 1;

export function getPopulation(state: GameState): number {
  return getBuildingCount(state, 'hut');
}

// Cada Choza construida sostiene un poblador que junta madera de forma
// pasiva, sin que el jugador tenga que estar tocando un árbol — le da un
// efecto real a la Choza (antes era puramente decorativa) y hace que
// alejarte a la mazmorra no "pare" del todo la economía de la aldea.
// Devuelve true si efectivamente se sumó algo (para decidir si conviene
// notificar a la UI).
export function tickPassiveIncome(state: GameState, now: number): boolean {
  if (now - state.lastPassiveTickAt < POPULATION_TICK_MS) return false;
  state.lastPassiveTickAt = now;

  const population = getPopulation(state);
  if (population <= 0) return false;

  const gained = addResourceCapped(state, 'wood', population * WOOD_PER_POPULATION);
  return gained > 0;
}
