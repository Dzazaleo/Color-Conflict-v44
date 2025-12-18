
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum ColorType {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  GRAY = 'GRAY',
  BROWN = 'BROWN',
  PURPLE = 'PURPLE',
  PINK = 'PINK',
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}

export enum RuleType {
  MATCH_COLOR = 'MATCH_COLOR',
  MATCH_WORD = 'MATCH_WORD',
}

export enum ObstacleType {
  STANDARD = 'STANDARD',
  CRATE = 'CRATE',
}

export enum PowerUpType {
  SPEED = 'SPEED',
  DRUNK = 'DRUNK',
  FOG = 'FOG',
  DYSLEXIA = 'DYSLEXIA',
  GPS = 'GPS',
  BLOCKER = 'BLOCKER',
  WILD = 'WILD',
  GLITCH = 'GLITCH',
  BLEACH = 'BLEACH',
  ALIAS = 'ALIAS',
  WARP = 'WARP',
  NONE = 'NONE',
}

export interface Rule {
  type: RuleType;
  targetColor: ColorType;
}

export interface ObstacleItem {
  displayColor: ColorType;
  wordText: ColorType;
  glitchText?: string; // Pre-calculated or memoized corrupted text
  isCorrect: boolean;
  effect?: PowerUpType; // For crates
  isHit?: boolean;      // For collision animation
}

export interface ObstacleRow {
  id: number;
  y: number; // Percentage down the screen (0-100)
  items: (ObstacleItem | null)[]; // Array of items (length 3 or 4)
  passed: boolean;
  rule: Rule;      // The rule associated with this specific obstacle
  setIndex: number; // 1 to totalInSet
  totalInSet: number; // The total number of checkpoints for this specific objective (e.g., 5 or 4)
  transitionZoneHeight?: number; // Height of the visual gap preceding this obstacle (if it starts a set)
  type: ObstacleType;
  isGuided?: boolean; // New flag for Practice Mode guidance
  active: boolean;    // For Object Pooling
}

export interface PlayerState {
  lane: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  speed: number;
}

export interface FloatingText {
  id: number;
  x: number; // Lane index
  y: number; // Screen %
  text: string;
  color: string;
}

export interface AppSettings {
  masterVol: number;
  bgmVol: number;
  sfxVol: number;
  visualFX: boolean;
  haptics: boolean;
  crateToggles: Record<PowerUpType, boolean>;
}

export type PracticeMode = 'NONE' | 'FOUR_LANES' | 'COLOR_ONLY' | 'WORD_ONLY' | 'SINGLE_CRATE';

export interface PracticeConfig {
    isActive: boolean;
    mode: PracticeMode;
    selectedCrate?: PowerUpType;
}