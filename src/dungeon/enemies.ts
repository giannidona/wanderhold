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

// Escalado por "profundidad" (= cantidad de runs ganadas históricamente,
// ver GameState.dungeonDepth): cada nivel de profundidad hace a los
// enemigos más duros pero también más rentables, así siempre hay un
// próximo hito por el que vale la pena seguir entrando.
const DEPTH_HP_SCALE = 0.12;
const DEPTH_ATTACK_SCALE = 0.1;
const DEPTH_LOOT_SCALE = 0.15;

// Jefes: cada BOSS_INTERVAL runs (la 5ta, 10ma, 15ta...) el último
// enemigo de la cola es un jefe — mismo pool de enemigos pero mucho más
// duro y con mucho mejor botín, para que la progresión tenga hitos
// marcados en vez de ser un escalado continuo sin fricción.
const BOSS_INTERVAL = 5;
const BOSS_HP_MULT = 2.5;
const BOSS_ATTACK_MULT = 1.6;
const BOSS_LOOT_MULT = 3;

export function isBossDepth(depth: number): boolean {
  return (depth + 1) % BOSS_INTERVAL === 0;
}

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

export function generateEnemyQueue(depth: number): DungeonEnemyInstance[] {
  const hpMult = 1 + Math.max(0, depth) * DEPTH_HP_SCALE;
  const attackMult = 1 + Math.max(0, depth) * DEPTH_ATTACK_SCALE;
  const bossRun = isBossDepth(depth);

  const queue: DungeonEnemyInstance[] = [];
  for (let i = 0; i < RUN_LENGTH; i++) {
    const def = pickWeighted();
    const isBoss = bossRun && i === RUN_LENGTH - 1;
    const bossHpMult = isBoss ? BOSS_HP_MULT : 1;
    const bossAttackMult = isBoss ? BOSS_ATTACK_MULT : 1;
    const maxHp = Math.max(1, Math.round(def.maxHp * hpMult * bossHpMult));
    queue.push({
      kind: def.kind,
      label: isBoss ? `Jefe ${def.label}` : def.label,
      maxHp,
      hp: maxHp,
      attack: Math.max(1, Math.round(def.attack * attackMult * bossAttackMult)),
      isBoss,
    });
  }
  return queue;
}

export function rollLoot(kind: EnemyKind, depth: number, isBoss = false): { wood: number; stone: number } {
  const def = ENEMY_DEFS.find((d) => d.kind === kind);
  if (!def) return { wood: 0, stone: 0 };
  const lootMult = (1 + Math.max(0, depth) * DEPTH_LOOT_SCALE) * (isBoss ? BOSS_LOOT_MULT : 1);
  return {
    wood: Math.round(randRange(def.lootWood) * lootMult),
    stone: Math.round(randRange(def.lootStone) * lootMult),
  };
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
