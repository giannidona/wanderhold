import type { GameState } from '../types';
import { generateEnemyQueue } from './enemies';

const DEFEAT_LOOT_RETENTION = 0.5;
const NODE_RESPAWN_RATIO = 0.3;

export function enterDungeon(state: GameState): void {
  if (state.scene === 'dungeon') return;

  state.scene = 'dungeon';
  state.dungeon = {
    enemies: generateEnemyQueue(),
    currentEnemyIndex: 0,
    playerHp: state.player.combat.maxHp,
    playerMaxHp: state.player.combat.maxHp,
    playerAttack: state.player.combat.attack,
    lootWood: 0,
    lootStone: 0,
    log: [{ id: 0, text: 'Entrás a la mazmorra...' }],
    outcome: null,
  };
}

export function exitDungeon(state: GameState): void {
  const run = state.dungeon;
  if (!run) {
    state.scene = 'village';
    return;
  }

  const retention = run.outcome === 'defeat' ? DEFEAT_LOOT_RETENTION : 1;
  state.inventory.wood += Math.floor(run.lootWood * retention);
  state.inventory.stone += Math.floor(run.lootStone * retention);

  respawnResourceNodes(state);

  state.dungeon = null;
  state.scene = 'village';
}

function respawnResourceNodes(state: GameState): void {
  const depleted = state.village.resourceNodes.filter((n) => n.hitsRemaining <= 0);
  const toRespawn = Math.round(depleted.length * NODE_RESPAWN_RATIO);

  for (let i = 0; i < toRespawn; i++) {
    if (depleted.length === 0) break;
    const idx = Math.floor(Math.random() * depleted.length);
    const node = depleted.splice(idx, 1)[0];
    if (node) node.hitsRemaining = node.maxHits;
  }
}
