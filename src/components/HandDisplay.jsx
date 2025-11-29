import React from 'react';
import './HandDisplay.css';

export default function HandDisplay({ hand, size = 'medium' }) {
  const formatHand = (hand) => {
    if (!hand) return [];

    if (hand.length === 2) {
      // Pocket pair like "AA"
      return [
        { rank: hand[0], suit: '♠', color: 'black' },
        { rank: hand[1], suit: '♥', color: 'red' }
      ];
    } else if (hand.length === 3) {
      // Suited or offsuit like "AKs" or "AKo"
      const suited = hand[2] === 's';
      return [
        { rank: hand[0], suit: suited ? '♠' : '♠', color: 'black' },
        { rank: hand[1], suit: suited ? '♠' : '♥', color: suited ? 'black' : 'red' }
      ];
    }
    return [];
  };

  const cards = formatHand(hand);
  const isSuited = hand && hand.length === 3 && hand[2] === 's';
  const isPair = hand && hand.length === 2;

  return (
    <div className={`hand-display size-${size}`}>
      <div className="cards-container">
        {cards.map((card, index) => (
          <div key={index} className={`card ${index === 1 ? 'card-overlap' : ''}`}>
            <div className="card-inner">
              <div className={`card-corner top-left ${card.color}`}>
                <span className="corner-rank">{card.rank}</span>
                <span className="corner-suit">{card.suit}</span>
              </div>
              <div className={`card-center ${card.color}`}>
                <span className="center-suit">{card.suit}</span>
              </div>
              <div className={`card-corner bottom-right ${card.color}`}>
                <span className="corner-rank">{card.rank}</span>
                <span className="corner-suit">{card.suit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hand-label">
        {hand}
        {isPair && <span className="hand-type">Pair</span>}
        {isSuited && <span className="hand-type suited">Suited</span>}
        {!isPair && !isSuited && hand && <span className="hand-type offsuit">Offsuit</span>}
      </div>
    </div>
  );
}
