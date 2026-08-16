import type { GameState } from '../types';
import { hasWorkshop } from './buildings';

export type ToolKind = 'axe' | 'pickaxe';

interface CraftDef {
  tool: ToolKind;
  label: string;
  baseCost: { wood: number; stone: number };
  maxLevel: number;
}

const CRAFT_DEFS: CraftDef[] = [
  { tool: 'axe', label: 'Hacha', baseCost: { wood: 5, stone: 3 }, maxLevel: 3 },
  { tool: 'pickaxe', label: 'Pico', baseCost: { wood: 3, stone: 5 }, maxLevel: 3 },
];

export function getCraftDef(tool: ToolKind): CraftDef {
  const def = CRAFT_DEFS.find((d) => d.tool === tool);
  if (!def) throw new Error(`Craft def no encontrado: ${tool}`);
  return def;
}

export function getToolLevel(state: GameState, tool: ToolKind): number {
  return tool === 'axe' ? state.player.tools.axeLevel : state.player.tools.pickaxeLevel;
}

export function costForNextLevel(tool: ToolKind, currentLevel: number): { wood: number; stone: number } {
  const def = getCraftDef(tool);
  const nextLevel = currentLevel + 1;
  return { wood: def.baseCost.wood * nextLevel, stone: def.baseCost.stone * nextLevel };
}

export function canCraft(state: GameState, tool: ToolKind): boolean {
  if (!hasWorkshop(state)) return false;
  const def = getCraftDef(tool);
  const level = getToolLevel(state, tool);
  if (level >= def.maxLevel) return false;
  const cost = costForNextLevel(tool, level);
  return state.inventory.wood >= cost.wood && state.inventory.stone >= cost.stone;
}

export function craftTool(state: GameState, tool: ToolKind): boolean {
  if (!canCraft(state, tool)) return false;

  const level = getToolLevel(state, tool);
  const cost = costForNextLevel(tool, level);

  state.inventory.wood -= cost.wood;
  state.inventory.stone -= cost.stone;

  if (tool === 'axe') {
    state.player.tools.axeLevel += 1;
  } else {
    state.player.tools.pickaxeLevel += 1;
  }

  return true;
}

export { CRAFT_DEFS };
