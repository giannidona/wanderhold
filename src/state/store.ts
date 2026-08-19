import type { GameState, QuestStats } from '../types';
import { createInitialVillage } from './village';
import { loadGame } from './save';
import { TILE_SIZE } from '../constants';
import { initialQuests } from './quests';
import { createInitialProgression } from './progression';

// Mundo infinito: el punto de partida ya no necesita estar "adentro" de
// nada, arrancamos en el origen (0,0) — coordenadas limpias para mostrar
// en el HUD.
const START_TILE = { x: 0, y: 0 };

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function createNewState(): GameState {
  const stats: QuestStats = {
    lifetimeWood: 0,
    lifetimeStone: 0,
    lifetimeIron: 0,
    dungeonWins: 0,
    enemiesDefeated: 0,
    buildingsBuilt: 0,
  };

  return {
    scene: 'village',
    player: {
      px: START_TILE.x * TILE_SIZE + TILE_SIZE / 2,
      py: START_TILE.y * TILE_SIZE + TILE_SIZE / 2,
      facing: { x: 0, y: 1 },
      facingDir: 1,
      tools: { axeLevel: 0, pickaxeLevel: 0 },
      armor: { head: 0, chest: 0, boots: 0 },
      combat: { maxHp: 20, attack: 4 },
    },
    inventory: { wood: 0, stone: 0, iron: 0 },
    village: createInitialVillage(randomSeed(), START_TILE),
    dungeon: null,
    pendingBuildTile: null,
    dungeonDepth: 0,
    lastPassiveTickAt: 0,
    stats,
    quests: initialQuests(stats),
    progression: createInitialProgression(),
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
      armor: { ...fresh.player.armor, ...loaded.player?.armor },
      combat: { ...fresh.player.combat, ...loaded.player?.combat },
      facing: loaded.player?.facing ?? fresh.player.facing,
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
