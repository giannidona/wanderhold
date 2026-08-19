import type { GameState, Vector2 } from '../types';
import { circleRectOverlap, tileRect } from './collision';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';
import { getNodesNearTile } from '../state/village';

const SPEED_TILES_PER_SEC = 4.5;
const MAX_STEP_PX = 2;

function isBlocked(state: GameState, cx: number, cy: number): boolean {
  const tileX = Math.floor(cx / TILE_SIZE);
  const tileY = Math.floor(cy / TILE_SIZE);
  const nearbyNodes = getNodesNearTile(state.village, tileX, tileY);

  for (const node of nearbyNodes) {
    if (node.hitsRemaining <= 0) continue;
    if (circleRectOverlap(cx, cy, PLAYER_RADIUS, tileRect(node.x, node.y, TILE_SIZE))) return true;
  }
  for (const b of state.village.buildings) {
    if (circleRectOverlap(cx, cy, PLAYER_RADIUS, tileRect(b.x, b.y, TILE_SIZE))) return true;
  }
  return false;
}

// Mundo infinito: ya no hay un borde de mapa contra el que clampear, el
// único límite al movimiento es chocar contra un nodo/edificio.
function moveAxis(state: GameState, total: number, axis: 'x' | 'y'): void {
  if (total === 0) return;

  const steps = Math.max(1, Math.ceil(Math.abs(total) / MAX_STEP_PX));
  const stepAmount = total / steps;

  for (let i = 0; i < steps; i++) {
    const candidatePx = axis === 'x' ? state.player.px + stepAmount : state.player.px;
    const candidatePy = axis === 'y' ? state.player.py + stepAmount : state.player.py;

    if (isBlocked(state, candidatePx, candidatePy)) break;

    state.player.px = candidatePx;
    state.player.py = candidatePy;
  }
}

// Movimiento libre en píxeles, resuelto en sub-pasos por eje (X y luego Y)
// para poder deslizar contra obstáculos y quedar a mitad de dos tiles,
// en vez de trabarse lejos del tile por un salto grande de un solo golpe.
export function updatePlayerMovement(state: GameState, moveVec: Vector2, dtSeconds: number): void {
  if (moveVec.x === 0 && moveVec.y === 0) return;

  state.player.facing = moveVec;
  // Solo actualiza la dirección horizontal si hay movimiento en X — así
  // moverse solo en vertical (W/S) no "resetea" hacia qué lado mira.
  if (moveVec.x !== 0) {
    state.player.facingDir = moveVec.x > 0 ? 1 : -1;
  }

  const speedPx = SPEED_TILES_PER_SEC * TILE_SIZE;
  moveAxis(state, moveVec.x * speedPx * dtSeconds, 'x');
  moveAxis(state, moveVec.y * speedPx * dtSeconds, 'y');
}
