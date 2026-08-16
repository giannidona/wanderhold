export type Direction = 'up' | 'down' | 'left' | 'right';

export type ResourceKind = 'wood' | 'stone';

export interface ResourceNode {
  id: string;
  kind: ResourceKind;
  x: number;
  y: number;
  hitsRemaining: number;
  maxHits: number;
}

export type BuildingKind = 'workshop' | 'hut';

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

export interface CombatStats {
  maxHp: number;
  attack: number;
}

export interface PlayerState {
  x: number;
  y: number;
  facing: Direction;
  tools: Tools;
  combat: CombatStats;
}

export interface Inventory {
  wood: number;
  stone: number;
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
