import type { ArmorSlotKind, BuildingKind, GameState } from '../types';
import { hasForge, hasWorkshop } from './buildings';

export type ToolKind = 'axe' | 'pickaxe';
export type ArmorSlot = ArmorSlotKind;

export interface TierCost {
  wood: number;
  stone: number;
  iron: number;
}

export interface ToolTierDef {
  level: number;
  label: string;
  cost: TierCost | null;
  requiresBuilding?: BuildingKind;
}

export interface ArmorTierDef extends ToolTierDef {
  defense: number;
}

// Progresión estilo Minecraft: Mano -> Madera -> Piedra (con Taller) -> Hierro
// (con Taller + Herrería). Para sumar Diamante más adelante alcanza con
// agregar una fila acá.
export const TOOL_TIERS: ToolTierDef[] = [
  { level: 0, label: 'Mano', cost: null },
  { level: 1, label: 'Madera', cost: { wood: 5, stone: 0, iron: 0 } },
  { level: 2, label: 'Piedra', cost: { wood: 2, stone: 6, iron: 0 } },
  { level: 3, label: 'Hierro', cost: { wood: 2, stone: 4, iron: 6 }, requiresBuilding: 'forge' },
];

export const ARMOR_TIERS: ArmorTierDef[] = [
  { level: 0, label: 'Ninguna', cost: null, defense: 0 },
  { level: 1, label: 'Madera', cost: { wood: 6, stone: 0, iron: 0 }, defense: 1 },
  { level: 2, label: 'Piedra', cost: { wood: 2, stone: 8, iron: 0 }, defense: 2 },
  { level: 3, label: 'Hierro', cost: { wood: 2, stone: 6, iron: 8 }, defense: 4, requiresBuilding: 'forge' },
];

export const TOOL_KINDS: { kind: ToolKind; label: string }[] = [
  { kind: 'axe', label: 'Hacha' },
  { kind: 'pickaxe', label: 'Pico' },
];

export const ARMOR_SLOTS: { slot: ArmorSlot; label: string }[] = [
  { slot: 'head', label: 'Casco' },
  { slot: 'chest', label: 'Pechera' },
  { slot: 'boots', label: 'Botas' },
];

export function getToolLevel(state: GameState, tool: ToolKind): number {
  return tool === 'axe' ? state.player.tools.axeLevel : state.player.tools.pickaxeLevel;
}

export function getArmorLevel(state: GameState, slot: ArmorSlot): number {
  return state.player.armor[slot];
}

export function totalDefense(state: GameState): number {
  return ARMOR_SLOTS.reduce((sum, { slot }) => sum + ARMOR_TIERS[getArmorLevel(state, slot)].defense, 0);
}

function canAffordCost(state: GameState, cost: TierCost): boolean {
  return (
    state.inventory.wood >= cost.wood &&
    state.inventory.stone >= cost.stone &&
    state.inventory.iron >= cost.iron
  );
}

function hasRequiredBuilding(state: GameState, building?: BuildingKind): boolean {
  if (!building) return true;
  if (building === 'forge') return hasForge(state);
  return true;
}

export function canCraftTool(state: GameState, tool: ToolKind): boolean {
  if (!hasWorkshop(state)) return false;
  const next = TOOL_TIERS[getToolLevel(state, tool) + 1];
  if (!next?.cost) return false;
  if (!hasRequiredBuilding(state, next.requiresBuilding)) return false;
  return canAffordCost(state, next.cost);
}

export function craftTool(state: GameState, tool: ToolKind): boolean {
  if (!canCraftTool(state, tool)) return false;
  const next = TOOL_TIERS[getToolLevel(state, tool) + 1];
  if (!next?.cost) return false;

  state.inventory.wood -= next.cost.wood;
  state.inventory.stone -= next.cost.stone;
  state.inventory.iron -= next.cost.iron;

  if (tool === 'axe') state.player.tools.axeLevel += 1;
  else state.player.tools.pickaxeLevel += 1;

  return true;
}

export function canCraftArmor(state: GameState, slot: ArmorSlot): boolean {
  if (!hasWorkshop(state)) return false;
  const next = ARMOR_TIERS[getArmorLevel(state, slot) + 1];
  if (!next?.cost) return false;
  if (!hasRequiredBuilding(state, next.requiresBuilding)) return false;
  return canAffordCost(state, next.cost);
}

export function craftArmor(state: GameState, slot: ArmorSlot): boolean {
  if (!canCraftArmor(state, slot)) return false;
  const next = ARMOR_TIERS[getArmorLevel(state, slot) + 1];
  if (!next?.cost) return false;

  state.inventory.wood -= next.cost.wood;
  state.inventory.stone -= next.cost.stone;
  state.inventory.iron -= next.cost.iron;
  state.player.armor[slot] += 1;

  return true;
}

// ¿Le falta un edificio específico para esta mejora (más allá del Taller)?
export function missingBuildingFor(next: ToolTierDef | undefined, state: GameState): string | null {
  if (!next?.requiresBuilding) return null;
  if (hasRequiredBuilding(state, next.requiresBuilding)) return null;
  return next.requiresBuilding === 'forge' ? 'Requiere Herrería' : null;
}
