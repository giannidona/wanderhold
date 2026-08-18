import type { GameState, ResourceKind, ResourceNode } from '../types';
import { circleRectOverlap, tileRect } from './collision';
import { PLAYER_RADIUS, RESOURCE_REGEN_MS, TILE_SIZE } from '../constants';
import { addResourceCapped } from '../state/buildings';
import { spawnFloatingText } from './floatingText';

const GATHER_COOLDOWN_MS = 450;
export const GATHER_RADIUS = PLAYER_RADIUS + 4;

// Mismos tonos que ya usa el hotbar para cada tier de material (Madera =
// marrón tier-1, Piedra = gris tier-2, Hierro = azulado tier-3), así el
// popup de recolección se siente parte de la misma paleta.
const RESOURCE_LABEL: Record<ResourceKind, string> = { wood: 'madera', stone: 'piedra', iron: 'hierro' };
const RESOURCE_COLOR: Record<ResourceKind, string> = { wood: '#c98a4b', stone: '#b7bcc4', iron: '#8fa3c9' };

const lastGatherAt = new Map<string, number>();

function canGather(state: GameState, nodeKind: ResourceKind): boolean {
  // Los árboles se cortan a mano. La piedra necesita pico de Madera (nv. 1+).
  // El hierro necesita pico de Piedra (nv. 2+).
  if (nodeKind === 'stone') return state.player.tools.pickaxeLevel >= 1;
  if (nodeKind === 'iron') return state.player.tools.pickaxeLevel >= 2;
  return true;
}

// Compartido con el renderer: mientras el jugador esté en contacto con un
// nodo se considera que lo está "minando", y ahí es cuando conviene
// mostrarle su barra de vida.
export function isPlayerTouchingNode(state: GameState, node: ResourceNode): boolean {
  return circleRectOverlap(state.player.px, state.player.py, GATHER_RADIUS, tileRect(node.x, node.y, TILE_SIZE));
}

// Con movimiento libre ya no hay "bump" discreto: mientras el jugador esté
// en contacto con un nodo (y tenga la herramienta necesaria), se resuelve
// un golpe cada GATHER_COOLDOWN_MS.
export function tickGathering(state: GameState, now: number): void {
  for (const node of state.village.resourceNodes) {
    if (node.hitsRemaining <= 0) continue;
    if (!canGather(state, node.kind)) continue;

    if (!isPlayerTouchingNode(state, node)) continue;

    const last = lastGatherAt.get(node.id) ?? 0;
    if (now - last < GATHER_COOLDOWN_MS) continue;
    lastGatherAt.set(node.id, now);

    const toolLevel = node.kind === 'wood' ? state.player.tools.axeLevel : state.player.tools.pickaxeLevel;
    const perHitYield = 1 + toolLevel;

    node.hitsRemaining -= 1;
    const depletionBonus = node.hitsRemaining <= 0 ? perHitYield : 0;
    addResourceCapped(state, node.kind, perHitYield + depletionBonus);

    if (node.hitsRemaining <= 0) {
      node.respawnAt = now + RESOURCE_REGEN_MS;

      const totalGained = perHitYield + depletionBonus;
      spawnFloatingText(
        node.x * TILE_SIZE + TILE_SIZE / 2,
        node.y * TILE_SIZE,
        `+${totalGained} ${RESOURCE_LABEL[node.kind]}`,
        RESOURCE_COLOR[node.kind]
      );
    }
  }
}
