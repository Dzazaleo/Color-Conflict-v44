import { ColorType, RuleType, PowerUpType } from './types';

// Visual Mapping
export const COLOR_MAP: Record<ColorType, string> = {
  [ColorType.RED]: '#ef4444', // red-500
  [ColorType.BLUE]: '#3b82f6', // blue-500
  [ColorType.GREEN]: '#22c55e', // green-500
  [ColorType.YELLOW]: '#eab308', // yellow-500
  [ColorType.GRAY]: '#6b7280', // gray-500 (Updated from 400 to match obstacle bg)
  [ColorType.BROWN]: '#92400e', // amber-800
  [ColorType.PURPLE]: '#a855f7', // purple-500
  [ColorType.PINK]: '#ec4899', // pink-500
  [ColorType.BLACK]: '#020617', // slate-950 (Updated from #000000 to match obstacle bg)
  [ColorType.WHITE]: '#ffffff',
};

export const TEXT_COLOR_CLASS_MAP: Record<ColorType, string> = {
    [ColorType.RED]: 'text-red-500',
    [ColorType.BLUE]: 'text-blue-500',
    [ColorType.GREEN]: 'text-green-500',
    [ColorType.YELLOW]: 'text-yellow-500',
    [ColorType.GRAY]: 'text-gray-400',
    [ColorType.BROWN]: 'text-amber-800',
    [ColorType.PURPLE]: 'text-purple-500',
    [ColorType.PINK]: 'text-pink-500',
    [ColorType.BLACK]: 'text-black',
    [ColorType.WHITE]: 'text-white',
};

export const BG_COLOR_CLASS_MAP: Record<ColorType, string> = {
    [ColorType.RED]: 'bg-red-500',
    [ColorType.BLUE]: 'bg-blue-500',
    [ColorType.GREEN]: 'bg-green-500',
    [ColorType.YELLOW]: 'bg-yellow-500',
    [ColorType.GRAY]: 'bg-gray-500',
    [ColorType.BROWN]: 'bg-amber-800',
    [ColorType.PURPLE]: 'bg-purple-500',
    [ColorType.PINK]: 'bg-pink-500',
    [ColorType.BLACK]: 'bg-slate-950',
    [ColorType.WHITE]: 'bg-white',
};

export const COLOR_ALIAS_MAP: Record<ColorType, string[]> = {
    [ColorType.RED]: ['BLOOD', 'TOMATO', 'LIPS'],
    [ColorType.BLUE]: ['SKY', 'OCEAN', 'JEANS'],
    [ColorType.GREEN]: ['LEAF', 'GRASS', 'FROG'],
    [ColorType.YELLOW]: ['SUN', 'LEMON', 'BANANA'],
    [ColorType.BROWN]: ['WOOD', 'COFFEE', 'DIRT'],
    [ColorType.PURPLE]: ['GRAPE', 'PLUM', 'EGGPLANT'],
    [ColorType.PINK]: ['FLAMINGO', 'GUM', 'PIG'],
    [ColorType.BLACK]: ['NIGHT', 'COAL', 'INK'],
    [ColorType.WHITE]: ['SNOW', 'MILK', 'CLOUD'],
    [ColorType.GRAY]: ['ASH', 'SMOKE', 'STEEL'],
};

