import { rangeData } from '../rangeData';

/**
 * Get the correct action(s) for a hand in a given scenario
 * @returns {object} { action: string, altAction: string|null, isMixed: boolean }
 *   - action: The primary correct action
 *   - altAction: Alternative correct action for mixed hands (null if not mixed)
 *   - isMixed: Whether this hand has mixed frequencies
 */
export function getCorrectAction(hand, category, scenario) {
  const rangeCategory = rangeData[category];
  if (!rangeCategory) return { action: 'Fold', altAction: null, isMixed: false };

  const scenarioData = rangeCategory[scenario];
  if (!scenarioData) return { action: 'Fold', altAction: null, isMixed: false };

  // For open_ranges, it's a simple array
  if (category === 'open_ranges') {
    return {
      action: scenarioData.includes(hand) ? 'Raise' : 'Fold',
      altAction: null,
      isMixed: false
    };
  }

  // Check if hand is in mixed array
  const isMixed = scenarioData['mixed'] && scenarioData['mixed'].includes(hand);

  // Determine primary action (check raise actions first, then call)
  let primaryAction = 'Fold';
  let raiseAction = null;

  if (scenarioData['5bet'] && scenarioData['5bet'].includes(hand)) {
    primaryAction = '5bet';
    raiseAction = '5bet';
  } else if (scenarioData['4bet'] && scenarioData['4bet'].includes(hand)) {
    primaryAction = '4bet';
    raiseAction = '4bet';
  } else if (scenarioData['3bet'] && scenarioData['3bet'].includes(hand)) {
    primaryAction = '3bet';
    raiseAction = '3bet';
  }

  const isCall = scenarioData['call'] && scenarioData['call'].includes(hand);

  // If hand is in a raise range
  if (raiseAction) {
    if (isMixed) {
      // Mixed means both raise and call are acceptable
      return { action: raiseAction, altAction: 'Call', isMixed: true };
    }
    return { action: raiseAction, altAction: null, isMixed: false };
  }

  // If hand is in call range
  if (isCall) {
    if (isMixed) {
      // Mixed but only in call - find the raise action from mixed context
      // Check what raise action exists in this scenario
      let mixedRaiseAction = null;
      if (scenarioData['5bet']) mixedRaiseAction = '5bet';
      else if (scenarioData['4bet']) mixedRaiseAction = '4bet';
      else if (scenarioData['3bet']) mixedRaiseAction = '3bet';

      if (mixedRaiseAction) {
        return { action: 'Call', altAction: mixedRaiseAction, isMixed: true };
      }
    }
    return { action: 'Call', altAction: null, isMixed: false };
  }

  // Hand is ONLY in mixed array (not in raise or call) - treat as mixed between raise and call
  if (isMixed) {
    let mixedRaiseAction = null;
    if (scenarioData['5bet']) mixedRaiseAction = '5bet';
    else if (scenarioData['4bet']) mixedRaiseAction = '4bet';
    else if (scenarioData['3bet']) mixedRaiseAction = '3bet';

    if (mixedRaiseAction) {
      return { action: mixedRaiseAction, altAction: 'Call', isMixed: true };
    }
  }

  return { action: 'Fold', altAction: null, isMixed: false };
}

/**
 * Check if a user's answer is correct for a hand
 * @returns {boolean}
 */
export function isAnswerCorrect(userAnswer, hand, category, scenario) {
  const { action, altAction, isMixed } = getCorrectAction(hand, category, scenario);

  if (userAnswer === action) return true;
  if (isMixed && altAction && userAnswer === altAction) return true;

  return false;
}

/**
 * Get display string for correct action(s)
 * @returns {string} e.g., "Call" or "Call/3bet"
 */
export function getCorrectActionDisplay(hand, category, scenario) {
  const { action, altAction, isMixed } = getCorrectAction(hand, category, scenario);

  if (isMixed && altAction) {
    return `${action}/${altAction}`;
  }
  return action;
}
