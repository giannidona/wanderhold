import type { BuildingKind, GameState, Inventory, TilePos } from '../types';
import { isTileFree } from './village';
import { circleRectOverlap, tileRect } from '../engine/collision';
import { PLAYER_RADIUS, TILE_SIZE } from '../constants';

export interface BuildingCost {
  wood: number;
  stone: number;
  iron: number;
}

export interface BuildingDef {
  kind: BuildingKind;
  label: string;
  cost: BuildingCost;
  description: string;
}

// Capacidad de inventario: base sin ningún Depósito, más un bonus por cada
// Depósito construido (acumulable, sin límite de cuántos construir).
export const INVENTORY_BASE_CAP = 50;
export const STORAGE_CAP_BONUS = 40;

export const BUILDING_DEFS: BuildingDef[] = [
  {
    kind: 'workshop',
    label: 'Taller',
    cost: { wood: 12, stone: 0, iron: 0 },
    description: 'Habilita craftear tiers Madera y Piedra. Solo cuesta madera, así se puede construir a mano antes de tener pico.',
  },
  {
    kind: 'hut',
    label: 'Choza',
    cost: { wood: 6, stone: 2, iron: 0 },
    description: 'Cada Choza suma un poblador que junta +1 madera cada 10s de forma pasiva, sin que tengas que estar cortando árboles.',
  },
  {
    kind: 'forge',
    label: 'Herrería',
    cost: { wood: 0, stone: 15, iron: 5 },
    description: 'Habilita craftear el tier Hierro (necesitás Taller además). Solo cuesta piedra y hierro.',
  },
  {
    kind: 'storage',
    label: 'Depósito',
    cost: { wood: 15, stone: 8, iron: 0 },
    description: `Suma +${STORAGE_CAP_BONUS} de capacidad de inventario por recurso (base ${INVENTORY_BASE_CAP}). Se puede construir más de uno.`,
  },
];

export function getBuildingDef(kind: BuildingKind): BuildingDef {
  const def = BUILDING_DEFS.find((d) => d.kind === kind);
  if (!def) throw new Error(`Building def no encontrado: ${kind}`);
  return def;
}

export function canAfford(state: GameState, cost: BuildingCost): boolean {
  return (
    state.inventory.wood >= cost.wood &&
    state.inventory.stone >= cost.stone &&
    state.inventory.iron >= cost.iron
  );
}

export function placeBuilding(state: GameState, tile: TilePos, kind: BuildingKind): boolean {
  if (!isTileFree(state.village, tile.x, tile.y)) return false;

  const playerOnTile = circleRectOverlap(
    state.player.px,
    state.player.py,
    PLAYER_RADIUS,
    tileRect(tile.x, tile.y, TILE_SIZE)
  );
  if (playerOnTile) return false;

  const def = getBuildingDef(kind);
  if (!canAfford(state, def.cost)) return false;

  state.inventory.wood -= def.cost.wood;
  state.inventory.stone -= def.cost.stone;
  state.inventory.iron -= def.cost.iron;

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

export function hasForge(state: GameState): boolean {
  return state.village.buildings.some((b) => b.kind === 'forge');
}

export function getBuildingCount(state: GameState, kind: BuildingKind): number {
  return state.village.buildings.filter((b) => b.kind === kind).length;
}

export function getInventoryCap(state: GameState): number {
  return INVENTORY_BASE_CAP + getBuildingCount(state, 'storage') * STORAGE_CAP_BONUS;
}

// Suma `amount` al recurso respetando el cap de inventario (el sobrante se
// pierde, no se acumula "en cola"). Devuelve cuánto se sumó realmente,
// útil para decidir si vale la pena disparar un notify().
export function addResourceCapped(state: GameState, resource: keyof Inventory, amount: number): number {
  if (amount <= 0) return 0;
  const cap = getInventoryCap(state);
  const before = state.inventory[resource];
  const after = Math.min(cap, before + amount);
  state.inventory[resource] = after;
  return after - before;
}
