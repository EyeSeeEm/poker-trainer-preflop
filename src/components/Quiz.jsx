import React, { useState, useEffect, useCallback, useRef } from 'react';
import HandDisplay from './HandDisplay';
import PokerTable from './PokerTable';
import { getSmartRandomHand } from '../utils/smartHandSelection';
import { getCorrectAction } from '../utils/rangeLogic';
import { SCENARIO_MAPPINGS } from './Settings';
import './Quiz.css';

// Speed settings - 'normal' is 2x original speed, 'fast' is 2.5x, 'faster' is 3x
const SPEED_SETTINGS = {
  normal: { fold: 200, call: 350, raise: 500, initial: 100, feedback: 1200, point: 300, quickFold: 50 },
  fast: { fold: 160, call: 280, raise: 400, initial: 80, feedback: 900, point: 240, quickFold: 40 },
  faster: { fold: 100, call: 150, raise: 250, initial: 100, feedback: 700, point: 150, quickFold: 50 }
};

// Preflop action order (after blinds posted) - EP is same as UTG in 6-max
const PREFLOP_ACTION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Normalize position (EP = UTG)
const normalizePosition = (pos) => pos === 'EP' ? 'UTG' : pos;

// Get positions from UTG up to (but not including) a given position
const getPositionsBefore = (pos) => {
  const targetIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(pos));
  if (targetIdx <= 0) return []; // UTG is first, nothing before
  return PREFLOP_ACTION_ORDER.slice(0, targetIdx);
};

// Get positions between two positions in preflop order (after opener, before responder)
const getPositionsBetween = (openerPos, responderPos) => {
  const openerIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(openerPos));
  const responderIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(responderPos));

  if (openerIdx === -1 || responderIdx === -1) return [];

  const positions = [];
  // Preflop action goes in order
  let idx = openerIdx + 1;
  while (idx < PREFLOP_ACTION_ORDER.length && idx !== responderIdx) {
    if (idx === responderIdx) break;
    positions.push(PREFLOP_ACTION_ORDER[idx]);
    idx++;
  }
  return positions;
};

// localStorage keys
const HISTORY_STORAGE_KEY = 'poker-trainer-history';
const SETTINGS_STORAGE_KEY = 'poker-trainer-settings';

// Card size options
const CARD_SIZES = ['small', 'medium', 'large'];

// Load persistent history from localStorage
const loadPersistentHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load history from localStorage:', e);
  }
  return [];
};

// Save history to localStorage
const savePersistentHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to localStorage:', e);
  }
};

// Load settings from localStorage
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return { speed: 'normal', cardSize: 'medium' };
};

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
};

