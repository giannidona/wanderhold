import type { DungeonEnemyInstance, EnemyKind } from '../types';

interface EnemyDef {
  kind: EnemyKind;
  label: string;
  maxHp: number;
  attack: number;
  lootWood: [number, number];
  lootStone: [number, number];
  weight: number;
}

const ENEMY_DEFS: EnemyDef[] = [
  { kind: 'slime', label: 'Gelatina', maxHp: 8, attack: 1, lootWood: [0, 1], lootStone: [0, 1], weight: 5 },
  { kind: 'bandit', label: 'Bandido', maxHp: 14, attack: 2, lootWood: [1, 2], lootStone: [1, 2], weight: 3 },
  { kind: 'wolf', label: 'Lobo', maxHp: 12, attack: 3, lootWood: [0, 1], lootStone: [2, 3], weight: 2 },
];

const RUN_LENGTH = 5;

function randRange([min, max]: [number, number]): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted(): EnemyDef {
  const total = ENEMY_DEFS.reduce((sum, d) => sum + d.weight, 0);
  let r = Math.random() * total;
  for (const def of ENEMY_DEFS) {
    if (r < def.weight) return def;
    r -= def.weight;
  }
  return ENEMY_DEFS[0];
}

export function generateEnemyQueue(): DungeonEnemyInstance[] {
  const queue: DungeonEnemyInstance[] = [];
  for (let i = 0; i < RUN_LENGTH; i++) {
    const def = pickWeighted();
    queue.push({
      kind: def.kind,
      label: def.label,
      maxHp: def.maxHp,
      hp: def.maxHp,
      attack: def.attack,
    });
  }
  return queue;
}

export function rollLoot(kind: EnemyKind): { wood: number; stone: number } {
  const def = ENEMY_DEFS.find((d) => d.kind === kind);
  if (!def) return { wood: 0, stone: 0 };
  return { wood: randRange(def.lootWood), stone: randRange(def.lootStone) };
}

export function enemyColor(kind: EnemyKind): string {
  switch (kind) {
    case 'slime':
      return '#4caf50';
    case 'bandit':
      return '#b0413e';
    case 'wolf':
      return '#6c7a89';
  }
}
