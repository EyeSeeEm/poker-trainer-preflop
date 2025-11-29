import { generateAllHands } from './handGeneration';
import { getCorrectAction } from './rangeLogic';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

// Difficulty settings - controls which hands are shown based on distance from boundary
// Easy: all hands including obvious ones
// Medium: hands within distance 5 of boundary (moderately close)
// Hard: hands within distance 2 of boundary (very close, borderline decisions)
const DIFFICULTY_SETTINGS = {
  easy: { maxDistance: Infinity, includeObvious: true },
  medium: { maxDistance: 5, includeObvious: false },
  hard: { maxDistance: 2, includeObvious: false }
};

// Obvious hands that are always in range for specific actions - not interesting to test
const OBVIOUS_OPEN_HANDS = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'
]);

const OBVIOUS_3BET_HANDS = new Set([
  'AA', 'KK', 'QQ', 'AKs', 'AKo'
]);

const OBVIOUS_4BET_HANDS = new Set([
  'AA', 'KK', 'AKs', 'AKo'
]);

const OBVIOUS_5BET_HANDS = new Set([
  'AA', 'KK'
]);

// Get the obvious hands set for a given category
function getObviousHands(category) {
  switch (category) {
    case 'open_ranges':
      return OBVIOUS_OPEN_HANDS;
    case 'vs_open_ranges':
      return OBVIOUS_3BET_HANDS;
    case 'vs_3bet_ranges':
    case 'cold_4bet_ranges':
      return OBVIOUS_4BET_HANDS;
    case 'vs_4bet_ranges':
      return OBVIOUS_5BET_HANDS;
    default:
      return new Set();
  }
}

// Parse a hand string into components
function parseHand(hand) {
  if (hand.length === 2) {
    return { rank1: hand[0], rank2: hand[1], type: 'pair' };
  }
  return {
    rank1: hand[0],
    rank2: hand[1],
    type: hand[2] === 's' ? 'suited' : 'offsuit'
  };
}

// Get the "distance" between two hands (lower = more similar)
function handDistance(hand1, hand2) {
  const h1 = parseHand(hand1);
  const h2 = parseHand(hand2);

  // Different hand types are further apart
  if (h1.type !== h2.type) {
    // Suited vs offsuit of same ranks is close
    if (h1.rank1 === h2.rank1 && h1.rank2 === h2.rank2) {
      return 1;
    }
    return 10;
  }

  // Same type hands
  const r1v1 = RANK_VALUES[h1.rank1];
  const r1v2 = RANK_VALUES[h1.rank2];
  const r2v1 = RANK_VALUES[h2.rank1];
  const r2v2 = RANK_VALUES[h2.rank2];

  // For pairs, just compare the rank difference
  if (h1.type === 'pair') {
    return Math.abs(r1v1 - r2v1);
  }

  // For non-pairs, compare both ranks
  return Math.abs(r1v1 - r2v1) + Math.abs(r1v2 - r2v2);
}

// Find hands that are close to the range boundary (good fold hands)
function findBoundaryFoldHands(category, scenario, allHands) {
  const inRangeHands = [];
  const foldHands = [];

  allHands.forEach(hand => {
    const result = getCorrectAction(hand, category, scenario);
    if (result.action === 'Fold') {
      foldHands.push(hand);
    } else {
      inRangeHands.push(hand);
    }
  });

  // If no fold hands or no range hands, return all fold hands
  if (foldHands.length === 0 || inRangeHands.length === 0) {
    return foldHands;
  }

  // Score each fold hand by its minimum distance to any in-range hand
  const scoredFoldHands = foldHands.map(foldHand => {
    let minDistance = Infinity;
    inRangeHands.forEach(rangeHand => {
      const dist = handDistance(foldHand, rangeHand);
      if (dist < minDistance) {
        minDistance = dist;
      }
    });
    return { hand: foldHand, distance: minDistance };
  });

  // Sort by distance (closest first) and take the hands within distance 3
  scoredFoldHands.sort((a, b) => a.distance - b.distance);

  // Return hands that are close to the boundary (distance <= 3)
  // This includes:
  // - Same hand different suit type (distance 1)
  // - One rank different in one position (distance 1)
  // - Two ranks different total (distance 2)
  // - Three ranks different (distance 3)
  const boundaryHands = scoredFoldHands
    .filter(h => h.distance <= 3)
    .map(h => h.hand);

  // If we don't have enough boundary hands, include some more
  if (boundaryHands.length < 20) {
    const additionalHands = scoredFoldHands
      .filter(h => h.distance > 3 && h.distance <= 5)
      .map(h => h.hand);
    return [...boundaryHands, ...additionalHands];
  }

  return boundaryHands;
}