export default function Quiz({ scenarios, blinds = { sb: 5, bb: 5 }, difficulty = 'medium', onBack }) {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentHand, setCurrentHand] = useState('');
  const [userAnswer, setUserAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [actions, setActions] = useState([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeroHighlight, setShowHeroHighlight] = useState(false);
  const [speed, setSpeed] = useState(() => loadSettings().speed);
  const [playerTypes, setPlayerTypes] = useState({});
  const [cardSize, setCardSize] = useState(() => loadSettings().cardSize);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [handHistory, setHandHistory] = useState([]); // Session history (recent 50 for display)
  const [nextToActPosition, setNextToActPosition] = useState(null);
  const [persistentHistory, setPersistentHistory] = useState(() => loadPersistentHistory());
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null); // For detail view
  const animationIdRef = useRef(0); // Track current animation to cancel stale ones
  const historyPanelRef = useRef(null); // Ref for click outside detection
  const settingsPanelRef = useRef(null); // Ref for click outside detection

  // Get a random scenario from the available ones
  const getRandomScenario = useCallback(() => {
    if (!scenarios || scenarios.length === 0) return null;
    const index = Math.floor(Math.random() * scenarios.length);
    return scenarios[index];
  }, [scenarios]);

  // Build action sequence and player types for the current scenario
  // Shows FULL hand action from UTG forward
  const buildActionSequence = useCallback((scenario) => {
    const actions = [];
    const types = {};
    const mapping = scenario;
    const heroPosition = mapping.positions[0];

    // Helper to add quick folds for positions
    const addFolds = (positions) => {
      positions.forEach(pos => {
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: true });
      });
    };

    // Set player types
    if (mapping.villainType && mapping.villain) {
      types[mapping.villain] = mapping.villainType;
    }
    if (mapping.villain2Type && mapping.villain2) {
      types[mapping.villain2] = mapping.villain2Type;
    }
    if (mapping.limperType && mapping.limper) {
      types[mapping.limper] = mapping.limperType;
    }
    if (mapping.limper2Type && mapping.limper2) {
      types[mapping.limper2] = mapping.limper2Type;
    }
    if (mapping.callerType && mapping.caller) {
      types[mapping.caller] = mapping.callerType;
    }

    // === OPEN RANGES: Hero opens ===
    if (mapping.category === 'open_ranges') {
      // Folds from UTG to hero
      addFolds(getPositionsBefore(heroPosition));

      // Handle limpers (they limp before hero opens)
      if (mapping.limper) {
        // Remove fold for limper position, add limp instead
        const limperIdx = actions.findIndex(a => a.position === mapping.limper);
        if (limperIdx >= 0) actions.splice(limperIdx, 1);
        actions.push({ position: mapping.limper, type: 'Limp', text: 'Limp' });
      }
      if (mapping.limper2) {
        const limperIdx = actions.findIndex(a => a.position === mapping.limper2);
        if (limperIdx >= 0) actions.splice(limperIdx, 1);
        actions.push({ position: mapping.limper2, type: 'Limp', text: 'Limp' });
      }

      // Hero raises (this is the decision the user makes, so don't add it to actions)
      // Actions end before hero's decision
    }

    // === VS OPEN RANGES: Villain opens, hero responds ===
    else if (mapping.category === 'vs_open_ranges') {
      // Folds from UTG to villain
      addFolds(getPositionsBefore(mapping.villain));

      // Villain opens
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // For squeeze: there's a caller between villain and hero
      if (mapping.caller) {
        // Folds between villain and caller
        addFolds(getPositionsBetween(mapping.villain, mapping.caller));
        // Caller calls
        actions.push({ position: mapping.caller, type: 'Call', text: 'Call' });
        // Folds between caller and hero
        addFolds(getPositionsBetween(mapping.caller, heroPosition));
      } else {
        // Folds from villain to hero
        addFolds(getPositionsBetween(mapping.villain, heroPosition));
      }

      // Hero acts (decision point - not added)
    }

    // === VS 3BET RANGES: Hero opened, villain 3bets ===
    else if (mapping.category === 'vs_3bet_ranges') {
      // Folds from UTG to hero (quick folds)
      addFolds(getPositionsBefore(heroPosition));

      // Hero opens
      actions.push({ position: heroPosition, type: 'Raise', text: 'Raise 2.5BB', isHeroAction: true });

      // Folds from hero to villain - show with pointer since they happen after hero's open
      const positionsBetween = getPositionsBetween(heroPosition, mapping.villain);
      positionsBetween.forEach(pos => {
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: false });
      });

      // Villain 3-bets
      actions.push({ position: mapping.villain, type: '3bet', text: '3-Bet 9BB' });

      // Hero acts (decision point - not added)
    }

    // === VS 4BET RANGES: Villain opened, hero 3bet, villain 4bets ===
    // Full sequence showing: folds to villain, villain opens, folds to hero (with pointer),
    // hero 3bets, villain 4bets, hero decides
    else if (mapping.category === 'vs_4bet_ranges') {
      // Folds from UTG to villain (quick folds)
      addFolds(getPositionsBefore(mapping.villain));

      // Villain opens
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // Important folds from villain to hero - these should show with pointer indicator
      // to help user understand the action flow
      const positionsBetween = getPositionsBetween(mapping.villain, heroPosition);
      positionsBetween.forEach(pos => {
        // Mark these as significant folds (not quick) since they happen after the open
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: false });
      });

      // Hero 3-bets
      actions.push({ position: heroPosition, type: '3bet', text: '3-Bet 9BB', isHeroAction: true });

      // Villain 4-bets (action goes directly back to original raiser)
      actions.push({ position: mapping.villain, type: '4bet', text: '4-Bet 22BB' });

      // Hero acts (decision point - not added)
    }

    // === COLD 4BET RANGES: V1 opens, V2 3bets, hero cold 4bets ===
    else if (mapping.category === 'cold_4bet_ranges') {
      // Folds from UTG to villain1
      addFolds(getPositionsBefore(mapping.villain));

      // Villain1 opens
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // Folds from villain1 to villain2
      addFolds(getPositionsBetween(mapping.villain, mapping.villain2));

      // Villain2 3-bets
      actions.push({ position: mapping.villain2, type: '3bet', text: '3-Bet 9BB' });

      // Folds from villain2 to hero
      addFolds(getPositionsBetween(mapping.villain2, heroPosition));

      // Hero acts (decision point - not added)
    }

    return { actions, types };
  }, []);

  // Animate actions in sequence with "next to act" indicator
  const animateActions = useCallback((actionsToAnimate, heroPosition, animationId) => {
    const speeds = SPEED_SETTINGS[speed];
    setIsAnimating(true);

    // Check if this animation is still current
    const isCurrentAnimation = () => animationIdRef.current === animationId;

    if (actionsToAnimate.length === 0) {
      // No villain actions - show indicator on hero then unlock
      setNextToActPosition(heroPosition);
      setTimeout(() => {
        if (!isCurrentAnimation()) return;
        setNextToActPosition(null);
        setIsAnimating(false);
        setShowHeroHighlight(true);
      }, speeds.point);
      return;
    }

    let index = 0;

    const showNextIndicator = () => {
      if (!isCurrentAnimation()) return; // Cancel if new animation started

      if (index < actionsToAnimate.length) {
        const nextAction = actionsToAnimate[index];

        // Quick folds: skip pointing indicator, just show fold quickly
        if (nextAction.isQuickFold) {
          setCurrentActionIndex(index);
          index++;
          setTimeout(showNextIndicator, speeds.quickFold);
          return;
        }

        // Show "next to act" indicator on the player about to act
        setNextToActPosition(nextAction.position);

        // After point delay, show the action
        setTimeout(() => {
          if (!isCurrentAnimation()) return;
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
          if (!isCurrentAnimation()) return;
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

    // Increment animation ID to cancel any pending animations
    animationIdRef.current += 1;
    const currentAnimationId = animationIdRef.current;

    setCurrentScenario(scenario);
    // Use smart hand selection - ensures fold hands are near the range boundary
    setCurrentHand(getSmartRandomHand(scenario.category, scenario.key, difficulty));
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
      // Only start animation if this is still the current animation
      if (animationIdRef.current === currentAnimationId) {
        animateActions(actionSequence, heroPosition, currentAnimationId);
      }
    }, speeds.initial / 2);
  }, [getRandomScenario, buildActionSequence, animateActions, speed]);

  // Initialize on mount or when scenarios change
  useEffect(() => {
    if (scenarios && scenarios.length > 0) {
      nextHand();
    }
  }, [scenarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings({ speed, cardSize });
  }, [speed, cardSize]);

  // Handle click outside to close panels
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHistory && historyPanelRef.current && !historyPanelRef.current.contains(e.target)) {
        // Check if click was on the history button itself
        if (!e.target.closest('.history-btn')) {
          setShowHistory(false);
          setSelectedHistoryIndex(null);
        }
      }
      if (showSettings && settingsPanelRef.current && !settingsPanelRef.current.contains(e.target)) {
        // Check if click was on the settings button itself
        if (!e.target.closest('.settings-btn')) {
          setShowSettings(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, showSettings]);

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

    // Create history entry with full details for analysis
    const historyEntry = {
      hand: currentHand,
      scenario: currentScenario.label,
      scenarioKey: currentScenario.key,
      category: currentScenario.category,
      heroPosition: currentScenario.positions[0],
      userAnswer: answer,
      correctAnswer: correct,
      isCorrect,
      timestamp: Date.now(),
      actions: [...actions] // Store the action sequence for hover display
    };

    // Record in session history (last 50 for display)
    setHandHistory(prev => [historyEntry, ...prev].slice(0, 50));

    // Save to persistent history (all entries)
    setPersistentHistory(prev => {
      const newHistory = [historyEntry, ...prev];
      savePersistentHistory(newHistory);
      return newHistory;
    });

    // Auto-advance after delay based on speed
    const speeds = SPEED_SETTINGS[speed];
    const feedbackTime = isCorrect ? speeds.feedback * 0.6 : speeds.feedback;
    setTimeout(nextHand, feedbackTime);
  };

  const getActionButtons = () => {
    if (!currentScenario) return [];

    // Order: Fold (left), Call (middle if applicable), Raise/Bet (right)
    const category = currentScenario.category;
    if (category === 'open_ranges') {
      return ['Fold', 'Raise'];
    } else if (category === 'vs_open_ranges') {
      return ['Fold', 'Call', '3bet'];
    } else if (category === 'vs_3bet_ranges' || category === 'cold_4bet_ranges') {
      return ['Fold', 'Call', '4bet'];
    } else if (category === 'vs_4bet_ranges') {
      return ['Fold', 'Call', '5bet'];
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
      'Raise': 'Raise',
      '3bet': '3-Bet',
      '4bet': '4-Bet',
      '5bet': '5-Bet',
      'Call': 'Call',
      'Fold': 'Fold'
    };
    return labels[action] || action;
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
        <button
          className="score-display"
          onClick={() => setShowHistory(!showHistory)}
          title="Hand History"
        >
          <span className="score">{score.correct}/{score.total} ({percentage}%)</span>
        </button>
        <div className="header-actions">
          <button
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <span className="hamburger-icon">☰</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel" ref={settingsPanelRef}>
          <div className="settings-panel-header">
            <h3>Settings</h3>
          </div>
          <div className="setting-group">
            <label className="setting-label">Speed</label>
            <div className="speed-buttons">
              <button
                className={`speed-btn ${speed === 'normal' ? 'active' : ''}`}
                onClick={() => setSpeed('normal')}
              >Normal</button>
              <button
                className={`speed-btn ${speed === 'fast' ? 'active' : ''}`}
                onClick={() => setSpeed('fast')}
              >Fast</button>
              <button
                className={`speed-btn ${speed === 'faster' ? 'active' : ''}`}
                onClick={() => setSpeed('faster')}
              >Faster</button>
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
        <div className="history-panel" ref={historyPanelRef}>
          <div className="history-panel-header">
            {selectedHistoryIndex !== null ? (
              <>
                <button
                  className="back-arrow-btn"
                  onClick={() => setSelectedHistoryIndex(null)}
                  title="Back to Recent Hands"
                >
                  ←
                </button>
                <h3>Hand Details</h3>
              </>
            ) : (
              <h3>Hand History</h3>
            )}
          </div>

          {selectedHistoryIndex !== null ? (
            // Detail view for selected hand
            <div className="history-detail-view">
              {(() => {
                const item = handHistory[selectedHistoryIndex];
                if (!item) return null;
                return (
                  <>
                    <div className="detail-hand-info">
                      <div className="detail-hand-display">
                        <HandDisplay hand={item.hand} size="small" />
                      </div>
                      <div className="detail-scenario">{item.scenario}</div>
                      <div className="detail-hero-position">You were: {item.heroPosition}</div>
                    </div>

                    <div className="detail-result-summary">
                      <span className={`detail-your-answer ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                        Your answer: {item.userAnswer}
                      </span>
                      {!item.isCorrect && (
                        <span className="detail-correct-answer">
                          Correct: {item.correctAnswer}
                        </span>
                      )}
                    </div>

                    <div className="detail-actions-header">Action Sequence</div>
                    <div className="detail-actions-list">
                      {item.actions && item.actions.map((action, actionIdx) => (
                        <div
                          key={actionIdx}
                          className={`detail-action-item ${action.isHeroAction ? 'hero-action' : ''} ${action.type.toLowerCase()}`}
                        >
                          <span className="detail-action-position">{action.position}</span>
                          <span className="detail-action-text">{action.text || action.type}</span>
                        </div>
                      ))}
                      <div className={`detail-action-item hero-action hero-decision ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                        <span className="detail-action-position">{item.heroPosition}</span>
                        <span className="detail-action-text">
                          {item.userAnswer}
                          {!item.isCorrect && <span className="should-be"> (should: {item.correctAnswer})</span>}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            // Recent hands list view
            <>
              {/* All-time stats from persistent history */}
              {persistentHistory.length > 0 && (
                <div className="history-stats">
                  <div className="stat-item">
                    <span className="stat-value">{persistentHistory.length}</span>
                    <span className="stat-label">Total Hands</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value correct">
                      {persistentHistory.filter(h => h.isCorrect).length}
                    </span>
                    <span className="stat-label">Correct</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value incorrect">
                      {persistentHistory.filter(h => !h.isCorrect).length}
                    </span>
                    <span className="stat-label">Mistakes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {Math.round((persistentHistory.filter(h => h.isCorrect).length / persistentHistory.length) * 100)}%
                    </span>
                    <span className="stat-label">Accuracy</span>
                  </div>
                </div>
              )}
              <div className="history-section-label">Recent Hands</div>
              {handHistory.length === 0 ? (
                <div className="history-empty">No hands played yet this session</div>
              ) : (
                <div className="history-list">
                  {handHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`history-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
                      onClick={() => setSelectedHistoryIndex(index)}
                    >
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
            </>
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
            <span className="btn-label">{getButtonLabel(action)}</span>
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
