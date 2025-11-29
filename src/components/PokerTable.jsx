import React from 'react';
import './PokerTable.css';

// 6-max seat positions around the table (clockwise from hero)
const SEAT_POSITIONS = [
  { id: 'BTN', angle: 180, label: 'BTN' },   // Bottom center (Hero default)
  { id: 'SB', angle: 230, label: 'SB' },     // Bottom left
  { id: 'BB', angle: 310, label: 'BB' },     // Top left
  { id: 'UTG', angle: 0, label: 'UTG' },     // Top center
  { id: 'HJ', angle: 50, label: 'HJ' },      // Top right
  { id: 'CO', angle: 130, label: 'CO' }      // Bottom right
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

// Player type display info
const PLAYER_TYPE_INFO = {
  'fish': { label: 'Fish', color: '#3498db', icon: '🐟' },
  'aggro': { label: 'Aggro', color: '#e74c3c', icon: '🔥' },
  'passive': { label: 'Passive', color: '#95a5a6', icon: '🐢' },
  'tight': { label: 'Tight', color: '#9b59b6', icon: '🔒' },
  'pro': { label: 'Pro', color: '#f1c40f', icon: '⭐' },
  'reg': { label: 'Reg', color: '#1abc9c', icon: '📊' }
};

export default function PokerTable({
  heroPosition,
  dealerPosition,
  actions = [],
  currentActionIndex = -1,
  showHeroHighlight = false,
  blinds = { sb: 5, bb: 5 },
  bets = {}, // { position: amount }
  playerTypes = {}, // { position: 'fish' | 'aggro' | 'passive' | 'tight' | 'pro' | 'reg' }
  nextToActPosition = null // Position of the player about to act
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

  // Check if seat is next to act
  const isNextToAct = (seatId) => {
    if (!nextToActPosition) return false;
    const normalizedNext = POSITION_ALIASES[nextToActPosition] || nextToActPosition;
    return normalizedNext === seatId;
  };

  // Determine dealer button position (BTN)
  const getDealerSeat = () => {
    return 'BTN';
  };

  // Get bet amount for a seat
  const getBetForSeat = (seatId) => {
    // Check explicit bets first
    if (bets[seatId]) return bets[seatId];

    // Check if there's a visible action with a bet
    const action = getActionForSeat(seatId);
    if (action && isActionVisible(seatId)) {
      if (action.type === 'Raise' || action.type === 'open') {
        return blinds.bb * 2.5; // Standard open raise
      } else if (action.type === '3bet') {
        return blinds.bb * 9; // Typical 3bet
      } else if (action.type === '4bet') {
        return blinds.bb * 22; // Typical 4bet
      } else if (action.type === 'Call') {
        return blinds.bb * 2.5; // Calling an open
      }
    }

    // Blinds are always posted
    if (seatId === 'SB') return blinds.sb;
    if (seatId === 'BB') return blinds.bb;

    return 0;
  };

  // Calculate pot based on visible actions
  const calculatePot = () => {
    let pot = blinds.sb + blinds.bb; // Start with blinds
    actions.forEach((action, index) => {
      if (index <= currentActionIndex) {
        if (action.type === 'Call') {
          pot += blinds.bb * 2.5;
        }
      }
    });
    return pot;
  };

  return (
    <div className="poker-table-container">
      <div className="table-outer-rail">
        <div className="table-rail">
          <div className="table-felt">
            {/* Pot in center - just text, no chips until collected */}
            <div className="pot-area">
              <span className="pot-label">Total Pot</span>
              <span className="pot-amount">${calculatePot()}</span>
            </div>

            {/* Dealer button - positioned based on BTN seat */}
            {SEAT_POSITIONS.map(seat => {
              if (seat.id !== getDealerSeat()) return null;

              const adjustedAngle = seat.angle + rotationOffset;
              const radians = (adjustedAngle * Math.PI) / 180;
              const radiusX = 28;
              const radiusY = 24;
              const x = 50 + radiusX * Math.sin(radians);
              const y = 50 - radiusY * Math.cos(radians);

              return (
                <div
                  key="dealer-btn"
                  className="dealer-button-table"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span>D</span>
                </div>
              );
            })}

            {/* Render seats */}
            {SEAT_POSITIONS.map(seat => {
              const action = getActionForSeat(seat.id);
              const isVisible = isActionVisible(seat.id);
              const isHero = seat.id === normalizedHero;
              const actionClass = action ? action.type.toLowerCase().replace(' ', '-') : '';
              const betAmount = getBetForSeat(seat.id);
              const hasFolded = isVisible && action && action.type === 'Fold';
              const seatIsNextToAct = isNextToAct(seat.id);

              // Calculate position with rotation
              const adjustedAngle = seat.angle + rotationOffset;
              const radians = (adjustedAngle * Math.PI) / 180;
              const radiusX = 44;
              const radiusY = 40;
              const x = 50 + radiusX * Math.sin(radians);
              const y = 50 - radiusY * Math.cos(radians);

              // Calculate bet position (between seat and center)
              const betRadiusX = 28;
              const betRadiusY = 24;
              const betX = 50 + betRadiusX * Math.sin(radians);
              const betY = 50 - betRadiusY * Math.cos(radians);

              // Get player type for this seat
              const playerType = playerTypes[seat.id];
              const typeInfo = playerType ? PLAYER_TYPE_INFO[playerType] : null;

              return (
                <React.Fragment key={seat.id}>
                  {/* Bet/Chips in front of player */}
                  {betAmount > 0 && !hasFolded && (
                    <div
                      className="player-bet"
                      style={{ left: `${betX}%`, top: `${betY}%` }}
                    >
                      <div className="bet-chips">
                        {betAmount >= blinds.bb * 5 && <div className="chip black"></div>}
                        {betAmount >= blinds.bb * 2 && <div className="chip red"></div>}
                        <div className="chip green"></div>
                      </div>
                      <span className="bet-amount">${betAmount}</span>
                    </div>
                  )}

                  {/* Seat */}
                  <div
                    className={`seat ${isHero ? 'hero' : ''} ${isVisible ? `action-${actionClass}` : ''} ${showHeroHighlight && isHero ? 'highlight' : ''} ${hasFolded ? 'folded' : ''} ${seatIsNextToAct ? 'next-to-act' : ''}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {/* Next to act indicator */}
                    {seatIsNextToAct && (
                      <div className="next-to-act-indicator">
                        <span className="indicator-arrow">👆</span>
                      </div>
                    )}
                    <div className="seat-avatar">
                      {isHero ? '👤' : (typeInfo ? typeInfo.icon : '👤')}
                    </div>
                    <div className="seat-info">
                      <span className="seat-label">{seat.label}</span>
                      {typeInfo && !isHero && (
                        <span className="player-type" style={{ color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                      )}
                      <span className="seat-stack">${blinds.bb * 100}</span>
                    </div>
                    {isVisible && action && (
                      <div className={`action-bubble ${actionClass}`}>
                        {action.text || action.type}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
