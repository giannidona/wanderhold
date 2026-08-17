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

export type BuildingKind = 'workshop' | 'hut' | 'forge';

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
}

export interface TilePos {
  x: number;
  y: number;
}

export interface GameState {
  scene: Scene;
  player: PlayerState;
  inventory: Inventory;
  village: VillageState;
  dungeon: DungeonRunState | null;
  pendingBuildTile: TilePos | null;
}
