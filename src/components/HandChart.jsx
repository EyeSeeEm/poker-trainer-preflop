import React from 'react';
import { getCorrectAction } from '../utils/rangeLogic';
import './HandChart.css';

// All 13 ranks in order (A highest)
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Generate the hand notation for a cell
// Row = first card rank, Col = second card rank
// If row < col (above diagonal): suited hands (e.g., AKs)
// If row > col (below diagonal): offsuit hands (e.g., AKo)
// If row === col: pairs (e.g., AA)
const getHandNotation = (rowIdx, colIdx) => {
  const rank1 = RANKS[rowIdx];
  const rank2 = RANKS[colIdx];

  if (rowIdx === colIdx) {
    return rank1 + rank2; // Pair (AA, KK, etc.)
  } else if (rowIdx < colIdx) {
    return rank1 + rank2 + 's'; // Suited (above diagonal)
  } else {
    return rank2 + rank1 + 'o'; // Offsuit (below diagonal)
  }
};

// Map action to CSS class
const getActionClass = (action) => {
  if (!action) return 'fold';
  const lowerAction = action.toLowerCase();
  if (lowerAction === 'fold') return 'fold';
  if (lowerAction === 'call') return 'call';
  if (lowerAction === 'raise' || lowerAction === '3bet' || lowerAction === '4bet' || lowerAction === '5bet') return 'raise';
  return 'fold';
};

// Get CSS color for an action
const getActionColor = (action) => {
  const actionClass = getActionClass(action);
  if (actionClass === 'raise') return '#27ae60';
  if (actionClass === 'call') return '#3498db';
  return '#4a5a6a';
};

export default function HandChart({ category, scenarioKey, title }) {
  return (
    <div className="hand-chart-container">
      {title && <div className="hand-chart-title">{title}</div>}
      <div className="hand-chart-grid">
        {RANKS.map((_, rowIdx) => (
          RANKS.map((_, colIdx) => {
            const hand = getHandNotation(rowIdx, colIdx);
            const result = getCorrectAction(hand, category, scenarioKey);
            const action = result?.action || 'Fold';
            const isMixed = result?.isMixed || false;
            const altAction = result?.altAction;
            const actionClass = getActionClass(action);

            // For mixed hands, create a diagonal split background
            const mixedStyle = isMixed ? {
              background: `linear-gradient(135deg, ${getActionColor(action)} 50%, ${getActionColor(altAction)} 50%)`
            } : {};

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`hand-chart-cell ${isMixed ? 'mixed-split' : actionClass}`}
                style={mixedStyle}
                title={isMixed ? `50% ${action} / 50% ${altAction}` : action}
              >
                <span className="hand-notation">{hand}</span>
              </div>
            );
          })
        ))}
      </div>
      <div className="hand-chart-legend">
        <div className="legend-item raise">
          <span className="legend-color"></span>
          <span className="legend-label">Raise/Bet</span>
        </div>
        <div className="legend-item call">
          <span className="legend-color"></span>
          <span className="legend-label">Call</span>
        </div>
        <div className="legend-item fold">
          <span className="legend-color"></span>
          <span className="legend-label">Fold</span>
        </div>
      </div>
    </div>
  );
}
