import type { PerkKind, PlayerProgression } from '../types';

export interface PerkDef {
  kind: PerkKind;
  label: string;
  description: string;
}

// Bonos permanentes, acumulables por cantidad de veces elegido. Todos son
// chicos a propósito — la idea es que sean un "plus" sobre la progresión
// de gear (crafteo), no un reemplazo.
const VIGOR_HP_PER_STACK = 4;
const STRENGTH_ATK_PER_STACK = 1;
const RESILIENCE_DEF_PER_STACK = 1;
const PROSPECTOR_LOOT_PER_STACK = 0.1;
const FORAGER_COOLDOWN_PER_STACK = 0.1;
const FORAGER_COOLDOWN_FLOOR = 0.5; // nunca baja de 50% del cooldown original

export const PERK_DEFS: PerkDef[] = [
  { kind: 'vigor', label: 'Vigor', description: `+${VIGOR_HP_PER_STACK} HP máximo en la mazmorra.` },
  { kind: 'strength', label: 'Fuerza', description: `+${STRENGTH_ATK_PER_STACK} de ataque en la mazmorra.` },
  { kind: 'resilience', label: 'Resistencia', description: `+${RESILIENCE_DEF_PER_STACK} de defensa en la mazmorra.` },
  {
    kind: 'prospector',
    label: 'Prospector',
    description: `+${Math.round(PROSPECTOR_LOOT_PER_STACK * 100)}% de botín en la mazmorra (acumulable).`,
  },
  {
    kind: 'forager',
    label: 'Recolector',
    description: `-${Math.round(FORAGER_COOLDOWN_PER_STACK * 100)}% de tiempo entre golpes al recolectar (acumulable, hasta -${Math.round((1 - FORAGER_COOLDOWN_FLOOR) * 100)}%).`,
  },
];

// XP requerida para pasar del nivel N al N+1. Crece linealmente: cada run
// de mazmorra normal da ~XP_PER_ENEMY*5 + XP_PER_WIN, así que los primeros
// niveles caen rápido pero el ritmo se estira con el tiempo sin volverse
// una pared — es un primer número a ajustar con playtesting.
const XP_BASE = 50;
const XP_GROWTH_PER_LEVEL = 30;

export function xpThreshold(level: number): number {
  return XP_BASE + (level - 1) * XP_GROWTH_PER_LEVEL;
}

export const XP_PER_ENEMY = 8;
export const XP_PER_BOSS_BONUS = 25;
export const XP_PER_WIN = 12;

function randomPerkChoices(): PerkKind[] {
  const shuffled = [...PERK_DEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((d) => d.kind);
}

export function createInitialProgression(): PlayerProgression {
  return {
    level: 1,
    xp: 0,
    xpToNext: xpThreshold(1),
    perkCounts: { vigor: 0, strength: 0, resilience: 0, prospector: 0, forager: 0 },
    pendingChoice: null,
  };
}

// Sube de nivel mientras haya XP suficiente y no haya una elección de perk
// pendiente — si el jugador tiene un level-up sin resolver, el XP extra
// queda "guardado" (no se pierde) pero no dispara otro level-up hasta que
// elija.
function tryLevelUp(progression: PlayerProgression): void {
  while (progression.pendingChoice === null && progression.xp >= progression.xpToNext) {
    progression.xp -= progression.xpToNext;
    progression.level += 1;
    progression.xpToNext = xpThreshold(progression.level);
    progression.pendingChoice = randomPerkChoices();
  }
}

export function grantXp(progression: PlayerProgression, amount: number): void {
  if (amount <= 0) return;
  progression.xp += amount;
  tryLevelUp(progression);
}

// Devuelve true si `kind` era una opción válida y se aplicó. Después de
// resolver, revisa si con el XP ya acumulado corresponde otro level-up
// inmediato (level-ups en cadena a partir de un XP grant grande).
export function choosePerk(progression: PlayerProgression, kind: PerkKind): boolean {
  if (!progression.pendingChoice || !progression.pendingChoice.includes(kind)) return false;

  progression.perkCounts[kind] = (progression.perkCounts[kind] ?? 0) + 1;
  progression.pendingChoice = null;
  tryLevelUp(progression);
  return true;
}

export function getVigorBonus(progression: PlayerProgression): number {
  return progression.perkCounts.vigor * VIGOR_HP_PER_STACK;
}

export function getStrengthBonus(progression: PlayerProgression): number {
  return progression.perkCounts.strength * STRENGTH_ATK_PER_STACK;
}

export function getResilienceBonus(progression: PlayerProgression): number {
  return progression.perkCounts.resilience * RESILIENCE_DEF_PER_STACK;
}

export function getProspectorMultiplier(progression: PlayerProgression): number {
  return 1 + progression.perkCounts.prospector * PROSPECTOR_LOOT_PER_STACK;
}

export function getForagerCooldownMultiplier(progression: PlayerProgression): number {
  return Math.max(FORAGER_COOLDOWN_FLOOR, 1 - progression.perkCounts.forager * FORAGER_COOLDOWN_PER_STACK);
}

// Texto corto del bono TOTAL acumulado para un perk (no el bono por stack
// que ya está en PERK_DEFS.description) — pensado para un resumen tipo
// "Vigor x2 — +8 HP máx." en el HUD.
export function formatPerkBonus(kind: PerkKind, progression: PlayerProgression): string {
  switch (kind) {
    case 'vigor':
      return `+${getVigorBonus(progression)} HP máx.`;
    case 'strength':
      return `+${getStrengthBonus(progression)} ataque`;
    case 'resilience':
      return `+${getResilienceBonus(progression)} defensa`;
    case 'prospector':
      return `+${Math.round((getProspectorMultiplier(progression) - 1) * 100)}% botín`;
    case 'forager':
      return `-${Math.round((1 - getForagerCooldownMultiplier(progression)) * 100)}% cooldown`;
  }
}
