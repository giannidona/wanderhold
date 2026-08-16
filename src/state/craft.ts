import type { ArmorSlotKind, GameState } from '../types';
import { hasWorkshop } from './buildings';

export type ToolKind = 'axe' | 'pickaxe';
export type ArmorSlot = ArmorSlotKind;

export interface TierCost {
  wood: number;
  stone: number;
}

export interface ToolTierDef {
  level: number;
  label: string;
  cost: TierCost | null;
}

export interface ArmorTierDef extends ToolTierDef {
  defense: number;
}

// Progresión estilo Minecraft: Mano (sin herramienta) -> Madera -> Piedra.
// Para sumar Hierro/Diamante más adelante alcanza con agregar una fila acá.
export const TOOL_TIERS: ToolTierDef[] = [
  { level: 0, label: 'Mano', cost: null },
  { level: 1, label: 'Madera', cost: { wood: 5, stone: 0 } },
  { level: 2, label: 'Piedra', cost: { wood: 2, stone: 6 } },
];

export const ARMOR_TIERS: ArmorTierDef[] = [
  { level: 0, label: 'Ninguna', cost: null, defense: 0 },
  { level: 1, label: 'Madera', cost: { wood: 6, stone: 0 }, defense: 1 },
  { level: 2, label: 'Piedra', cost: { wood: 2, stone: 8 }, defense: 2 },
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
  return state.inventory.wood >= cost.wood && state.inventory.stone >= cost.stone;
}

export function canCraftTool(state: GameState, tool: ToolKind): boolean {
  if (!hasWorkshop(state)) return false;
  const next = TOOL_TIERS[getToolLevel(state, tool) + 1];
  if (!next?.cost) return false;
  return canAffordCost(state, next.cost);
}

export function craftTool(state: GameState, tool: ToolKind): boolean {
  if (!canCraftTool(state, tool)) return false;
  const next = TOOL_TIERS[getToolLevel(state, tool) + 1];
  if (!next?.cost) return false;

  state.inventory.wood -= next.cost.wood;
  state.inventory.stone -= next.cost.stone;

  if (tool === 'axe') state.player.tools.axeLevel += 1;
  else state.player.tools.pickaxeLevel += 1;

  return true;
}

export function canCraftArmor(state: GameState, slot: ArmorSlot): boolean {
  if (!hasWorkshop(state)) return false;
  const next = ARMOR_TIERS[getArmorLevel(state, slot) + 1];
  if (!next?.cost) return false;
  return canAffordCost(state, next.cost);
}

export function craftArmor(state: GameState, slot: ArmorSlot): boolean {
  if (!canCraftArmor(state, slot)) return false;
  const next = ARMOR_TIERS[getArmorLevel(state, slot) + 1];
  if (!next?.cost) return false;

  state.inventory.wood -= next.cost.wood;
  state.inventory.stone -= next.cost.stone;
  state.player.armor[slot] += 1;

  return true;
}
