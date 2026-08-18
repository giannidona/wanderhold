import type { ActiveQuest, GameState, QuestKind, QuestStats } from '../types';
import { addResourceCapped } from './buildings';

interface QuestTemplate {
  kind: QuestKind;
  label: (amount: number) => string;
  targetRange: [number, number];
  reward: (amount: number) => { wood: number; stone: number; iron: number };
}

// Templates de quests: cada una define un rango de meta (se sortea un
// número dentro del rango al generarse) y una recompensa proporcional a
// esa meta, para que una quest más larga siempre pague más.
const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    kind: 'gather_wood',
    label: (n) => `Juntá ${n} de madera`,
    targetRange: [40, 90],
    reward: (n) => ({ wood: 0, stone: Math.round(n * 0.3), iron: 0 }),
  },
  {
    kind: 'gather_stone',
    label: (n) => `Juntá ${n} de piedra`,
    targetRange: [25, 60],
    reward: (n) => ({ wood: Math.round(n * 0.6), stone: 0, iron: 0 }),
  },
  {
    kind: 'gather_iron',
    label: (n) => `Juntá ${n} de hierro`,
    targetRange: [8, 20],
    reward: (n) => ({ wood: Math.round(n * 1.5), stone: Math.round(n * 1.5), iron: 0 }),
  },
  {
    kind: 'win_runs',
    label: (n) => (n === 1 ? 'Ganá 1 run de mazmorra' : `Ganá ${n} runs de mazmorra`),
    targetRange: [1, 3],
    reward: (n) => ({ wood: n * 15, stone: n * 15, iron: n * 2 }),
  },
  {
    kind: 'defeat_enemies',
    label: (n) => `Derrotá ${n} enemigos en la mazmorra`,
    targetRange: [5, 15],
    reward: (n) => ({ wood: Math.round(n * 2), stone: Math.round(n * 2), iron: 0 }),
  },
  {
    kind: 'build_any',
    label: (n) => (n === 1 ? 'Construí 1 edificio' : `Construí ${n} edificios`),
    targetRange: [1, 3],
    reward: (n) => ({ wood: n * 10, stone: n * 10, iron: n }),
  },
];

const ACTIVE_QUEST_COUNT = 3;

function statValue(stats: QuestStats, kind: QuestKind): number {
  switch (kind) {
    case 'gather_wood':
      return stats.lifetimeWood;
    case 'gather_stone':
      return stats.lifetimeStone;
    case 'gather_iron':
      return stats.lifetimeIron;
    case 'win_runs':
      return stats.dungeonWins;
    case 'defeat_enemies':
      return stats.enemiesDefeated;
    case 'build_any':
      return stats.buildingsBuilt;
  }
}

function randInt([min, max]: [number, number]): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

let questIdCounter = 0;

// Genera una quest nueva evitando (cuando sea posible) repetir un `kind`
// que ya esté activo en otra quest, así el tablero de 3 objetivos no
// termina siendo "juntá X" tres veces seguidas.
export function generateQuest(stats: QuestStats, avoidKinds: QuestKind[] = []): ActiveQuest {
  const pool = QUEST_TEMPLATES.filter((t) => !avoidKinds.includes(t.kind));
  const candidates = pool.length > 0 ? pool : QUEST_TEMPLATES;
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  const amount = randInt(template.targetRange);

  questIdCounter += 1;
  return {
    id: `quest-${questIdCounter}-${Date.now()}`,
    kind: template.kind,
    label: template.label(amount),
    targetAmount: amount,
    startValue: statValue(stats, template.kind),
    reward: template.reward(amount),
  };
}

export function initialQuests(stats: QuestStats): ActiveQuest[] {
  const quests: ActiveQuest[] = [];
  for (let i = 0; i < ACTIVE_QUEST_COUNT; i++) {
    quests.push(generateQuest(stats, quests.map((q) => q.kind)));
  }
  return quests;
}

// Progreso actual de una quest, clampeado a [0, targetAmount] para que la
// UI (barra de progreso) nunca se pase de 100%.
export function getQuestProgress(stats: QuestStats, quest: ActiveQuest): number {
  const current = statValue(stats, quest.kind) - quest.startValue;
  return Math.max(0, Math.min(current, quest.targetAmount));
}

export interface QuestCompletion {
  questId: string;
  label: string;
  // Monto realmente acreditado por recurso (puede ser menor a
  // quest.reward si el inventario ya estaba en el cap) — es lo que hay
  // que mostrarle al jugador, no la recompensa "nominal".
  gained: { wood: number; stone: number; iron: number };
}

// Revisa las quests activas cada frame; la(s) que llegaron a su meta
// entregan la recompensa (respetando el cap de inventario) y se
// reemplazan por una nueva al toque, así el jugador nunca se queda sin
// objetivo visible. Devuelve la lista de quests completadas en este tick
// (vacía si ninguna), para que el loop pueda mostrar un toast por cada una.
export function tickQuests(state: GameState): QuestCompletion[] {
  const completions: QuestCompletion[] = [];

  state.quests = state.quests.map((quest) => {
    const progress = statValue(state.stats, quest.kind) - quest.startValue;
    if (progress < quest.targetAmount) return quest;

    const gainedWood = addResourceCapped(state, 'wood', quest.reward.wood);
    const gainedStone = addResourceCapped(state, 'stone', quest.reward.stone);
    const gainedIron = addResourceCapped(state, 'iron', quest.reward.iron);

    completions.push({
      questId: quest.id,
      label: quest.label,
      gained: { wood: gainedWood, stone: gainedStone, iron: gainedIron },
    });

    const otherActiveKinds = state.quests.filter((q) => q.id !== quest.id).map((q) => q.kind);
    return generateQuest(state.stats, otherActiveKinds);
  });

  return completions;
}
