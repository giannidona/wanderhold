import type { GameState, ResourceKind } from '../types';
import { circleRectOverlap, tileRect } from './collision';
import { PLAYER_RADIUS, RESOURCE_REGEN_MS, TILE_SIZE } from '../constants';

const GATHER_COOLDOWN_MS = 450;
const GATHER_RADIUS = PLAYER_RADIUS + 4;

const lastGatherAt = new Map<string, number>();

function canGather(state: GameState, nodeKind: ResourceKind): boolean {
  // Los árboles se cortan a mano. La piedra necesita pico de Madera (nv. 1+).
  // El hierro necesita pico de Piedra (nv. 2+).
  if (nodeKind === 'stone') return state.player.tools.pickaxeLevel >= 1;
  if (nodeKind === 'iron') return state.player.tools.pickaxeLevel >= 2;
  return true;
}

// Con movimiento libre ya no hay "bump" discreto: mientras el jugador esté
// en contacto con un nodo (y tenga la herramienta necesaria), se resuelve
// un golpe cada GATHER_COOLDOWN_MS.
export function tickGathering(state: GameState, now: number): void {
  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining <= 0) continue;
    if (!canGather(state, node.kind)) continue;

    const touching = circleRectOverlap(state.player.px, state.player.py, GATHER_RADIUS, tileRect(node.x, node.y, TILE_SIZE));
    if (!touching) continue;

    const last = lastGatherAt.get(node.id) ?? 0;
    if (now - last < GATHER_COOLDOWN_MS) continue;
    lastGatherAt.set(node.id, now);

    const toolLevel = node.kind === 'wood' ? state.player.tools.axeLevel : state.player.tools.pickaxeLevel;
    const perHitYield = 1 + toolLevel;

    node.hitsRemaining -= 1;
    const depletionBonus = node.hitsRemaining <= 0 ? perHitYield : 0;
    state.inventory[node.kind] += perHitYield + depletionBonus;

    if (node.hitsRemaining <= 0) {
      node.respawnAt = now + RESOURCE_REGEN_MS;
    }
  }
}
