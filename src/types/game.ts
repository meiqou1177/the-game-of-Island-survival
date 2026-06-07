// ===== 基础类型 =====
export interface Position {
  x: number;
  y: number;
}

// ===== 地图相关 =====
export type TileType = 
  | 'ground'
  | 'wall'
  | 'tree'
  | 'rock'
  | 'water'
  | 'water_source'
  | 'food'
  | 'vine'
  | 'ammo_box'
  | 'medkit_box'
  | 'material_box';

export interface MapTile {
  type: TileType;
  x: number;
  y: number;
  variant: number;
}

export type MapType = 'beach' | 'jungle' | 'swamp' | 'cliff' | 'valley';

export interface MapCreature {
  id: string;
  type: 'dog';
  name: string;
  nameZh: string;
  position: Position;
  captured: boolean;
  damage: number;
  pursuitDamage: number;
}

export interface Chest {
  id: string;
  position: Position;
  opened: boolean;
  items: Item[];
}

export interface MapRegion {
  type: MapType;
  name: string;
  nameZh: string;
  width: number;
  height: number;
  tiles: MapTile[][];
  squads: EnemySquad[];
  chests: Chest[];
  creatures: MapCreature[];
  unlocked: boolean;
  cleared: boolean;
  exitPosition: Position;
  visionRange?: number;
  hungerDrainMult?: number;
  canDodge?: boolean;
  hasFlightEnemy?: boolean;
}

// ===== 物品相关 =====
export type ItemType = 'food' | 'water' | 'ammo' | 'medicine' | 'material' | 'weapon' | 'armor';

export interface Item {
  id: string;
  name: string;
  nameZh: string;
  quantity: number;
  type: ItemType;
  description?: string;
  damage?: number;
  defense?: number;
  craftRecipe?: CraftRecipe;
}

export interface CraftRecipe {
  id: string;
  name: string;
  nameZh: string;
  ingredients: { itemId: string; quantity: number }[];
  result: Item;
}

// ===== 玩家相关 =====
export interface Weapon {
  id: string;
  name: string;
  nameZh: string;
  damage: number;
  damageType: 'physical' | 'magic';
  ammoType?: string;
  ammoCount?: number;
  maxAmmo?: number;
}

export interface Armor {
  id: string;
  name: string;
  nameZh: string;
  defense: number;
  durability?: number;
  maxDurability?: number;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  hp: number;
  maxHp: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  position: Position;
  weapon: Weapon | null;
  armor: Armor | null;
  inventory: Item[];
  maxInventory: number;
  dodge?: boolean;
  dodgeCounter?: number;
  score: number;
}

// ===== 敌人相关 =====
export interface Enemy {
  id: string;
  type: 'sand' | 'wood' | 'stone' | 'fly' | 'boss';
  name: string;
  nameZh: string;
  hp: number;
  maxHp: number;
  damage: number;
  damageType: 'physical' | 'magic';
  sprite: string;
  canMove: boolean;
  hasDoubleDamage?: boolean;
  doubleDamageChance?: number;
  hasDodge?: boolean;
  dodgeChance?: number;
  hasSummon?: boolean;
  summonChance?: number;
  hasHeal?: boolean;
  healChance?: number;
  healAmount?: number;
  skillCooldown?: number;
}

export interface EnemySquad {
  id: string;
  mapType: MapType;
  enemies: Enemy[];
  defeated: boolean;
  position: Position;
}

export type EnemySkillResult = 
  | { type: 'double_damage' }
  | { type: 'dodge' }
  | { type: 'summon' }
  | { type: 'heal'; amount: number }
  | null;

// ===== 战斗相关 =====
export interface Combat {
  squad: EnemySquad;
  round: number;
  playerTurn: boolean;
  enemies: Enemy[];
  battleLog: string[];
  dodgeActive: boolean;
}

export interface CombatAction {
  type: 'answer' | 'switch_weapon' | 'use_item' | 'dodge' | 'escape';
  data?: any;
}

// ===== 问题系统 =====
export interface Question {
  id: string;
  text: string;
  answer: string;
  options: string[];
  difficulty: 'easy' | 'normal' | 'hard';
  subject: string;
}

// ===== 排行榜 =====
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  difficulty: 'easy' | 'normal' | 'hard';
  mapReached: string;
  timestamp: number;
}

// ===== 游戏状态 =====
export type GameScreen = 
  | 'main_menu'
  | 'difficulty_select'
  | 'subject_select'
  | 'exploration'
  | 'combat'
  | 'inventory'
  | 'game_over'
  | 'victory'
  | 'leaderboard';

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  volume: number;
  quality: 'low' | 'medium' | 'high';
}

export interface GameState {
  screen: GameScreen;
  player: Player;
  currentMap: MapRegion | null;
  maps: MapRegion[];
  combat: Combat | null;
  pet: MapCreature | null;
  logs: string[];
  isPaused: boolean;
  weather: 'sunny' | 'cloudy' | 'rainy';
  settings: GameSettings;
  leaderboard: LeaderboardEntry[];
  currentQuestion: Question | null;
}
