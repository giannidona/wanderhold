import type { DungeonRunState, PlayerProgression, QuestStats } from '../types';
import { rollLoot } from './enemies';
import { getProspectorMultiplier, grantXp, XP_PER_BOSS_BONUS, XP_PER_ENEMY } from '../state/progression';

let logIdCounter = 0;

function pushLog(run: DungeonRunState, text: string): void {
  logIdCounter += 1;
  run.log.push({ id: logIdCounter, text });
  if (run.log.length > 40) run.log.shift();
}

export function tickCombat(run: DungeonRunState, stats: QuestStats, progression: PlayerProgression): void {
  if (run.outcome) return;

  const enemy = run.enemies[run.currentEnemyIndex];
  if (!enemy) {
    run.outcome = 'victory';
    return;
  }

  enemy.hp -= run.playerAttack;
  pushLog(run, `Golpeás a ${enemy.label} por ${run.playerAttack} (${Math.max(enemy.hp, 0)}/${enemy.maxHp} HP).`);

  if (enemy.hp <= 0) {
    stats.enemiesDefeated += 1;
    grantXp(progression, enemy.isBoss ? XP_PER_ENEMY + XP_PER_BOSS_BONUS : XP_PER_ENEMY);

    const rawLoot = rollLoot(enemy.kind, run.depth, enemy.isBoss);
    const lootMult = getProspectorMultiplier(progression);
    const loot = { wood: Math.round(rawLoot.wood * lootMult), stone: Math.round(rawLoot.stone * lootMult) };
    run.lootWood += loot.wood;
    run.lootStone += loot.stone;
    pushLog(
      run,
      enemy.isBoss
        ? `¡Derrotaste a ${enemy.label}! Botín de jefe: +${loot.wood} madera, +${loot.stone} piedra.`
        : `${enemy.label} cae. Botín: +${loot.wood} madera, +${loot.stone} piedra.`
    );
    run.currentEnemyIndex += 1;

    if (run.currentEnemyIndex >= run.enemies.length) {
      run.outcome = 'victory';
      pushLog(run, 'Mazmorra despejada. Volviendo a la aldea...');
    }
    return;
  }

  const damage = Math.max(1, enemy.attack - run.playerDefense);
  run.playerHp -= damage;
  pushLog(run, `${enemy.label} te golpea por ${damage} (${Math.max(run.playerHp, 0)}/${run.playerMaxHp} HP).`);

  if (run.playerHp <= 0) {
    run.outcome = 'defeat';
    pushLog(run, 'Caíste en la mazmorra. Conservás parte del botín...');
  }
}
