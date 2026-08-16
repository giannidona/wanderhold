import type { GameState } from '../types';
import { createInitialVillage } from './village';
import { loadGame } from './save';

const GRID_SIZE = 20;
const START_POS = { x: 10, y: 10 };

function createNewState(): GameState {
  return {
    scene: 'village',
    player: {
      x: START_POS.x,
      y: START_POS.y,
      facing: 'down',
      tools: { axeLevel: 0, pickaxeLevel: 0 },
      combat: { maxHp: 20, attack: 4 },
    },
    inventory: { wood: 0, stone: 0 },
    village: createInitialVillage(GRID_SIZE, START_POS),
    dungeon: null,
    pendingBuildTile: null,
  };
}

function hydrate(loaded: GameState | null): GameState {
  const fresh = createNewState();
  if (!loaded) return fresh;

  return {
    ...fresh,
    ...loaded,
    scene: loaded.scene ?? 'village',
    player: {
      ...fresh.player,
      ...loaded.player,
      tools: { ...fresh.player.tools, ...loaded.player?.tools },
      combat: { ...fresh.player.combat, ...loaded.player?.combat },
    },
    inventory: { ...fresh.inventory, ...loaded.inventory },
    village: loaded.village
      ? { ...loaded.village, buildings: loaded.village.buildings ?? [] }
      : fresh.village,
    dungeon: loaded.dungeon ?? null,
    pendingBuildTile: null,
  };
}

export const state: GameState = hydrate(loadGame());

const listeners: Array<() => void> = [];

export function subscribe(fn: () => void): void {
  listeners.push(fn);
}

export function notify(): void {
  for (const fn of listeners) fn();
}