// Find hands that are near the range boundary (interesting raise/call hands)
function findBoundaryInRangeHands(category, scenario, allHands) {
  const inRangeHands = [];
  const foldHands = [];
  const obviousHands = getObviousHands(category);

  allHands.forEach(hand => {
    const result = getCorrectAction(hand, category, scenario);
    if (result.action === 'Fold') {
      foldHands.push(hand);
    } else {
      inRangeHands.push(hand);
    }
  });

  // If no fold hands, all in-range hands are equally valid
  if (foldHands.length === 0) {
    return inRangeHands.filter(h => !obviousHands.has(h));
  }

  // Score each in-range hand by its minimum distance to any fold hand
  const scoredHands = inRangeHands.map(rangeHand => {
    // Skip obvious hands
    if (obviousHands.has(rangeHand)) {
      return { hand: rangeHand, distance: Infinity, isObvious: true };
    }

    let minDistance = Infinity;
    foldHands.forEach(foldHand => {
      const dist = handDistance(rangeHand, foldHand);
      if (dist < minDistance) {
        minDistance = dist;
      }
    });
    return { hand: rangeHand, distance: minDistance, isObvious: false };
  });

  // Sort by distance (closest to boundary first)
  scoredHands.sort((a, b) => a.distance - b.distance);

  // Return non-obvious hands within distance 4 of fold hands (boundary hands)
  const boundaryHands = scoredHands
    .filter(h => !h.isObvious && h.distance <= 4)
    .map(h => h.hand);

  // If not enough boundary hands, include more
  if (boundaryHands.length < 15) {
    const additionalHands = scoredHands
      .filter(h => !h.isObvious && h.distance > 4)
      .map(h => h.hand);
    return [...boundaryHands, ...additionalHands];
  }

  return boundaryHands;
}

// Score all hands by their distance to the boundary
function scoreAllHands(category, scenario, allHands) {
  const inRangeHands = [];
  const foldHands = [];
  const obviousHands = getObviousHands(category);

  allHands.forEach(hand => {
    const result = getCorrectAction(hand, category, scenario);
    if (result.action === 'Fold') {
      foldHands.push(hand);
    } else {
      inRangeHands.push(hand);
    }
  });

  const scoredHands = [];

  // Score in-range hands by distance to nearest fold hand
  inRangeHands.forEach(hand => {
    const isObvious = obviousHands.has(hand);
    let minDistance = Infinity;

    if (foldHands.length > 0) {
      foldHands.forEach(foldHand => {
        const dist = handDistance(hand, foldHand);
        if (dist < minDistance) minDistance = dist;
      });
    }

    scoredHands.push({
      hand,
      action: getCorrectAction(hand, category, scenario).action,
      distance: minDistance,
      isObvious,
      isFold: false
    });
  });

  // Score fold hands by distance to nearest in-range hand
  foldHands.forEach(hand => {
    let minDistance = Infinity;

    if (inRangeHands.length > 0) {
      inRangeHands.forEach(rangeHand => {
        const dist = handDistance(hand, rangeHand);
        if (dist < minDistance) minDistance = dist;
      });
    }

    scoredHands.push({
      hand,
      action: 'Fold',
      distance: minDistance,
      isObvious: false,
      isFold: true
    });
  });

  return scoredHands;
}

// Get a smart random hand for a scenario based on difficulty
// difficulty: 'easy' | 'medium' | 'hard'
export function getSmartRandomHand(category, scenario, difficulty = 'medium') {
  const allHands = generateAllHands();
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.medium;

  // Score all hands by their distance to the boundary
  const scoredHands = scoreAllHands(category, scenario, allHands);

  // Filter hands based on difficulty settings
  let eligibleHands = scoredHands.filter(h => {
    // Check distance constraint
    if (h.distance > settings.maxDistance) return false;

    // Check obvious constraint
    if (!settings.includeObvious && h.isObvious) return false;

    return true;
  });

  // If no hands match the criteria (very tight filter), fall back to medium settings
  if (eligibleHands.length === 0) {
    const fallbackSettings = DIFFICULTY_SETTINGS.medium;
    eligibleHands = scoredHands.filter(h => {
      if (h.distance > fallbackSettings.maxDistance) return false;
      if (!fallbackSettings.includeObvious && h.isObvious) return false;
      return true;
    });
  }

  // Still no hands? Use all non-obvious hands
  if (eligibleHands.length === 0) {
    eligibleHands = scoredHands.filter(h => !h.isObvious);
  }

  // Last resort: any hand
  if (eligibleHands.length === 0) {
    eligibleHands = scoredHands;
  }

  // 65% chance to show a hand that's in range (raise/call)
  // 35% chance to show a fold hand
  const showInRangeHand = Math.random() < 0.65;

  const inRangeEligible = eligibleHands.filter(h => !h.isFold);
  const foldEligible = eligibleHands.filter(h => h.isFold);

  if (showInRangeHand && inRangeEligible.length > 0) {
    return inRangeEligible[Math.floor(Math.random() * inRangeEligible.length)].hand;
  }

  if (foldEligible.length > 0) {
    return foldEligible[Math.floor(Math.random() * foldEligible.length)].hand;
  }

  // Fallback
  if (eligibleHands.length > 0) {
    return eligibleHands[Math.floor(Math.random() * eligibleHands.length)].hand;
  }

  return allHands[Math.floor(Math.random() * allHands.length)];
}
