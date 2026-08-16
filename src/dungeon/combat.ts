import type { DungeonRunState } from '../types';
import { rollLoot } from './enemies';

let logIdCounter = 0;

function pushLog(run: DungeonRunState, text: string): void {
  logIdCounter += 1;
  run.log.push({ id: logIdCounter, text });
  if (run.log.length > 40) run.log.shift();
}

export function tickCombat(run: DungeonRunState): void {
  if (run.outcome) return;

  const enemy = run.enemies[run.currentEnemyIndex];
  if (!enemy) {
    run.outcome = 'victory';
    return;
  }

  enemy.hp -= run.playerAttack;
  pushLog(run, `Golpeás a ${enemy.label} por ${run.playerAttack} (${Math.max(enemy.hp, 0)}/${enemy.maxHp} HP).`);

  if (enemy.hp <= 0) {
    const loot = rollLoot(enemy.kind);
    run.lootWood += loot.wood;
    run.lootStone += loot.stone;
    pushLog(run, `${enemy.label} cae. Botín: +${loot.wood} madera, +${loot.stone} piedra.`);
    run.currentEnemyIndex += 1;

    if (run.currentEnemyIndex >= run.enemies.length) {
      run.outcome = 'victory';
      pushLog(run, 'Mazmorra despejada. Volviendo a la aldea...');
    }
    return;
  }

  run.playerHp -= enemy.attack;
  pushLog(run, `${enemy.label} te golpea por ${enemy.attack} (${Math.max(run.playerHp, 0)}/${run.playerMaxHp} HP).`);

  if (run.playerHp <= 0) {
    run.outcome = 'defeat';
    pushLog(run, 'Caíste en la mazmorra. Conservás parte del botín...');
  }
}
