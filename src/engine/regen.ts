import type { GameState, TilePos } from '../types';
import { isTileFree } from '../state/village';
import { circleRectOverlap, tileRect } from './collision';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';

const MAX_PLACEMENT_ATTEMPTS = 200;

function findRespawnTile(state: GameState, exclude: TilePos): TilePos | null {
  const size = state.village.gridSize;

  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    if (x === exclude.x && y === exclude.y) continue;
    if (!isTileFree(state.village, x, y)) continue;
    if (circleRectOverlap(state.player.px, state.player.py, PLAYER_RADIUS, tileRect(x, y, TILE_SIZE))) continue;
    return { x, y };
  }

  return null;
}

// Nodos agotados vuelven a estar disponibles solos pasado su respawnAt, en un
// tile libre distinto al que ocupaban (sin countdown visible en el juego),
// además del respawn parcial instantáneo al volver de la mazmorra.
export function tickResourceRegen(state: GameState, now: number): void {
  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining > 0) continue;
    if (node.respawnAt === null) continue;
    if (now < node.respawnAt) continue;

    const newTile = findRespawnTile(state, { x: node.x, y: node.y });
    if (newTile) {
      node.x = newTile.x;
      node.y = newTile.y;
    }

    node.hitsRemaining = node.maxHits;
    node.respawnAt = null;
  }
}
