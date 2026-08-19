import type { GameState } from '../types';
import { generateEnemyQueue } from './enemies';
import { totalDefense } from '../state/craft';
import { addResourceCapped } from '../state/buildings';
import { getResilienceBonus, getStrengthBonus, getVigorBonus, grantXp, XP_PER_WIN } from '../state/progression';
import { getAllLoadedNodes } from '../state/village';

export const DEFEAT_LOOT_RETENTION = 0.5;
const NODE_RESPAWN_RATIO = 0.3;

export function enterDungeon(state: GameState): void {
  if (state.scene === 'dungeon') return;

  const maxHp = state.player.combat.maxHp + getVigorBonus(state.progression);

  state.scene = 'dungeon';
  state.dungeon = {
    enemies: generateEnemyQueue(state.dungeonDepth),
    currentEnemyIndex: 0,
    playerHp: maxHp,
    playerMaxHp: maxHp,
    playerAttack: state.player.combat.attack + getStrengthBonus(state.progression),
    playerDefense: totalDefense(state) + getResilienceBonus(state.progression),
    lootWood: 0,
    lootStone: 0,
    log: [{ id: 0, text: 'Entrás a la mazmorra...' }],
    outcome: null,
    // Snapshot: aunque el jugador gane otras runs mientras ésta está en
    // curso (no debería poder, pero por las dudas), esta run sigue
    // escalada a la profundidad con la que entró.
    depth: state.dungeonDepth,
  };
}

// Se llama cuando el jugador clickea "Volver a la aldea" en la pantalla de
// resultado (ya no hay retorno automático por tiempo).
export function exitDungeon(state: GameState): void {
  const run = state.dungeon;
  if (!run) {
    state.scene = 'village';
    return;
  }

  const retention = run.outcome === 'defeat' ? DEFEAT_LOOT_RETENTION : 1;
  addResourceCapped(state, 'wood', Math.floor(run.lootWood * retention));
  addResourceCapped(state, 'stone', Math.floor(run.lootStone * retention));

  if (run.outcome === 'victory') {
    state.dungeonDepth += 1;
    state.stats.dungeonWins += 1;
    grantXp(state.progression, XP_PER_WIN);
  }

  respawnResourceNodes(state);

  state.dungeon = null;
  state.scene = 'village';
}

function respawnResourceNodes(state: GameState): void {
  const depleted = getAllLoadedNodes(state.village).filter((n) => n.hitsRemaining <= 0);
  const toRespawn = Math.round(depleted.length * NODE_RESPAWN_RATIO);

  for (let i = 0; i < toRespawn; i++) {
    if (depleted.length === 0) break;
    const idx = Math.floor(Math.random() * depleted.length);
    const node = depleted.splice(idx, 1)[0];
    if (node) {
      node.hitsRemaining = node.maxHits;
      node.respawnAt = null;
    }
  }
}
