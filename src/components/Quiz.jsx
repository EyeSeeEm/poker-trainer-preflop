import React, { useState, useEffect, useCallback } from 'react';
import HandDisplay from './HandDisplay';
import PokerTable from './PokerTable';
import { getSmartRandomHand } from '../utils/smartHandSelection';
import { getCorrectAction } from '../utils/rangeLogic';
import { SCENARIO_MAPPINGS } from './Settings';
import './Quiz.css';

// Speed settings - added 'point' for dealer pointing at next player
const SPEED_SETTINGS = {
  normal: { fold: 400, call: 600, raise: 900, initial: 600, feedback: 2000, point: 500 },
  fast: { fold: 200, call: 350, raise: 500, initial: 350, feedback: 1200, point: 300 },
  faster: { fold: 100, call: 150, raise: 250, initial: 150, feedback: 700, point: 150 }
};

// Card size options
const CARD_SIZES = ['small', 'medium', 'large'];

export default function Quiz({ scenarios, blinds = { sb: 5, bb: 5 }, onBack }) {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentHand, setCurrentHand] = useState('');
  const [userAnswer, setUserAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [actions, setActions] = useState([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeroHighlight, setShowHeroHighlight] = useState(false);
  const [speed, setSpeed] = useState('normal');
  const [playerTypes, setPlayerTypes] = useState({});
  const [cardSize, setCardSize] = useState('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [handHistory, setHandHistory] = useState([]);
  const [nextToActPosition, setNextToActPosition] = useState(null);

  // Get a random scenario from the available ones
  const getRandomScenario = useCallback(() => {
    if (!scenarios || scenarios.length === 0) return null;
    const index = Math.floor(Math.random() * scenarios.length);
    return scenarios[index];
  }, [scenarios]);

  // Build action sequence and player types for the current scenario
  const buildActionSequence = useCallback((scenario) => {
    const actions = [];
    const types = {};
    const mapping = scenario;

    // Add limpers first (they act before opens)
    if (mapping.limper) {
      actions.push({ position: mapping.limper, type: 'Limp', text: 'Limp' });
      if (mapping.limperType) {
        types[mapping.limper] = mapping.limperType;
      }
    }

    if (mapping.limper2) {
      actions.push({ position: mapping.limper2, type: 'Limp', text: 'Limp' });
      if (mapping.limper2Type) {
        types[mapping.limper2] = mapping.limper2Type;
      }
    }

    // Add villain actions based on scenario type
    if (mapping.villain) {
      if (mapping.villainAction === 'open') {
        actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise 2.5BB' });
      } else if (mapping.villainAction === '3bet') {
        actions.push({ position: mapping.villain, type: '3bet', text: '3-Bet' });
      } else if (mapping.villainAction === '4bet') {
        actions.push({ position: mapping.villain, type: '4bet', text: '4-Bet' });
      }
      if (mapping.villainType) {
        types[mapping.villain] = mapping.villainType;
      }
    }

    // Add second villain for cold 4bet scenarios
    if (mapping.villain2) {
      actions.push({ position: mapping.villain2, type: mapping.villain2Action, text: mapping.villain2Action === '3bet' ? '3-Bet' : mapping.villain2Action });
      if (mapping.villain2Type) {
        types[mapping.villain2] = mapping.villain2Type;
      }
    }

    // Add caller for squeeze scenarios
    if (mapping.caller) {
      actions.push({ position: mapping.caller, type: 'Call', text: 'Call' });
      if (mapping.callerType) {
        types[mapping.caller] = mapping.callerType;
      }
    }

    return { actions, types };
  }, []);

  // Animate actions in sequence with "next to act" indicator
  const animateActions = useCallback((actionsToAnimate, heroPosition) => {
    const speeds = SPEED_SETTINGS[speed];
    setIsAnimating(true);

    if (actionsToAnimate.length === 0) {
      // No villain actions - show indicator on hero then unlock
      setNextToActPosition(heroPosition);
      setTimeout(() => {
        setNextToActPosition(null);
        setIsAnimating(false);
        setShowHeroHighlight(true);
      }, speeds.point);
      return;
    }

    let index = 0;

    const showNextIndicator = () => {
      if (index < actionsToAnimate.length) {
        // Show "next to act" indicator on the player about to act
        const nextAction = actionsToAnimate[index];
        setNextToActPosition(nextAction.position);

        // After point delay, show the action
        setTimeout(() => {
          setNextToActPosition(null);
          setCurrentActionIndex(index);
          const actionType = nextAction.type;
          const delay = (actionType === 'Fold' || actionType === 'Limp') ? speeds.fold :
                        actionType === 'Call' ? speeds.call : speeds.raise;
          index++;
          setTimeout(showNextIndicator, delay);
        }, speeds.point);
      } else {
        // All villain actions done - show indicator on hero then unlock
        setNextToActPosition(heroPosition);
        setTimeout(() => {
          setNextToActPosition(null);
          setIsAnimating(false);
          setShowHeroHighlight(true);
        }, speeds.point);
      }
    };

    setTimeout(showNextIndicator, speeds.initial);
  }, [speed]);

  // Start a new hand
  const nextHand = useCallback(() => {
    const scenario = getRandomScenario();
    if (!scenario) return;

    setCurrentScenario(scenario);
    // Use smart hand selection - ensures fold hands are near the range boundary
    setCurrentHand(getSmartRandomHand(scenario.category, scenario.key));
    setUserAnswer(null);
    setCorrectAnswer(null);
    setCurrentActionIndex(-1);
    setShowHeroHighlight(false);
    setNextToActPosition(null);

    const { actions: actionSequence, types } = buildActionSequence(scenario);
    setActions(actionSequence);
    setPlayerTypes(types);

    // Get hero position for the indicator
    const heroPosition = scenario.positions[0];

    // Start animation after a short delay
    const speeds = SPEED_SETTINGS[speed];
    setTimeout(() => {
      animateActions(actionSequence, heroPosition);
    }, speeds.initial / 2);
  }, [getRandomScenario, buildActionSequence, animateActions, speed]);

  // Initialize on mount or when scenarios change
  useEffect(() => {
    if (scenarios && scenarios.length > 0) {
      nextHand();
    }
  }, [scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (userAnswer !== null || isAnimating || !showHeroHighlight) return;

      const key = e.key.toLowerCase();
      const buttons = getActionButtons();

      if (key === 'r' && buttons.some(b => b !== 'Fold' && b !== 'Call')) {
        const raiseAction = buttons.find(b => b !== 'Fold' && b !== 'Call');
        if (raiseAction) handleAnswer(raiseAction);
      } else if (key === 'c' && buttons.includes('Call')) {
        handleAnswer('Call');
      } else if (key === 'f') {
        handleAnswer('Fold');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, isAnimating, showHeroHighlight, currentScenario]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = (answer) => {
    if (userAnswer !== null || isAnimating || !showHeroHighlight) return;

    const correct = getCorrectAction(currentHand, currentScenario.category, currentScenario.key);
    setCorrectAnswer(correct);
    setUserAnswer(answer);

    const isCorrect = answer === correct;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    setStreak(prev => isCorrect ? prev + 1 : 0);

    // Record hand in history
    setHandHistory(prev => [{
      hand: currentHand,
      scenario: currentScenario.label,
      userAnswer: answer,
      correctAnswer: correct,
      isCorrect,
      timestamp: Date.now()
    }, ...prev].slice(0, 50)); // Keep last 50 hands

    // Auto-advance after delay based on speed
    const speeds = SPEED_SETTINGS[speed];
    const feedbackTime = isCorrect ? speeds.feedback * 0.6 : speeds.feedback;
    setTimeout(nextHand, feedbackTime);
  };

  const getActionButtons = () => {
    if (!currentScenario) return [];

    const category = currentScenario.category;
    if (category === 'open_ranges') {
      return ['Raise', 'Fold'];
    } else if (category === 'vs_open_ranges') {
      return ['3bet', 'Call', 'Fold'];
    } else if (category === 'vs_3bet_ranges' || category === 'cold_4bet_ranges') {
      return ['4bet', 'Call', 'Fold'];
    } else if (category === 'vs_4bet_ranges') {
      return ['5bet', 'Call', 'Fold'];
    }
    return [];
  };

  const getButtonClass = (action) => {
    let base = 'action-button';

    // Color coding
    if (action === 'Fold') {
      base += ' fold-btn';
    } else if (action === 'Call') {
      base += ' call-btn';
    } else {
      base += ' raise-btn';
    }

    // State
    if (userAnswer === null) {
      return base;
    }
    if (action === correctAnswer) {
      return base + ' correct';
    }
    if (action === userAnswer && action !== correctAnswer) {
      return base + ' incorrect';
    }
    return base + ' disabled';
  };

  const getButtonLabel = (action) => {
    const labels = {
      'Raise': 'Raise (R)',
      '3bet': '3-Bet (R)',
      '4bet': '4-Bet (R)',
      '5bet': '5-Bet (R)',
      'Call': 'Call (C)',
      'Fold': 'Fold (F)'
    };
    return labels[action] || action;
  };

  const getShortcut = (action) => {
    if (action === 'Call') return 'C';
    if (action === 'Fold') return 'F';
    return 'R';
  };

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  // Get hero position from current scenario
  const getHeroPosition = () => {
    if (!currentScenario) return 'BTN';
    // Return first position in the positions array
    return currentScenario.positions[0];
  };

  // Get dealer position based on scenario
  const getDealerPosition = () => {
    // For simplicity, dealer is always BTN unless hero is BTN, then CO
    const hero = getHeroPosition();
    if (hero === 'BTN') return 'BTN';
    return 'BTN';
  };

  // Get situation description
  const getSituationDescription = () => {
    if (!currentScenario) return '';

    const mapping = currentScenario;
    if (mapping.villain) {
      if (mapping.caller) {
        return `${mapping.villain} opens, ${mapping.caller} calls. You are ${getHeroPosition()}.`;
      }
      const actionName = mapping.villainAction === 'open' ? 'opened' :
                        mapping.villainAction === '3bet' ? '3-bet' :
                        mapping.villainAction === '4bet' ? '4-bet' : mapping.villainAction;
      if (mapping.villain2) {
        return `${mapping.villain} opened, ${mapping.villain2} ${mapping.villain2Action}. You are ${getHeroPosition()}.`;
      }
      return `${mapping.villain} ${actionName}. You are ${getHeroPosition()}.`;
    }
    return `You are ${getHeroPosition()}. Action on you.`;
  };

  if (!currentScenario) {
    return <div className="quiz loading">Loading...</div>;
  }

  return (
    <div className={`quiz ${userAnswer !== null ? (userAnswer === correctAnswer ? 'result-correct' : 'result-incorrect') : ''}`}>
      <div className="quiz-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="header-actions">
          <button
            className={`history-btn ${handHistory.length > 0 ? 'has-history' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Hand History"
          >
            <span className="history-icon">📋</span>
            {handHistory.length > 0 && <span className="history-count">{handHistory.length}</span>}
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <span className="hamburger-icon">☰</span>
          </button>
        </div>
        <div className="score-display">
          <span className="score">{score.correct}/{score.total} ({percentage}%)</span>
          <span className={`streak ${streak >= 5 ? 'hot' : ''}`}>
            🔥 {streak}
          </span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-panel-header">
            <h3>Settings</h3>
            <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
          </div>
          <div className="setting-group">
            <label className="setting-label">Speed</label>
            <div className="speed-buttons">
              <button
                className={`speed-btn ${speed === 'normal' ? 'active' : ''}`}
                onClick={() => setSpeed('normal')}
              >1x</button>
              <button
                className={`speed-btn ${speed === 'fast' ? 'active' : ''}`}
                onClick={() => setSpeed('fast')}
              >2x</button>
              <button
                className={`speed-btn ${speed === 'faster' ? 'active' : ''}`}
                onClick={() => setSpeed('faster')}
              >3x</button>
            </div>
          </div>
          <div className="setting-group">
            <label className="setting-label">Card Size</label>
            <div className="size-buttons">
              {CARD_SIZES.map(size => (
                <button
                  key={size}
                  className={`size-btn ${cardSize === size ? 'active' : ''}`}
                  onClick={() => setCardSize(size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hand History Panel */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-panel-header">
            <h3>Hand History</h3>
            <button className="close-btn" onClick={() => setShowHistory(false)}>×</button>
          </div>
          {handHistory.length === 0 ? (
            <div className="history-empty">No hands played yet</div>
          ) : (
            <div className="history-list">
              {handHistory.map((item, index) => (
                <div key={index} className={`history-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="history-hand">
                    <HandDisplay hand={item.hand} size="mini" />
                  </div>
                  <div className="history-details">
                    <span className="history-scenario">{item.scenario}</span>
                    <div className="history-answers">
                      <span className={`history-user-answer ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                        {item.userAnswer}
                      </span>
                      {!item.isCorrect && (
                        <span className="history-correct-answer">→ {item.correctAnswer}</span>
                      )}
                    </div>
                  </div>
                  <span className={`history-result ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                    {item.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="scenario-label">{currentScenario.label}</div>

      <PokerTable
        heroPosition={getHeroPosition()}
        dealerPosition={getDealerPosition()}
        actions={actions}
        currentActionIndex={currentActionIndex}
        showHeroHighlight={showHeroHighlight && userAnswer === null}
        blinds={blinds}
        playerTypes={playerTypes}
        nextToActPosition={nextToActPosition}
      />

      <div className="situation-description">
        {getSituationDescription()}
      </div>

      <HandDisplay hand={currentHand} size={cardSize} />

      <div className="action-buttons">
        {getActionButtons().map(action => (
          <button
            key={action}
            className={getButtonClass(action)}
            onClick={() => handleAnswer(action)}
            disabled={userAnswer !== null || isAnimating || !showHeroHighlight}
          >
            <span className="btn-label">{action}</span>
            <span className="btn-shortcut">{getShortcut(action)}</span>
          </button>
        ))}
      </div>

      {userAnswer !== null && (
        <div className={`feedback ${userAnswer === correctAnswer ? 'correct' : 'incorrect'}`}>
          {userAnswer === correctAnswer ? (
            <span>✓ Correct!</span>
          ) : (
            <span>✗ Wrong! Correct: <strong>{correctAnswer}</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
