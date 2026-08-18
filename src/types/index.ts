export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Vector2 {
  x: number;
  y: number;
}

export type ResourceKind = 'wood' | 'stone' | 'iron';

export interface ResourceNode {
  id: string;
  kind: ResourceKind;
  x: number;
  y: number;
  hitsRemaining: number;
  maxHits: number;
  respawnAt: number | null;
}

export type BuildingKind = 'workshop' | 'hut' | 'forge' | 'storage';

export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
}

export interface Tools {
  axeLevel: number;
  pickaxeLevel: number;
}

export type ArmorSlotKind = 'head' | 'chest' | 'boots';

export interface Armor {
  head: number;
  chest: number;
  boots: number;
}

export interface CombatStats {
  maxHp: number;
  attack: number;
}

export interface PlayerState {
  px: number;
  py: number;
  facing: Vector2;
  // Última dirección horizontal en la que se movió (1 = derecha, -1 =
  // izquierda). Se usa para espejar el sprite al dibujar; a diferencia de
  // `facing`, no se resetea al moverse solo en vertical, así el personaje
  // no "olvida" hacia qué lado estaba mirando.
  facingDir: 1 | -1;
  tools: Tools;
  armor: Armor;
  combat: CombatStats;
}

export interface Inventory {
  wood: number;
  stone: number;
  iron: number;
}

export interface VillageState {
  gridSize: number;
  resourceNodes: ResourceNode[];
  buildings: Building[];
}

export type Scene = 'village' | 'dungeon';

export type EnemyKind = 'slime' | 'bandit' | 'wolf';

export interface DungeonEnemyInstance {
  kind: EnemyKind;
  label: string;
  maxHp: number;
  hp: number;
  attack: number;
  // Jefe de profundidad: aparece como último enemigo de la run cada
  // BOSS_INTERVAL niveles (ver dungeon/enemies.ts). Stats y loot muy por
  // encima del escalado normal — es el hito claro de "hasta acá llegué".
  isBoss: boolean;
}

export interface CombatLogEntry {
  id: number;
  text: string;
}

export type DungeonOutcome = 'victory' | 'defeat';

export interface DungeonRunState {
  enemies: DungeonEnemyInstance[];
  currentEnemyIndex: number;
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;
  playerDefense: number;
  lootWood: number;
  lootStone: number;
  log: CombatLogEntry[];
  outcome: DungeonOutcome | null;
  // Profundidad global al momento de entrar a esta run (snapshot de
  // GameState.dungeonDepth) — determina el escalado de HP/ataque de los
  // enemigos y del botín de esta run específica.
  depth: number;
}

export interface TilePos {
  x: number;
  y: number;
}

// Contadores acumulados de por vida (nunca bajan), usados para medir el
// progreso de las quests y, a futuro, para una pantalla de estadísticas.
// `lifetimeWood/Stone/Iron` suman el monto "intentado" de cada ganancia de
// recurso (gathering manual, ingreso pasivo, botín de mazmorra) ANTES de
// aplicar el cap de inventario, así una quest de recolección nunca se
// traba solo porque el inventario esté lleno.
export interface QuestStats {
  lifetimeWood: number;
  lifetimeStone: number;
  lifetimeIron: number;
  dungeonWins: number;
  enemiesDefeated: number;
  buildingsBuilt: number;
}

export type QuestKind = 'gather_wood' | 'gather_stone' | 'gather_iron' | 'win_runs' | 'defeat_enemies' | 'build_any';

export interface ActiveQuest {
  id: string;
  kind: QuestKind;
  label: string;
  targetAmount: number;
  // Valor de la estadística correspondiente (ver QuestStats) al momento en
  // que se generó esta quest — el progreso real es
  // stat_actual - startValue, así una quest nueva no se completa sola con
  // progreso acumulado de antes de existir.
  startValue: number;
  reward: { wood: number; stone: number; iron: number };
}

export interface GameState {
  scene: Scene;
  player: PlayerState;
  inventory: Inventory;
  village: VillageState;
  dungeon: DungeonRunState | null;
  pendingBuildTile: TilePos | null;
  // Cuántas runs de mazmorra ganaste en total — escala la dificultad y el
  // botín de la mazmorra (más profundo = más duro y más rentable).
  dungeonDepth: number;
  // Marca de tiempo (mismo reloj que engine/loop.ts) del último tick de
  // ingreso pasivo por población (ver state/population.ts).
  lastPassiveTickAt: number;
  stats: QuestStats;
  // Objetivos activos (ver state/quests.ts) — al completarse uno se
  // reemplaza automáticamente por uno nuevo, así siempre hay una meta
  // concreta visible en el HUD de aldea.
  quests: ActiveQuest[];
}