export const CRATE_METADATA: Record<PowerUpType, { label: string; description: string; score: number; tutorial?: string[] }> = {
    [PowerUpType.WILD]: { 
        label: 'WILD', 
        description: 'Activates 2 random effects simultaneously. Stacks score rewards.', 
        score: 10,
        tutorial: [
            "Grants TWO random effects at once.",
            "Score multipliers stack.",
            "Prepare for immediate chaos!"
        ]
    },
    [PowerUpType.WARP]: { 
        label: 'WARP', 
        description: 'Initiates a time-loop challenge. Complete the track forward, then survive the REVERSE.', 
        score: 5,
        tutorial: [
            "Complete the forward track segment.",
            "The track will STOP and REVERSE.",
            "Navigate backward to close the loop!"
        ]
    },
    [PowerUpType.DYSLEXIA]: { 
        label: 'SWAP', 
        description: 'Reverses your Left and Right steering controls.', 
        score: 5,
        tutorial: [
            "Your steering is REVERSED.",
            "Tap LEFT to go RIGHT.",
            "Tap RIGHT to go LEFT."
        ]
    },
    [PowerUpType.GLITCH]: { 
        label: 'GLITCH', 
        description: 'Corrupts and scrambles text on checkpoints. (Word Mode only)', 
        score: 4,
        tutorial: [
            "Checkpoint text becomes corrupted.",
            "Read carefully through the static.",
            "Identify the hidden word logic."
        ]
    },
    [PowerUpType.SPEED]: { 
        label: 'SPEED', 
        description: 'Temporarily increases game speed significantly.', 
        score: 3,
        tutorial: [
            "Velocity increases drastically.",
            "Reflexes must be sharp.",
            "Survive the surge for bonus points."
        ]
    },
    [PowerUpType.BLOCKER]: { 
        label: 'BLOCK', 
        description: 'Spawns construction barriers that hide items. They are destructible.', 
        score: 3,
        tutorial: [
            "Construction barriers appear.",
            "Items are hidden behind them.",
            "Crash through if target is hidden."
        ]
    },
    [PowerUpType.BLEACH]: { 
        label: 'BLEACH', 
        description: 'Washes out colors with a strong white overlay. (Color Mode only)', 
        score: 3,
        tutorial: [
            "Colors are washed out.",
            "Distinguish faint hues.",
            "Don't let the brightness fool you."
        ]
    },
    [PowerUpType.ALIAS]: { 
        label: 'ALIAS', 
        description: 'Replaces color names with object names (e.g., Red -> Blood). (Color Mode only)', 
        score: 3,
        tutorial: [
            "Color names are replaced by objects.",
            "Example: 'BLOOD' means RED.",
            "Match the object's color!"
        ]
    },
    [PowerUpType.DRUNK]: { 
        label: 'DRUNK', 
        description: 'Distorts vision and causes the screen to sway unpredictably.', 
        score: 2,
        tutorial: [
            "Vision becomes distorted.",
            "The screen sways and blurs.",
            "Maintain focus despite the dizziness."
        ]
    },
    [PowerUpType.FOG]: { 
        label: 'STORM', 
        description: 'Obscures the track with heavy rain and fog layers.', 
        score: 2,
        tutorial: [
            "Visibility drops near zero.",
            "Heavy rain obscures upcoming items.",
            "Look closely for shapes in the fog."
        ]
    },
    [PowerUpType.GPS]: { 
        label: 'GPS', 
        description: 'Highlights the correct lane for upcoming checkpoints.', 
        score: 1,
        tutorial: [
            "The correct lane is highlighted.",
            "Follow the navigation markers.",
            "Easy points, but stay alert!"
        ]
    },
    [PowerUpType.NONE]: { 
        label: 'NONE', 
        description: '', 
        score: 0 
    },
};

// Game Balance
export const INITIAL_SPEED = 0.4025; // Vertical % per frame (increased by 15% from 0.35)
export const MAX_SPEED = 2.0;
export const SPEED_INCREMENT = 0.04;
export const OBSTACLES_PER_SET = 5;

// Spacing
export const MIN_OBSTACLE_DISTANCE = 25; // Closer minimum for reflex checks
export const MAX_OBSTACLE_DISTANCE = 60; // Larger maximum for breather moments

export const PLAYER_Y_POS = 85; // Player is at 85% down the screen
export const HITBOX_THRESHOLD = 5; // +/- % for collision
export const LANE_COUNT = 3;

export const ALL_COLORS = [
    ColorType.RED, 
    ColorType.BLUE, 
    ColorType.GREEN, 
    ColorType.YELLOW,
    ColorType.GRAY, 
    ColorType.BROWN,
    ColorType.PURPLE,
    ColorType.PINK,
    ColorType.BLACK,
    ColorType.WHITE
];

// Dynamic Track Themes mapped to RuleType
export const TRACK_THEMES: Record<RuleType, { id: string; bg: string; laneBorder: string; ambient: string }> = {
    [RuleType.MATCH_COLOR]: { // Theme A: Dark Blue / Magenta (Classic Synth)
      id: 'neon-night',
      bg: 'bg-slate-900',
      laneBorder: 'border-fuchsia-500/30',
      ambient: 'shadow-[inset_0_0_100px_rgba(168,85,247,0.15)]' // Magenta glow
    },
    [RuleType.MATCH_WORD]: { // Theme B: Dark Muted Orange / Amber (Warning State)
      id: 'amber-grid',
      bg: 'bg-[#1a0b06]', // Very dark, muted burnt orange
      laneBorder: 'border-orange-900/20',
      ambient: 'shadow-[inset_0_0_100px_rgba(124,45,18,0.3)]' // Deep dark orange glow
    }
};