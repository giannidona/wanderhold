import type { BuildingKind, GameState, TilePos } from '../types';
import { isTileEmpty } from './village';

export interface BuildingCost {
  wood: number;
  stone: number;
}

export interface BuildingDef {
  kind: BuildingKind;
  label: string;
  cost: BuildingCost;
  description: string;
}

export const BUILDING_DEFS: BuildingDef[] = [
  {
    kind: 'workshop',
    label: 'Taller',
    cost: { wood: 10, stone: 5 },
    description: 'Habilita craftear hacha y pico.',
  },
  {
    kind: 'hut',
    label: 'Choza',
    cost: { wood: 6, stone: 2 },
    description: 'Vivienda básica. Sin efecto todavía (futuro: población).',
  },
];

export function getBuildingDef(kind: BuildingKind): BuildingDef {
  const def = BUILDING_DEFS.find((d) => d.kind === kind);
  if (!def) throw new Error(`Building def no encontrado: ${kind}`);
  return def;
}

export function canAfford(state: GameState, cost: BuildingCost): boolean {
  return state.inventory.wood >= cost.wood && state.inventory.stone >= cost.stone;
}

export function placeBuilding(state: GameState, tile: TilePos, kind: BuildingKind): boolean {
  if (!isTileEmpty(state.village, tile.x, tile.y, state.player)) return false;

  const def = getBuildingDef(kind);
  if (!canAfford(state, def.cost)) return false;

  state.inventory.wood -= def.cost.wood;
  state.inventory.stone -= def.cost.stone;

  state.village.buildings.push({
    id: `${kind}-${tile.x}-${tile.y}-${Date.now()}`,
    kind,
    x: tile.x,
    y: tile.y,
  });

  return true;
}

export function hasWorkshop(state: GameState): boolean {
  return state.village.buildings.some((b) => b.kind === 'workshop');
}
