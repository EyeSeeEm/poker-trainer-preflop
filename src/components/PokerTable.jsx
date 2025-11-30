import React from 'react';
import './PokerTable.css';

// 6-max seat positions around the table (clockwise from hero)
// Angles spread more evenly (60 degrees apart) to give each player their own area
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

// Player type display info
const PLAYER_TYPE_INFO = {
  'fish': { label: 'Fish', color: '#3498db', icon: '🐟' },
  'aggro': { label: 'Aggro', color: '#e74c3c', icon: '🔥' },
  'passive': { label: 'Passive', color: '#95a5a6', icon: '🐢' },
  'tight': { label: 'Tight', color: '#9b59b6', icon: '🔒' },
  'pro': { label: 'Pro', color: '#e67e22', icon: '⭐' },
  'reg': { label: 'Reg', color: '#2ecc71', icon: '📊' }
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
  nextToActPosition = null, // Position of the player about to act
  chipStyle = 'default', // 'default' or 'berlin'
  playerColors = 'type' // 'type' or 'off'
}) {
  // Normalize hero position
  const normalizedHero = POSITION_ALIASES[heroPosition] || 'BTN';

  // Calculate rotation so hero is always at bottom
  const heroSeat = SEAT_POSITIONS.find(s => s.id === normalizedHero);
  const rotationOffset = heroSeat ? 180 - heroSeat.angle : 0;

  // Get the LATEST visible action for a specific seat
  const getActionForSeat = (seatId) => {
    let latestAction = null;
    let latestIndex = -1;
    actions.forEach((a, index) => {
      const normalizedPos = POSITION_ALIASES[a.position] || a.position;
      if (normalizedPos === seatId && index <= currentActionIndex && index > latestIndex) {
        latestAction = a;
        latestIndex = index;
      }
    });
    return latestAction;
  };

  // Check if any action for the seat is visible (animated in sequence)
  const isActionVisible = (seatId) => {
    return actions.some((a, index) => {
      const normalizedPos = POSITION_ALIASES[a.position] || a.position;
      return normalizedPos === seatId && index <= currentActionIndex;
    });
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

    // Track the current bet to call for each street
    let currentBetToCall = blinds.bb; // BB is the initial bet

    actions.forEach((action, index) => {
      if (index <= currentActionIndex) {
        const pos = POSITION_ALIASES[action.position] || action.position;

        if (action.type === 'Limp') {
          // Limp completes to BB
          pot += blinds.bb;
        } else if (action.type === 'Raise' || action.type === 'open') {
          // Open raise is 2.5BB - adds 2.5BB to pot (minus any blind already posted)
          const raiseAmount = blinds.bb * 2.5;
          if (pos === 'SB') {
            pot += raiseAmount - blinds.sb; // SB already posted
          } else if (pos === 'BB') {
            pot += raiseAmount - blinds.bb; // BB already posted
          } else {
            pot += raiseAmount;
          }
          currentBetToCall = raiseAmount;
        } else if (action.type === '3bet') {
          // 3bet is 9BB
          const threebetAmount = blinds.bb * 9;
          if (pos === 'SB') {
            pot += threebetAmount - blinds.sb;
          } else if (pos === 'BB') {
            pot += threebetAmount - blinds.bb;
          } else {
            pot += threebetAmount;
          }
          currentBetToCall = threebetAmount;
        } else if (action.type === '4bet') {
          // 4bet is 22BB
          const fourbetAmount = blinds.bb * 22;
          pot += fourbetAmount;
          currentBetToCall = fourbetAmount;
        } else if (action.type === 'Call') {
          // Call matches the current bet
          pot += currentBetToCall;
        }
        // Fold adds nothing
      }
    });
    return pot;
  };

  return (
    <div className={`poker-table-container ${chipStyle === 'berlin' ? 'berlin-chips' : ''}`}>
      <div className="table-outer-rail">
        <div className="table-rail">
          <div className="table-felt">
            {/* Pot in center - just text, no chips until collected */}
            <div className="pot-area">
              <span className="pot-label">Total Pot</span>
              <span className="pot-amount">${calculatePot()}</span>
            </div>

            {/* Dealer button - positioned on the outer edge of BTN seat */}
            {SEAT_POSITIONS.map(seat => {
              if (seat.id !== getDealerSeat()) return null;

              // Calculate BTN seat's screen position first
              const adjustedAngle = seat.angle + rotationOffset;
              const radians = (adjustedAngle * Math.PI) / 180;
              const seatRadiusX = 46;
              const seatRadiusY = 42;
              const seatX = 50 + seatRadiusX * Math.sin(radians);
              const seatY = 50 - seatRadiusY * Math.cos(radians);

              // Position dealer button on the OUTER edge of the seat (away from table center)
              // This avoids overlap with bets/chips and action bubbles
              let btnOffsetX, btnOffsetY;

              // Determine quadrant and set appropriate offset - push button OUTWARD
              const isLeft = seatX < 50;
              const isTop = seatY < 50;
              const isHorizontalCenter = Math.abs(seatX - 50) < 12;

              if (isHorizontalCenter) {
                // Top or bottom center - offset to the right side
                btnOffsetX = 9;
                btnOffsetY = isTop ? -4 : 4;
              } else if (isTop && isLeft) {
                // Top-left: button to upper-left (outward)
                btnOffsetX = -8;
                btnOffsetY = -5;
              } else if (isTop && !isLeft) {
                // Top-right: button to upper-right (outward)
                btnOffsetX = 8;
                btnOffsetY = -5;
              } else if (!isTop && isLeft) {
                // Bottom-left: button to lower-left (outward)
                btnOffsetX = -8;
                btnOffsetY = 5;
              } else {
                // Bottom-right: button to lower-right (outward)
                btnOffsetX = 8;
                btnOffsetY = 5;
              }

              const x = seatX + btnOffsetX;
              const y = seatY + btnOffsetY;

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
              // Larger radius to spread players further apart
              const radiusX = 46;
              const radiusY = 42;
              let x = 50 + radiusX * Math.sin(radians);
              const y = 50 - radiusY * Math.cos(radians);

              // Store original x for chip positioning before any seat adjustments
              const chipBaseX = x;

              // Calculate bet/chips position - towards center from player
              const isLeft = x < 50;
              const isTop = y < 50;
              const isHorizontalCenter = Math.abs(x - 50) < 10;

              // Base bet position - between player and center
              const betRadiusX = 30;
              const betRadiusY = 28;
              let betX = 50 + betRadiusX * Math.sin(radians);
              let betY = 50 - betRadiusY * Math.cos(radians);

              // For hero (bottom center), place chips to the right of the player
              if (isHero) {
                betX = x + 15; // To the right of player (was 12, +3)
                betY = y - 11; // Above center (was -6, -5)
              } else if (isHorizontalCenter) {
                // Top/bottom center players
                if (isTop) {
                  // UTG (top center) - chips to the LEFT of player box so action bubble is visible
                  betX = x - 14;
                  betY = y + 8;
                } else {
                  // Bottom center (non-hero) - chips above
                  betX = x;
                  betY = y - 14;
                }
              } else {
                // Side players - offset chips towards center
                betX = 50 + betRadiusX * Math.sin(radians);
                betY = 50 - betRadiusY * Math.cos(radians);

                // Bottom-right player (SB when hero is BB) - shift chips more to the right
                if (!isTop && !isLeft) {
                  betX += 4;
                }
              }

              // Bottom-right player - move seat 2px to the right (chips stay in place)
              if (!isTop && !isLeft && !isHero) {
                x += 2;
              }

              // Get player type for this seat
              const playerType = playerTypes[seat.id];
              const typeInfo = playerType ? PLAYER_TYPE_INFO[playerType] : null;

              // Check if hero has performed an action (not just posted blind)
              const heroHasActed = isHero && isVisible && action;

              // Check if this is a blind position (SB or BB)
              const isBlindPosition = seat.id === 'SB' || seat.id === 'BB';

              // Determine if we should show chips for this player
              // - Folded blinds: always show their blind chips (they stay on table)
              // - Non-hero with bet: show chips
              // - Hero with bet: always show chips (with or without action)
              const showChips = (
                (hasFolded && isBlindPosition) || // Folded blinds always show chips
                (betAmount > 0 && !hasFolded) // Anyone with a bet who hasn't folded
              );

              // Determine if we should show the dollar amount below chips
              // - Folded blinds: show amount (chips stay visible with their value)
              // - Hero: always show amount (before and after acting)
              // - Non-hero: always show amount
              const showBetAmount = (
                (hasFolded && isBlindPosition) || // Folded blinds show their amount
                (!hasFolded) // All active players show their amount
              );

              // For folded blinds, show original blind amount
              const displayBetAmount = hasFolded ?
                (seat.id === 'SB' ? blinds.sb : seat.id === 'BB' ? blinds.bb : 0) :
                betAmount;

              return (
                <React.Fragment key={seat.id}>
                  {/* Bet/Chips in front of player */}
                  {showChips && displayBetAmount > 0 && (
                    <div
                      className={`player-bet ${isHero ? 'hero-bet' : ''}`}
                      style={{ left: `${betX}%`, top: `${betY}%` }}
                    >
                      <div className="bet-chips">
                        {displayBetAmount >= blinds.bb * 5 && <div className="chip black"></div>}
                        {displayBetAmount >= blinds.bb * 2 && <div className="chip red"></div>}
                        <div className={`chip ${chipStyle === 'berlin' ? 'white' : 'green'}`}></div>
                      </div>
                      {/* Show bet amount when appropriate */}
                      {showBetAmount && (
                        <span className="bet-amount">${displayBetAmount}</span>
                      )}
                    </div>
                  )}

                  {/* Seat */}
                  <div
                    className={`seat ${isHero ? 'hero' : ''} ${hasFolded ? 'folded' : ''} ${seatIsNextToAct ? 'next-to-act' : ''} ${typeInfo && !hasFolded && playerColors === 'type' ? `player-type-${playerType}` : ''} ${typeInfo && !hasFolded && playerColors === 'off' ? 'player-type-off' : ''}`}
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
                    {/* Show action bubble for non-fold actions */}
                    {isVisible && action && actionClass !== 'fold' && (
                      <div className={`action-bubble ${actionClass} ${typeInfo && playerColors === 'type' ? `player-${playerType}` : ''} ${typeInfo && playerColors === 'off' ? 'player-off' : ''}`}>
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
