import { generateAllHands } from './handGeneration';
import { getCorrectAction } from './rangeLogic';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

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

// Get a smart random hand for a scenario
// This ensures fold hands are interesting (near the boundary)
export function getSmartRandomHand(category, scenario) {
  const allHands = generateAllHands();

  // 70% chance to show a hand that's in range (raise/call)
  // 30% chance to show a fold hand (but a challenging one)
  const showInRangeHand = Math.random() < 0.7;

  if (showInRangeHand) {
    // Get hands that are not folds
    const inRangeHands = allHands.filter(hand => {
      const action = getCorrectAction(hand, category, scenario);
      return action !== 'Fold';
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

  // Fallback to any hand
  return allHands[Math.floor(Math.random() * allHands.length)];
}
