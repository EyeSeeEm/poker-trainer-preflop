import React, { useState, useEffect, useCallback } from 'react';
import HandDisplay from './HandDisplay';
import PokerTable from './PokerTable';
import { getSmartRandomHand } from '../utils/smartHandSelection';
import { getCorrectAction } from '../utils/rangeLogic';
import { SCENARIO_MAPPINGS } from './Settings';
import './Quiz.css';

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

  // Get a random scenario from the available ones
  const getRandomScenario = useCallback(() => {
    if (!scenarios || scenarios.length === 0) return null;
    const index = Math.floor(Math.random() * scenarios.length);
    return scenarios[index];
  }, [scenarios]);

  // Build action sequence for the current scenario
  const buildActionSequence = useCallback((scenario) => {
    const actions = [];
    const mapping = scenario;

    // Add villain actions based on scenario type
    if (mapping.villain) {
      if (mapping.villainAction === 'open') {
        actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise 2.5BB' });
      } else if (mapping.villainAction === '3bet') {
        actions.push({ position: mapping.villain, type: '3bet', text: '3-Bet' });
      } else if (mapping.villainAction === '4bet') {
        actions.push({ position: mapping.villain, type: '4bet', text: '4-Bet' });
      }
    }

    // Add second villain for cold 4bet scenarios
    if (mapping.villain2) {
      actions.push({ position: mapping.villain2, type: mapping.villain2Action, text: mapping.villain2Action === '3bet' ? '3-Bet' : mapping.villain2Action });
    }

    // Add caller for squeeze scenarios
    if (mapping.caller) {
      actions.push({ position: mapping.caller, type: 'Call', text: 'Call' });
    }

    return actions;
  }, []);

  // Animate actions in sequence
  const animateActions = useCallback((actionsToAnimate) => {
    if (actionsToAnimate.length === 0) {
      setIsAnimating(false);
      setShowHeroHighlight(true);
      return;
    }

    setIsAnimating(true);
    let index = 0;

    const animateNext = () => {
      if (index < actionsToAnimate.length) {
        setCurrentActionIndex(index);
        const delay = actionsToAnimate[index].type === 'Fold' ? 300 :
                      actionsToAnimate[index].type === 'Call' ? 500 : 800;
        index++;
        setTimeout(animateNext, delay);
      } else {
        setIsAnimating(false);
        setShowHeroHighlight(true);
      }
    };

    setTimeout(animateNext, 500); // Initial delay before animation starts
  }, []);

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

    const actionSequence = buildActionSequence(scenario);
    setActions(actionSequence);

    // Start animation after a short delay
    setTimeout(() => {
      animateActions(actionSequence);
    }, 300);
  }, [getRandomScenario, buildActionSequence, animateActions]);

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

    // Auto-advance after delay
    setTimeout(nextHand, isCorrect ? 1200 : 2000);
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
        <div className="score-display">
          <span className="score">{score.correct}/{score.total} ({percentage}%)</span>
          <span className={`streak ${streak >= 5 ? 'hot' : ''}`}>
            🔥 {streak}
          </span>
        </div>
      </div>

      <div className="scenario-label">{currentScenario.label}</div>

      <PokerTable
        heroPosition={getHeroPosition()}
        dealerPosition={getDealerPosition()}
        actions={actions}
        currentActionIndex={currentActionIndex}
        showHeroHighlight={showHeroHighlight && userAnswer === null}
        blinds={blinds}
      />

      <div className="situation-description">
        {getSituationDescription()}
      </div>

      <HandDisplay hand={currentHand} />

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
