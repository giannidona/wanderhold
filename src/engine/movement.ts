import type { GameState, Vector2 } from '../types';
import { circleRectOverlap, clamp, tileRect } from './collision';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';

const SPEED_TILES_PER_SEC = 4.5;
const MAX_STEP_PX = 2;

function isBlocked(state: GameState, cx: number, cy: number): boolean {
  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining <= 0) continue;
    if (circleRectOverlap(cx, cy, PLAYER_RADIUS, tileRect(node.x, node.y, TILE_SIZE))) return true;
  }
  for (const b of state.village.buildings) {
    if (circleRectOverlap(cx, cy, PLAYER_RADIUS, tileRect(b.x, b.y, TILE_SIZE))) return true;
  }
  return false;
}

function moveAxis(state: GameState, total: number, axis: 'x' | 'y'): void {
  if (total === 0) return;

  const bound = state.village.gridSize * TILE_SIZE;
  const steps = Math.max(1, Math.ceil(Math.abs(total) / MAX_STEP_PX));
  const stepAmount = total / steps;

  for (let i = 0; i < steps; i++) {
    const candidatePx = axis === 'x' ? state.player.px + stepAmount : state.player.px;
    const candidatePy = axis === 'y' ? state.player.py + stepAmount : state.player.py;
    const clampedPx = clamp(candidatePx, PLAYER_RADIUS, bound - PLAYER_RADIUS);
    const clampedPy = clamp(candidatePy, PLAYER_RADIUS, bound - PLAYER_RADIUS);

    if (isBlocked(state, clampedPx, clampedPy)) break;

    state.player.px = clampedPx;
    state.player.py = clampedPy;
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
