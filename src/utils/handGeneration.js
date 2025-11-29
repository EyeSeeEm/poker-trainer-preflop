const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export function generateAllHands() {
  const hands = [];

  // Generate all pocket pairs (13 pairs)
  for (const rank of ranks) {
    hands.push(`${rank}${rank}`);
  }

  // Generate all suited and offsuit combinations
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      const higherRank = ranks[i];
      const lowerRank = ranks[j];

      // Suited
      hands.push(`${higherRank}${lowerRank}s`);

      // Offsuit
      hands.push(`${higherRank}${lowerRank}o`);
    }
  }

  return hands;
}

export function getRandomHand() {
  const allHands = generateAllHands();
  const randomIndex = Math.floor(Math.random() * allHands.length);
  return allHands[randomIndex];
}
