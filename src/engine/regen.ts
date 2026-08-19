import type { GameState } from '../types';
import { getAllLoadedNodes } from '../state/village';

// Nodos agotados vuelven a estar disponibles solos pasado su respawnAt, en
// el mismo lugar que ocupaban. Con mundo infinito ya no tiene sentido
// "buscar un tile libre en el grid" (no hay un grid acotado que recorrer);
// respawnear in-place además hace que los puntos de recolección del
// jugador sean predecibles y no se le "escapen" a otro lado del mapa.
export function tickResourceRegen(state: GameState, now: number): void {
  for (const node of getAllLoadedNodes(state.village)) {
    if (node.hitsRemaining > 0) continue;
    if (node.respawnAt === null) continue;
    if (now < node.respawnAt) continue;

    node.hitsRemaining = node.maxHits;
    node.respawnAt = null;
  }
}
