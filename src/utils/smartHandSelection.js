import { generateAllHands } from './handGeneration';
import { getCorrectAction } from './rangeLogic';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

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
    const action = getCorrectAction(hand, category, scenario);
    if (action === 'Fold') {
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
    const action = getCorrectAction(hand, category, scenario);
    if (action === 'Fold') {
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

// Get a smart random hand for a scenario
// This ensures hands are interesting (near the boundary), avoiding obvious plays
export function getSmartRandomHand(category, scenario) {
  const allHands = generateAllHands();
  const obviousHands = getObviousHands(category);

  // 65% chance to show a hand that's in range (raise/call)
  // 35% chance to show a fold hand (but a challenging one)
  const showInRangeHand = Math.random() < 0.65;

  if (showInRangeHand) {
    // Get boundary in-range hands (interesting ones near the fold boundary)
    const boundaryInRange = findBoundaryInRangeHands(category, scenario, allHands);

    if (boundaryInRange.length > 0) {
      return boundaryInRange[Math.floor(Math.random() * boundaryInRange.length)];
    }

    // Fallback: any non-obvious in-range hand
    const inRangeHands = allHands.filter(hand => {
      const action = getCorrectAction(hand, category, scenario);
      return action !== 'Fold' && !obviousHands.has(hand);
    });

    if (inRangeHands.length > 0) {
      return inRangeHands[Math.floor(Math.random() * inRangeHands.length)];
    }
  }

  // Get boundary fold hands (challenging folds)
  const boundaryFolds = findBoundaryFoldHands(category, scenario, allHands);

  if (boundaryFolds.length > 0) {
    return boundaryFolds[Math.floor(Math.random() * boundaryFolds.length)];
  }

  // Fallback to any non-obvious hand
  const nonObviousHands = allHands.filter(h => !obviousHands.has(h));
  if (nonObviousHands.length > 0) {
    return nonObviousHands[Math.floor(Math.random() * nonObviousHands.length)];
  }

  return allHands[Math.floor(Math.random() * allHands.length)];
}
