import type { Direction, GameState } from '../types';
import { findBuildingAt, findNodeAt } from '../state/village';

export type MoveResult = 'moved' | 'gathered' | 'blocked';

const DIRECTION_DELTA: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function tryMove(state: GameState, dir: Direction): MoveResult {
  state.player.facing = dir;

  const delta = DIRECTION_DELTA[dir];
  const targetX = state.player.x + delta.x;
  const targetY = state.player.y + delta.y;
  const size = state.village.gridSize;

  if (targetX < 0 || targetY < 0 || targetX >= size || targetY >= size) {
    return 'blocked';
  }

  const node = findNodeAt(state.village, targetX, targetY);
  if (node) {
    const toolLevel = node.kind === 'wood' ? state.player.tools.axeLevel : state.player.tools.pickaxeLevel;
    const perHitYield = 1 + toolLevel;

    node.hitsRemaining -= 1;
    const depletionBonus = node.hitsRemaining <= 0 ? perHitYield : 0;
    state.inventory[node.kind] += perHitYield + depletionBonus;

    return 'gathered';
  }

  if (findBuildingAt(state.village, targetX, targetY)) {
    return 'blocked';
  }

  state.player.x = targetX;
  state.player.y = targetY;
  return 'moved';
}

export { DIRECTION_DELTA };
