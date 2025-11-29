import React from 'react';
import './PokerTable.css';

// 6-max seat positions around the table (clockwise from hero)
const SEAT_POSITIONS = [
  { id: 'BTN', angle: 180, label: 'BTN' },   // Bottom center (Hero default)
  { id: 'SB', angle: 240, label: 'SB' },     // Bottom left
  { id: 'BB', angle: 300, label: 'BB' },     // Top left
  { id: 'UTG', angle: 0, label: 'UTG' },     // Top center
  { id: 'HJ', angle: 60, label: 'HJ' },      // Top right
  { id: 'CO', angle: 120, label: 'CO' }      // Bottom right
];

// Alternative names mapping
const POSITION_ALIASES = {
  'EP': 'UTG',
  'UTG': 'UTG',
  'HJ': 'HJ',
  'CO': 'CO',
  'BTN': 'BTN',
  'SB': 'SB',
  'BB': 'BB'
};

export default function PokerTable({
  heroPosition,
  dealerPosition,
  actions = [],
  currentActionIndex = -1,
  showHeroHighlight = false
}) {
  // Normalize hero position
  const normalizedHero = POSITION_ALIASES[heroPosition] || 'BTN';

  // Calculate rotation so hero is always at bottom
  const heroSeat = SEAT_POSITIONS.find(s => s.id === normalizedHero);
  const rotationOffset = heroSeat ? 180 - heroSeat.angle : 0;

  // Get action for a specific seat
  const getActionForSeat = (seatId) => {
    return actions.find(a => {
      const normalizedPos = POSITION_ALIASES[a.position] || a.position;
      return normalizedPos === seatId;
    });
  };

  // Check if seat action should be visible (animated in sequence)
  const isActionVisible = (seatId) => {
    const actionIndex = actions.findIndex(a => {
      const normalizedPos = POSITION_ALIASES[a.position] || a.position;
      return normalizedPos === seatId;
    });
    return actionIndex !== -1 && actionIndex <= currentActionIndex;
  };

  // Determine dealer button position
  const getDealerSeat = () => {
    if (!dealerPosition) return 'BTN';
    return POSITION_ALIASES[dealerPosition] || dealerPosition;
  };

  return (
    <div className="poker-table-container">
      <div className="table-rail">
        <div className="table-felt">
          <div className="table-center">
            <div className="pot-area">
              <span className="pot-label">POT</span>
            </div>
          </div>

          {/* Render seats */}
          {SEAT_POSITIONS.map(seat => {
            const action = getActionForSeat(seat.id);
            const isVisible = isActionVisible(seat.id);
            const isHero = seat.id === normalizedHero;
            const isDealer = seat.id === getDealerSeat();
            const actionClass = action ? action.type.toLowerCase().replace(' ', '-') : '';

            // Calculate position with rotation
            const adjustedAngle = seat.angle + rotationOffset;
            const radians = (adjustedAngle * Math.PI) / 180;
            const radiusX = 42; // % from center
            const radiusY = 38;
            const x = 50 + radiusX * Math.sin(radians);
            const y = 50 - radiusY * Math.cos(radians);

            return (
              <div
                key={seat.id}
                className={`seat ${isHero ? 'hero' : ''} ${isVisible ? `action-${actionClass}` : ''} ${showHeroHighlight && isHero ? 'highlight' : ''}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`
                }}
              >
                {isDealer && <div className="dealer-button">D</div>}
                <div className="seat-avatar">
                  {isHero ? '🎯' : '👤'}
                </div>
                <div className="seat-label">{seat.label}</div>
                {isVisible && action && (
                  <div className={`action-bubble ${actionClass}`}>
                    {action.text || action.type}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
