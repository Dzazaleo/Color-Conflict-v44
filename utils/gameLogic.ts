
import { ColorType, RuleType, Rule, ObstacleItem, ObstacleRow, ObstacleType, PowerUpType } from '../types';
import { ALL_COLORS } from '../constants';

// Helper to pick random item from array
const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Glitch Logic Helpers
export const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const getGlitchText = (text: string, seed: number) => {
    let chars = text.split('');
    const len = chars.length;
    if (len > 3) {
        const omissionCount = seededRandom(seed) > 0.5 ? 2 : 1;
        const startRemove = Math.floor(seededRandom(seed + 1) * (len - 2)) + 1;
        chars.splice(startRemove, Math.min(omissionCount, chars.length - startRemove - 1));
    }
    const subMap: Record<string, string> = { 'A': '4', 'B': '8', 'E': '3', 'G': '6', 'I': '1', 'O': '0', 'S': '5', 'T': '7', 'Z': '2' };
    chars = chars.map((c, i) => {
        if (subMap[c]) {
            return seededRandom(seed + i + 10) < 0.6 ? subMap[c] : c;
        }
        return c;
    });
    return chars.join('');
};

// Generate a random rule, optionally excluding a specific one to ensure variety
export const generateRule = (exclude?: Rule, forcedType?: RuleType): Rule => {
  let newRule: Rule;
  
  do {
    const type = forcedType ?? (Math.random() > 0.5 ? RuleType.MATCH_COLOR : RuleType.MATCH_WORD);
    const targetColor = randomPick(ALL_COLORS);
    newRule = { type, targetColor };
  } while (
    exclude && 
    newRule.type === exclude.type && 
    newRule.targetColor === exclude.targetColor
  );

  return newRule;
};

// --- OBJECT POOLING HELPERS ---

export const createEmptyItem = (): ObstacleItem => ({
    displayColor: ColorType.BLACK, 
    wordText: ColorType.BLACK,
    isCorrect: false,
    isEmpty: true,
    isHit: false
});

export const initializeRowItems = (count: number): ObstacleItem[] => {
    return Array.from({ length: count }, () => createEmptyItem());
};

// Hydrate a single item (mutates target)
const hydrateItem = (
  target: ObstacleItem,
  mustBeCorrect: boolean,
  rule: Rule,
  seed?: number
) => {
  target.isEmpty = false;
  target.isHit = false;
  target.isCorrect = mustBeCorrect;
  target.effect = undefined;

  let displayColor: ColorType;
  let wordText: ColorType;

  if (mustBeCorrect) {
    if (rule.type === RuleType.MATCH_COLOR) {
      displayColor = rule.targetColor;
      const mismatch = Math.random() < 0.7;
      wordText = mismatch 
        ? randomPick(ALL_COLORS.filter(c => c !== displayColor))
        : displayColor;
    } else {
      wordText = rule.targetColor;
      const mismatch = Math.random() < 0.7;
      displayColor = mismatch
        ? randomPick(ALL_COLORS.filter(c => c !== wordText))
        : wordText;
    }
  } else {
    if (rule.type === RuleType.MATCH_COLOR) {
      displayColor = randomPick(ALL_COLORS.filter(c => c !== rule.targetColor));
      const isTricky = Math.random() < 0.5;
      wordText = isTricky ? rule.targetColor : randomPick(ALL_COLORS);
    } else {
       wordText = randomPick(ALL_COLORS.filter(c => c !== rule.targetColor));
       const isTricky = Math.random() < 0.5;
       displayColor = isTricky ? rule.targetColor : randomPick(ALL_COLORS);
    }
  }

  target.displayColor = displayColor;
  target.wordText = wordText;
  
  if (seed !== undefined) {
      target.glitchText = getGlitchText(wordText, seed);
  } else {
      target.glitchText = undefined;
  }
};

export const hydrateRowItems = (
    targetItems: ObstacleItem[],
    rule: Rule,
    laneCount: number,
    rowId?: number
): void => {
    const correctLane = Math.floor(Math.random() * laneCount);
    
    for (let i = 0; i < targetItems.length; i++) {
        // Clear slots beyond active lanes
        if (i >= laneCount) {
            targetItems[i].isEmpty = true;
            targetItems[i].isHit = false;
            targetItems[i].effect = undefined;
            targetItems[i].glitchText = undefined;
            continue;
        }

        const seed = rowId !== undefined ? rowId + (i * 10) : undefined;
        hydrateItem(targetItems[i], i === correctLane, rule, seed);
    }
};

