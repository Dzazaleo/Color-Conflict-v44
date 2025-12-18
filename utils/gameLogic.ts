
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

// Generate a single Stroop item (circle with text)
const generateItem = (
  mustBeCorrect: boolean,
  rule: Rule,
  seed?: number
): ObstacleItem => {
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

  const item: ObstacleItem = { displayColor, wordText, isCorrect: mustBeCorrect };
  
  // Pre-calculate glitch text if seed is provided
  if (seed !== undefined) {
      item.glitchText = getGlitchText(wordText, seed);
  }

  return item;
};

export const regenerateRowItems = (
    rule: Rule,
    laneCount: number,
    rowId?: number
): ObstacleItem[] => {
    const correctLane = Math.floor(Math.random() * laneCount);
    const items: ObstacleItem[] = [];
    for (let i = 0; i < laneCount; i++) {
        const seed = rowId !== undefined ? rowId + (i * 10) : undefined;
        items.push(generateItem(i === correctLane, rule, seed));
    }
    return items;
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
    target.items = regenerateRowItems(rule, laneCount, id);
    target.passed = false;
    target.y = -20;
    target.type = ObstacleType.STANDARD;
    target.active = true;
};

export const resetCrateRow = (
    target: ObstacleRow,
    id: number,
    rule: Rule,
    laneCount: number = 3,
    disabledPowerUps: PowerUpType[] = []
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

    const items: (ObstacleItem | null)[] = Array(laneCount).fill(null);

    if (allEffects.length > 0) {
        for (let i = allEffects.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allEffects[i], allEffects[j]] = [allEffects[j], allEffects[i]];
        }

        const slotsToFill = Math.max(0, laneCount - 1);
        const effectsToUse = allEffects.slice(0, Math.min(slotsToFill, allEffects.length));
        let effectIdx = 0;

        for (let i = 0; i < laneCount; i++) {
            if (i !== emptyLane && effectIdx < effectsToUse.length) {
                items[i] = {
                    displayColor: ColorType.GRAY,
                    wordText: ColorType.GRAY,
                    isCorrect: true,
                    effect: effectsToUse[effectIdx]
                };
                effectIdx++;
            }
        }
    }

    target.id = id;
    target.rule = rule;
    target.items = items;
    target.passed = false;
    target.y = -20;
    target.setIndex = 0;
    target.totalInSet = 0;
    target.transitionZoneHeight = 0;
    target.type = ObstacleType.CRATE;
    target.active = true;
};

export const generateObstacleRow = (
  id: number, 
  rule: Rule, 
  setIndex: number,
  transitionZoneHeight: number = 0,
  totalInSet: number = 5,
  laneCount: number = 3
): ObstacleRow => {
  const items: (ObstacleItem | null)[] = regenerateRowItems(rule, laneCount, id);

  return {
    id,
    y: -20, 
    items: items,
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

    if (allEffects.length === 0) {
         return {
            id,
            y: -20,
            items: Array(laneCount).fill(null),
            passed: false,
            rule,
            setIndex: 0,
            totalInSet: 0,
            transitionZoneHeight: 0,
            type: ObstacleType.CRATE,
            active: true
        };
    }

    for (let i = allEffects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allEffects[i], allEffects[j]] = [allEffects[j], allEffects[i]];
    }

    const slotsToFill = Math.max(0, laneCount - 1);
    const effectsToUse = allEffects.slice(0, Math.min(slotsToFill, allEffects.length));
    const items: (ObstacleItem | null)[] = Array(laneCount).fill(null);
    let effectIdx = 0;

    for (let i = 0; i < laneCount; i++) {
        if (i === emptyLane) {
            items[i] = null;
        } else {
            if (effectIdx < effectsToUse.length) {
                items[i] = {
                    displayColor: ColorType.GRAY,
                    wordText: ColorType.GRAY,
                    isCorrect: true,
                    effect: effectsToUse[effectIdx]
                };
                effectIdx++;
            } else {
                items[i] = null;
            }
        }
    }

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
