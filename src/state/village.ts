import type { Building, ResourceNode, VillageState } from '../types';

const TREE_COUNT = 16;
const ROCK_COUNT = 10;
const TREE_HITS = 3;
const ROCK_HITS = 4;

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function createInitialVillage(
  gridSize: number,
  avoid: { x: number; y: number }
): VillageState {
  const nodes: ResourceNode[] = [];
  const occupied = new Set<string>([`${avoid.x},${avoid.y}`]);

  function placeNodes(kind: ResourceNode['kind'], count: number, maxHits: number): void {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 50) {
      attempts++;
      const x = randInt(gridSize);
      const y = randInt(gridSize);
      const key = `${x},${y}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      nodes.push({
        id: `${kind}-${x}-${y}`,
        kind,
        x,
        y,
        hitsRemaining: maxHits,
        maxHits,
      });
      placed++;
    }
  }

  placeNodes('wood', TREE_COUNT, TREE_HITS);
  placeNodes('stone', ROCK_COUNT, ROCK_HITS);

  return { gridSize, resourceNodes: nodes, buildings: [] };
}

export function findNodeAt(village: VillageState, x: number, y: number): ResourceNode | undefined {
  return village.resourceNodes.find((n) => n.x === x && n.y === y && n.hitsRemaining > 0);
}

export function findBuildingAt(village: VillageState, x: number, y: number): Building | undefined {
  return village.buildings.find((b) => b.x === x && b.y === y);
}

export function isTileEmpty(village: VillageState, x: number, y: number, player: { x: number; y: number }): boolean {
  if (x === player.x && y === player.y) return false;
  if (findNodeAt(village, x, y)) return false;
  if (findBuildingAt(village, x, y)) return false;
  return true;
}