export const hydrateCrateItems = (
    targetItems: ObstacleItem[],
    rule: Rule,
    laneCount: number,
    disabledPowerUps: PowerUpType[]
): void => {
    const emptyLane = Math.floor(Math.random() * laneCount);
    
    let allEffects = [
        PowerUpType.SPEED, 
        PowerUpType.DRUNK, 
        PowerUpType.FOG, 
        PowerUpType.DYSLEXIA, 
        PowerUpType.GPS, 
        PowerUpType.BLOCKER,
        PowerUpType.WILD,
        PowerUpType.WARP
    ];

    if (rule.type === RuleType.MATCH_WORD) {
        allEffects.push(PowerUpType.GLITCH);
    }

    if (rule.type === RuleType.MATCH_COLOR) {
        allEffects.push(PowerUpType.BLEACH);
        allEffects.push(PowerUpType.ALIAS);
    }

    if (disabledPowerUps.length > 0) {
        allEffects = allEffects.filter(eff => !disabledPowerUps.includes(eff));
    }

    let effectsToUse: PowerUpType[] = [];
    if (allEffects.length > 0) {
        // Fisher-Yates shuffle
        for (let i = allEffects.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allEffects[i], allEffects[j]] = [allEffects[j], allEffects[i]];
        }
        const slotsToFill = Math.max(0, laneCount - 1);
        effectsToUse = allEffects.slice(0, Math.min(slotsToFill, allEffects.length));
    }

    let effectIdx = 0;

    for (let i = 0; i < targetItems.length; i++) {
        // Cleanup old state
        targetItems[i].isHit = false;
        targetItems[i].glitchText = undefined;
        targetItems[i].displayColor = ColorType.GRAY; // Reset visual defaults
        targetItems[i].wordText = ColorType.GRAY;

        if (i >= laneCount) {
            targetItems[i].isEmpty = true;
            targetItems[i].effect = undefined;
            continue;
        }

        if (i === emptyLane) {
            targetItems[i].isEmpty = true;
            targetItems[i].effect = undefined;
        } else {
            if (effectIdx < effectsToUse.length) {
                targetItems[i].isEmpty = false;
                targetItems[i].isCorrect = true;
                targetItems[i].effect = effectsToUse[effectIdx];
                effectIdx++;
            } else {
                targetItems[i].isEmpty = true;
                targetItems[i].effect = undefined;
            }
        }
    }
};

export const resetObstacleRow = (
    target: ObstacleRow,
    id: number,
    rule: Rule,
    setIndex: number,
    transitionZoneHeight: number = 0,
    totalInSet: number = 5,
    laneCount: number = 3
): void => {
    target.id = id;
    target.rule = rule;
    target.setIndex = setIndex;
    target.transitionZoneHeight = transitionZoneHeight;
    target.totalInSet = totalInSet;
    target.passed = false;
    target.y = -20;
    target.type = ObstacleType.STANDARD;
    target.active = true;
    
    // Deep hydration
    hydrateRowItems(target.items, rule, laneCount, id);
};

export const resetCrateRow = (
    target: ObstacleRow,
    id: number,
    rule: Rule,
    laneCount: number = 3,
    disabledPowerUps: PowerUpType[] = []
): void => {
    target.id = id;
    target.rule = rule;
    target.passed = false;
    target.y = -20;
    target.setIndex = 0;
    target.totalInSet = 0;
    target.transitionZoneHeight = 0;
    target.type = ObstacleType.CRATE;
    target.active = true;

    // Deep hydration
    hydrateCrateItems(target.items, rule, laneCount, disabledPowerUps);
};

// Deprecated factory functions (updated to use pool logic pattern if still used, though likely replaced by pool init)
export const generateObstacleRow = (
  id: number, 
  rule: Rule, 
  setIndex: number,
  transitionZoneHeight: number = 0,
  totalInSet: number = 5,
  laneCount: number = 3
): ObstacleRow => {
  const items = initializeRowItems(4); // Max 4
  hydrateRowItems(items, rule, laneCount, id);

  return {
    id,
    y: -20, 
    items,
    passed: false,
    rule,
    setIndex,
    totalInSet,
    transitionZoneHeight,
    type: ObstacleType.STANDARD,
    active: true
  };
};

export const generateCrateRow = (
    id: number,
    rule: Rule,
    laneCount: number = 3,
    disabledPowerUps: PowerUpType[] = []
): ObstacleRow => {
    const items = initializeRowItems(4);
    hydrateCrateItems(items, rule, laneCount, disabledPowerUps);

    return {
        id,
        y: -20,
        items,
        passed: false,
        rule,
        setIndex: 0,
        totalInSet: 0,
        transitionZoneHeight: 0,
        type: ObstacleType.CRATE,
        active: true
    };
}
