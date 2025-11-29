import { rangeData } from '../rangeData';

export function getCorrectAction(hand, category, scenario) {
  const rangeCategory = rangeData[category];
  if (!rangeCategory) return 'Fold';

  const scenarioData = rangeCategory[scenario];
  if (!scenarioData) return 'Fold';

  // For open_ranges, it's a simple array
  if (category === 'open_ranges') {
    return scenarioData.includes(hand) ? 'Raise' : 'Fold';
  }

  // For other ranges, check 3bet/4bet/5bet first, then call, then fold
  if (scenarioData['5bet'] && scenarioData['5bet'].includes(hand)) {
    return '5bet';
  }
  if (scenarioData['4bet'] && scenarioData['4bet'].includes(hand)) {
    return '4bet';
  }
  if (scenarioData['3bet'] && scenarioData['3bet'].includes(hand)) {
    return '3bet';
  }
  if (scenarioData['call'] && scenarioData['call'].includes(hand)) {
    return 'Call';
  }

  return 'Fold';
}
