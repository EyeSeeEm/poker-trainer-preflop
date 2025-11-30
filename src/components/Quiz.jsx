import React, { useState, useEffect, useCallback, useRef } from 'react';
import HandDisplay from './HandDisplay';
import PokerTable from './PokerTable';
import HandChart from './HandChart';
import { getSmartRandomHand } from '../utils/smartHandSelection';
import { getCorrectAction, isAnswerCorrect, getCorrectActionDisplay } from '../utils/rangeLogic';
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
const HISTORY_OVERVIEW_KEY = 'poker-trainer-hh-overview';
const HISTORY_HAND_PREFIX = 'poker-trainer-hh-';
const SETTINGS_STORAGE_KEY = 'poker-trainer-settings';
const OLD_HISTORY_KEY = 'poker-trainer-history'; // For migration

// Card size options
const CARD_SIZES = ['small', 'medium', 'large'];

// Number of recent hands to show in overview
const RECENT_HANDS_LIMIT = 5;

// Minimum hands required for analysis
const ANALYSIS_THRESHOLD = 20;

// Overview structure: { totalHands, correct, incorrect, recentHandIds: [id1, id2, ...], nextHandId, lastAnalysisHandId }
const getDefaultOverview = () => ({
  totalHands: 0,
  correct: 0,
  incorrect: 0,
  recentHandIds: [], // Last 5 hand IDs for quick display
  nextHandId: 1,
  lastAnalysisHandId: 0 // Track when last analysis was done
});

// Load HH overview (stats + recent hand IDs)
const loadHistoryOverview = () => {
  try {
    const stored = localStorage.getItem(HISTORY_OVERVIEW_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure lastAnalysisHandId exists (for backwards compatibility)
      if (parsed.lastAnalysisHandId === undefined) {
        parsed.lastAnalysisHandId = 0;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load HH overview:', e);
  }
  return getDefaultOverview();
};

// Save HH overview
const saveHistoryOverview = (overview) => {
  try {
    localStorage.setItem(HISTORY_OVERVIEW_KEY, JSON.stringify(overview));
  } catch (e) {
    console.error('Failed to save HH overview:', e);
  }
};

// Load a single hand by ID
const loadHandById = (handId) => {
  try {
    const stored = localStorage.getItem(HISTORY_HAND_PREFIX + handId);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load hand:', handId, e);
  }
  return null;
};

// Save a single hand
const saveHand = (handId, handData) => {
  try {
    localStorage.setItem(HISTORY_HAND_PREFIX + handId, JSON.stringify(handData));
  } catch (e) {
    console.error('Failed to save hand:', handId, e);
  }
};

// Load recent hands for display (only the last 5)
const loadRecentHands = (overview) => {
  const hands = [];
  for (const handId of overview.recentHandIds) {
    const hand = loadHandById(handId);
    if (hand) {
      hands.push({ ...hand, id: handId });
    }
  }
  return hands;
};

// Add a new hand to history
const addHandToHistory = (handData) => {
  const overview = loadHistoryOverview();
  const handId = overview.nextHandId;

  // Save the individual hand
  saveHand(handId, handData);

  // Update overview
  overview.totalHands++;
  if (handData.isCorrect) {
    overview.correct++;
  } else {
    overview.incorrect++;
  }

  // Add to recent hands (keep only last 5 IDs)
  overview.recentHandIds.unshift(handId);
  if (overview.recentHandIds.length > RECENT_HANDS_LIMIT) {
    overview.recentHandIds = overview.recentHandIds.slice(0, RECENT_HANDS_LIMIT);
  }

  overview.nextHandId++;
  saveHistoryOverview(overview);

  return { handId, overview };
};

// Clear all history
const clearAllHistory = () => {
  // Get current overview to find all hand IDs we need to delete
  const overview = loadHistoryOverview();

  // Delete all individual hands (we only track recent ones, but try to clean up)
  for (let i = 1; i < overview.nextHandId; i++) {
    localStorage.removeItem(HISTORY_HAND_PREFIX + i);
  }

  // Reset overview
  saveHistoryOverview(getDefaultOverview());
};

// Load hands since last analysis for leak detection
const loadHandsForAnalysis = (overview) => {
  const hands = [];
  const startId = (overview.lastAnalysisHandId || 0) + 1;
  const endId = overview.nextHandId;

  for (let i = startId; i < endId; i++) {
    const hand = loadHandById(i);
    if (hand) {
      hands.push({ ...hand, id: i });
    }
  }
  return hands;
};

// Analyze hands to find leaks - returns stats grouped by scenario and category
const analyzeLeaks = (hands) => {
  if (!hands || hands.length === 0) return null;

  // Group by scenario
  const scenarioStats = {};
  const categoryStats = {};

  hands.forEach(hand => {
    // By scenario
    const scenarioKey = hand.scenarioKey || hand.scenario;
    if (!scenarioStats[scenarioKey]) {
      scenarioStats[scenarioKey] = {
        label: hand.scenario,
        total: 0,
        correct: 0,
        incorrect: 0,
        mistakes: []
      };
    }
    scenarioStats[scenarioKey].total++;
    if (hand.isCorrect) {
      scenarioStats[scenarioKey].correct++;
    } else {
      scenarioStats[scenarioKey].incorrect++;
      // Store full hand data for detail view
      scenarioStats[scenarioKey].mistakes.push(hand);
    }

    // By category
    const category = hand.category || 'unknown';
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, correct: 0, incorrect: 0 };
    }
    categoryStats[category].total++;
    if (hand.isCorrect) {
      categoryStats[category].correct++;
    } else {
      categoryStats[category].incorrect++;
    }
  });

  // Sort scenarios by error rate (worst first)
  const sortedScenarios = Object.entries(scenarioStats)
    .map(([key, stats]) => ({
      key,
      ...stats,
      errorRate: stats.total > 0 ? (stats.incorrect / stats.total) * 100 : 0
    }))
    .filter(s => s.total >= 3) // Only show scenarios with enough data
    .sort((a, b) => b.errorRate - a.errorRate);

  // Overall stats
  const totalHands = hands.length;
  const totalCorrect = hands.filter(h => h.isCorrect).length;
  const totalIncorrect = totalHands - totalCorrect;
  const overallAccuracy = totalHands > 0 ? (totalCorrect / totalHands) * 100 : 0;

  return {
    totalHands,
    totalCorrect,
    totalIncorrect,
    overallAccuracy,
    scenarios: sortedScenarios,
    categories: categoryStats
  };
};

// Mark analysis as done (update lastAnalysisHandId)
const markAnalysisDone = (overview) => {
  const updatedOverview = {
    ...overview,
    lastAnalysisHandId: overview.nextHandId - 1
  };
  saveHistoryOverview(updatedOverview);
  return updatedOverview;
};

// Migrate from old format to new format
const migrateOldHistory = () => {
  try {
    const oldData = localStorage.getItem(OLD_HISTORY_KEY);
    if (!oldData) return false;

    const oldHistory = JSON.parse(oldData);
    if (!Array.isArray(oldHistory) || oldHistory.length === 0) {
      localStorage.removeItem(OLD_HISTORY_KEY);
      return false;
    }

    // Check if we already migrated
    const existingOverview = loadHistoryOverview();
    if (existingOverview.totalHands > 0) {
      // Already have new data, just remove old
      localStorage.removeItem(OLD_HISTORY_KEY);
      return false;
    }

    // Migrate: old history is newest-first, we want to preserve that order
    let overview = getDefaultOverview();

    // Process all hands (oldest to newest for correct ID assignment)
    const reversedHistory = [...oldHistory].reverse();
    for (const hand of reversedHistory) {
      const handId = overview.nextHandId;
      saveHand(handId, hand);

      overview.totalHands++;
      if (hand.isCorrect) {
        overview.correct++;
      } else {
        overview.incorrect++;
      }
      overview.nextHandId++;
    }

    // Set recent hand IDs (last 5, newest first)
    const totalHands = overview.nextHandId - 1;
    for (let i = totalHands; i > Math.max(0, totalHands - RECENT_HANDS_LIMIT); i--) {
      overview.recentHandIds.push(i);
    }

    saveHistoryOverview(overview);
    localStorage.removeItem(OLD_HISTORY_KEY);

    console.log(`Migrated ${oldHistory.length} hands to new format`);
    return true;
  } catch (e) {
    console.error('Failed to migrate old history:', e);
    return false;
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
  return { speed: 'normal', cardSize: 'medium', chipStyle: 'default', playerColors: 'type' };
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
  const [chipStyle, setChipStyle] = useState(() => loadSettings().chipStyle || 'default');
  const [playerColors, setPlayerColors] = useState(() => loadSettings().playerColors || 'type');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyOverview, setHistoryOverview] = useState(() => {
    migrateOldHistory(); // Migrate old data if exists
    return loadHistoryOverview();
  });
  const [recentHands, setRecentHands] = useState(() => loadRecentHands(loadHistoryOverview()));
  const [nextToActPosition, setNextToActPosition] = useState(null);
  const [selectedHandId, setSelectedHandId] = useState(null); // For detail view - now stores hand ID
  const [selectedHandData, setSelectedHandData] = useState(null); // Loaded hand data for detail view
  const [clearConfirmPending, setClearConfirmPending] = useState(false); // Two-click clear confirmation
  const [detailViewMode, setDetailViewMode] = useState('visual'); // 'visual' or 'text'
  const [copySuccess, setCopySuccess] = useState(false);
  const [showHandChart, setShowHandChart] = useState(false); // Show hand chart cheat sheet
  const [showHHHandChart, setShowHHHandChart] = useState(false); // Show hand chart in HH detail
  const [showAnalysis, setShowAnalysis] = useState(false); // Show analysis panel
  const [analysisData, setAnalysisData] = useState(null); // Cached analysis results
  const [selectedLeakScenario, setSelectedLeakScenario] = useState(null); // Selected scenario in leak analysis
  const [selectedMistakeIndex, setSelectedMistakeIndex] = useState(null); // Selected mistake index within scenario
  const [showAnalysisHandChart, setShowAnalysisHandChart] = useState(false); // Show hand chart in analysis detail
  const animationIdRef = useRef(0); // Track current animation to cancel stale ones
  const historyPanelRef = useRef(null); // Ref for click outside detection
  const settingsPanelRef = useRef(null); // Ref for click outside detection
  const handChartRef = useRef(null); // Ref for hand chart click outside detection
  const hhHandChartRef = useRef(null); // Ref for HH hand chart click outside detection
  const analysisPanelRef = useRef(null); // Ref for analysis panel click outside detection

  // Calculate hands since last analysis
  const handsSinceLastAnalysis = (historyOverview.nextHandId - 1) - (historyOverview.lastAnalysisHandId || 0);
  const canAnalyze = handsSinceLastAnalysis >= ANALYSIS_THRESHOLD;

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
    // Fish in blinds
    if (mapping.sbType) {
      types['SB'] = mapping.sbType;
    }
    if (mapping.bbType) {
      types['BB'] = mapping.bbType;
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
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise' });

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
      actions.push({ position: heroPosition, type: 'Raise', text: 'Raise', isHeroAction: true });

      // Folds from hero to villain - show with pointer since they happen after hero's open
      const positionsBetween = getPositionsBetween(heroPosition, mapping.villain);
      positionsBetween.forEach(pos => {
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: false });
      });

      // Villain 3-bets
      actions.push({ position: mapping.villain, type: '3bet', text: '3-Bet' });

      // Hero acts (decision point - not added)
    }

    // === VS 4BET RANGES: Villain opened, hero 3bet, villain 4bets ===
    // Full sequence showing: folds to villain, villain opens, folds to hero (with pointer),
    // hero 3bets, villain 4bets, hero decides
    else if (mapping.category === 'vs_4bet_ranges') {
      // Folds from UTG to villain (quick folds)
      addFolds(getPositionsBefore(mapping.villain));

      // Villain opens
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise' });

      // Important folds from villain to hero - these should show with pointer indicator
      // to help user understand the action flow
      const positionsBetween = getPositionsBetween(mapping.villain, heroPosition);
      positionsBetween.forEach(pos => {
        // Mark these as significant folds (not quick) since they happen after the open
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: false });
      });

      // Hero 3-bets
      actions.push({ position: heroPosition, type: '3bet', text: '3-Bet', isHeroAction: true });

      // Villain 4-bets (action goes directly back to original raiser)
      actions.push({ position: mapping.villain, type: '4bet', text: '4-Bet' });

      // Hero acts (decision point - not added)
    }

    // === COLD 4BET RANGES: V1 opens, V2 3bets, hero cold 4bets ===
    else if (mapping.category === 'cold_4bet_ranges') {
      // Folds from UTG to villain1
      addFolds(getPositionsBefore(mapping.villain));

      // Villain1 opens
      actions.push({ position: mapping.villain, type: 'Raise', text: 'Raise' });

      // Folds from villain1 to villain2
      addFolds(getPositionsBetween(mapping.villain, mapping.villain2));

      // Villain2 3-bets
      actions.push({ position: mapping.villain2, type: '3bet', text: '3-Bet' });

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
    setShowHandChart(false);

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
    saveSettings({ speed, cardSize, chipStyle, playerColors });
  }, [speed, cardSize, chipStyle, playerColors]);

  // Handle click outside to close panels
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHistory && historyPanelRef.current && !historyPanelRef.current.contains(e.target)) {
        // Check if click was on the score-display button itself
        if (!e.target.closest('.score-display')) {
          setShowHistory(false);
          setSelectedHandId(null);
          setSelectedHandData(null);
        }
      }
      if (showSettings && settingsPanelRef.current && !settingsPanelRef.current.contains(e.target)) {
        // Check if click was on the settings button itself
        if (!e.target.closest('.settings-btn')) {
          setShowSettings(false);
        }
      }
      // Close hand chart when clicking outside
      if (showHandChart && handChartRef.current && !handChartRef.current.contains(e.target)) {
        if (!e.target.closest('.scenario-label.clickable')) {
          setShowHandChart(false);
        }
      }
      // Close HH hand chart when clicking outside
      if (showHHHandChart && hhHandChartRef.current && !hhHandChartRef.current.contains(e.target)) {
        if (!e.target.closest('.detail-scenario.clickable')) {
          setShowHHHandChart(false);
        }
      }
      // Close analysis panel when clicking outside
      if (showAnalysis && analysisPanelRef.current && !analysisPanelRef.current.contains(e.target)) {
        if (!e.target.closest('.analysis-btn')) {
          setShowAnalysis(false);
          setSelectedLeakScenario(null);
          setSelectedMistakeIndex(null);
          setShowAnalysisHandChart(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, showSettings, showHandChart, showHHHandChart, showAnalysis]);

  const handleAnswer = (answer) => {
    if (userAnswer !== null || isAnimating || !showHeroHighlight) return;

    // Use new API that handles mixed actions
    const isCorrect = isAnswerCorrect(answer, currentHand, currentScenario.category, currentScenario.key);
    const correctDisplay = getCorrectActionDisplay(currentHand, currentScenario.category, currentScenario.key);

    setCorrectAnswer(correctDisplay);
    setUserAnswer(answer);

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
      correctAnswer: correctDisplay,
      isCorrect,
      timestamp: Date.now(),
      actions: [...actions], // Store the action sequence for hover display
      playerTypes: { ...playerTypes } // Store player types for display
    };

    // Save to new storage system (individual hand + update overview)
    const { handId, overview } = addHandToHistory(historyEntry);
    setHistoryOverview(overview);
    // Update recent hands list (add new hand to front, keep max 5)
    setRecentHands(prev => {
      const newRecent = [{ ...historyEntry, id: handId }, ...prev];
      return newRecent.slice(0, RECENT_HANDS_LIMIT);
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

    // correctAnswer may be "Call/3bet" for mixed hands, so check if action is part of it
    const isCorrectAction = correctAnswer && correctAnswer.split('/').includes(action);

    if (isCorrectAction) {
      return base + ' correct';
    }
    if (action === userAnswer && !isCorrectAction) {
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

  // Generate simplified plaintext hand history
  const generatePlaintextHH = (item) => {
    if (!item) return '';

    const bb = blinds.bb;
    const lines = [];

    // Header
    lines.push(`Scenario: ${item.scenario}`);
    lines.push(`Blinds: $${blinds.sb}/$${blinds.bb}`);
    lines.push(`Hero: ${item.heroPosition} with ${item.hand}`);
    lines.push('');
    lines.push('--- Preflop ---');

    // Actions with dollar amounts
    if (item.actions) {
      item.actions.forEach(action => {
        const pType = item.playerTypes?.[action.position];
        const typeStr = pType ? ` (${pType})` : '';

        // Convert action to simple text
        let actionText = action.text || action.type;
        if (action.type === 'Raise' || action.type === 'open') {
          actionText = 'Raise';
        } else if (action.type === '3bet') {
          actionText = '3-Bet';
        } else if (action.type === '4bet') {
          actionText = '4-Bet';
        } else if (action.type === 'Call') {
          actionText = 'Call';
        } else if (action.type === 'Limp') {
          actionText = 'Limp';
        }

        lines.push(`${action.position}${typeStr}: ${actionText}`);
      });
    }

    // Hero's decision
    lines.push(`${item.heroPosition} (Hero): ${item.userAnswer}`);

    // Result
    lines.push('');
    if (item.isCorrect) {
      lines.push('Result: CORRECT');
    } else {
      lines.push(`Result: INCORRECT (should be ${item.correctAnswer})`);
    }

    return lines.join('\n');
  };

  // Copy plaintext HH to clipboard
  const copyHandHistory = async (item) => {
    const text = generatePlaintextHH(item);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!currentScenario) {
    return <div className="quiz loading">Loading...</div>;
  }

  return (
    <div className={`quiz ${userAnswer !== null ? (correctAnswer && correctAnswer.split('/').includes(userAnswer) ? 'result-correct' : 'result-incorrect') : ''}`}>
      <div className="quiz-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack} title="Back to Menu">
            ⌂
          </button>
        </div>
        <button
          className="score-display"
          onClick={() => {
            if (!showHistory) {
              setSelectedHandId(null); // Reset to overview when opening
              setSelectedHandData(null);
            }
            setShowHistory(!showHistory);
          }}
          title="Hand History"
        >
          <span className="score">{score.correct}/{score.total} ({percentage}%)</span>
        </button>
        <div className="header-actions">
          <button
            className={`analysis-btn ${canAnalyze ? 'ready' : 'disabled'}`}
            onClick={() => {
              if (canAnalyze) {
                // Load and analyze hands
                const hands = loadHandsForAnalysis(historyOverview);
                const analysis = analyzeLeaks(hands);
                setAnalysisData(analysis);
                setSelectedLeakScenario(null); // Reset drill-down state
                setSelectedMistakeIndex(null);
                setShowAnalysisHandChart(false);
                setShowAnalysis(!showAnalysis);
              }
            }}
            disabled={!canAnalyze}
            title={canAnalyze ? 'View Leak Analysis' : `Play ${ANALYSIS_THRESHOLD - handsSinceLastAnalysis} more hands to unlock analysis`}
          >
            <span className="analysis-icon">📊</span>
            {canAnalyze && <span className="analysis-badge">{handsSinceLastAnalysis}</span>}
          </button>
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
          <div className="setting-group">
            <label className="setting-label">Chip Style</label>
            <div className="chip-style-buttons">
              <button
                className={`chip-style-btn ${chipStyle === 'default' ? 'active' : ''}`}
                onClick={() => setChipStyle('default')}
              >Default</button>
              <button
                className={`chip-style-btn ${chipStyle === 'berlin' ? 'active' : ''}`}
                onClick={() => setChipStyle('berlin')}
              >Berlin</button>
            </div>
          </div>
          <div className="setting-group">
            <label className="setting-label">Player Colors</label>
            <div className="player-colors-buttons">
              <button
                className={`player-colors-btn ${playerColors === 'type' ? 'active' : ''}`}
                onClick={() => setPlayerColors('type')}
              >By Type</button>
              <button
                className={`player-colors-btn ${playerColors === 'off' ? 'active' : ''}`}
                onClick={() => setPlayerColors('off')}
              >Off</button>
            </div>
          </div>
          <div className="setting-group setting-group-danger">
            <label className="setting-label">Hand History</label>
            <button
              className={`clear-history-btn ${clearConfirmPending ? 'confirm' : ''}`}
              onClick={() => {
                if (clearConfirmPending) {
                  // Second click - actually clear
                  clearAllHistory();
                  setHistoryOverview(getDefaultOverview());
                  setRecentHands([]);
                  setClearConfirmPending(false);
                  setScore({ correct: 0, total: 0 });
                } else {
                  // First click - ask for confirmation
                  setClearConfirmPending(true);
                  // Auto-reset after 3 seconds if not confirmed
                  setTimeout(() => setClearConfirmPending(false), 3000);
                }
              }}
            >
              {clearConfirmPending ? 'Click again to confirm' : 'Clear Hand History'}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Panel */}
      {showAnalysis && analysisData && (
        <div className="analysis-panel" ref={analysisPanelRef}>
          <div className="analysis-panel-header">
            {selectedLeakScenario !== null ? (
              selectedMistakeIndex !== null ? (
                // Mistake detail view header
                <>
                  <button
                    className="close-panel-btn"
                    onClick={() => {
                      setSelectedMistakeIndex(null);
                      setShowAnalysisHandChart(false);
                    }}
                    title="Back to Mistakes"
                  >
                    ↩
                  </button>
                  <div className="detail-nav-group">
                    <button
                      className="nav-arrow-btn prev"
                      onClick={() => {
                        if (selectedMistakeIndex > 0) {
                          setSelectedMistakeIndex(selectedMistakeIndex - 1);
                          setShowAnalysisHandChart(false);
                        }
                      }}
                      disabled={selectedMistakeIndex <= 0}
                      title="Previous Mistake"
                    >
                      ←
                    </button>
                    <h3>Mistake {selectedMistakeIndex + 1}/{selectedLeakScenario.mistakes.length}</h3>
                    <button
                      className="nav-arrow-btn next"
                      onClick={() => {
                        if (selectedMistakeIndex < selectedLeakScenario.mistakes.length - 1) {
                          setSelectedMistakeIndex(selectedMistakeIndex + 1);
                          setShowAnalysisHandChart(false);
                        }
                      }}
                      disabled={selectedMistakeIndex >= selectedLeakScenario.mistakes.length - 1}
                      title="Next Mistake"
                    >
                      →
                    </button>
                  </div>
                  <button className="close-panel-btn" style={{ visibility: 'hidden' }}>↩</button>
                </>
              ) : (
                // Scenario mistakes list header
                <>
                  <button
                    className="close-panel-btn"
                    onClick={() => setSelectedLeakScenario(null)}
                    title="Back to Analysis"
                  >
                    ↩
                  </button>
                  <h3>{selectedLeakScenario.label}</h3>
                  <div className="header-spacer"></div>
                </>
              )
            ) : (
              // Overview header
              <>
                <button
                  className="close-panel-btn"
                  onClick={() => {
                    setShowAnalysis(false);
                    setSelectedLeakScenario(null);
                    setSelectedMistakeIndex(null);
                    setShowAnalysisHandChart(false);
                  }}
                  title="Close Analysis"
                >
                  ×
                </button>
                <h3>Leak Analysis</h3>
                <div className="header-spacer"></div>
              </>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="analysis-content">
            {selectedLeakScenario !== null ? (
              selectedMistakeIndex !== null ? (
                // Mistake detail view - shows full hand like HH detail
                (() => {
                  const item = selectedLeakScenario.mistakes[selectedMistakeIndex];
                  if (!item) return null;
                  return (
                    <div className="history-detail-view">
                      <div className="detail-hand-info">
                        <div className="detail-hand-display">
                          <HandDisplay hand={item.hand} size="mini" />
                        </div>
                        <div className="scenario-label-wrapper detail-scenario-wrapper">
                          <div
                            className="detail-scenario clickable"
                            onClick={() => setShowAnalysisHandChart(!showAnalysisHandChart)}
                          >
                            {item.scenario}
                          </div>
                          {showAnalysisHandChart && (
                            <div className="hand-chart-tooltip visible">
                              <HandChart
                                category={item.category}
                                scenarioKey={item.scenarioKey}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="detail-result-summary">
                        <span className="detail-your-answer incorrect">
                          Your answer: {item.userAnswer}
                        </span>
                        <span className="detail-correct-answer">
                          Correct: {item.correctAnswer}
                        </span>
                      </div>

                      <div className="detail-actions-header">Action Sequence</div>
                      <div className="detail-actions-list">
                        {item.actions && item.actions.map((action, actionIdx) => {
                          const pType = item.playerTypes?.[action.position];
                          return (
                            <div
                              key={actionIdx}
                              className={`detail-action-item ${action.isHeroAction ? 'hero-action' : ''} ${action.type.toLowerCase()}`}
                            >
                              <span className="detail-action-position">{action.position}</span>
                              <span className={`detail-action-player-type ${pType ? `player-type-${pType}` : ''}`}>
                                {pType ? pType.toUpperCase() : ''}
                              </span>
                              <span className="detail-action-text">{action.text || action.type}</span>
                            </div>
                          );
                        })}
                        <div className="detail-action-item hero-action hero-decision incorrect">
                          <span className="detail-action-position">{item.heroPosition}</span>
                          <span className="detail-action-player-type"></span>
                          <span className="detail-action-text">
                            {item.userAnswer}
                            <span className="result-icon incorrect">✗</span>
                            <span className="should-be">(should: {item.correctAnswer})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Scenario mistakes list view
                <div className="analysis-mistakes-list">
                  <div className="analysis-scenario-summary">
                    <span className="summary-error-rate">
                      {selectedLeakScenario.errorRate.toFixed(0)}% error rate
                    </span>
                    <span className="summary-stats">
                      {selectedLeakScenario.incorrect} mistakes out of {selectedLeakScenario.total} hands
                    </span>
                  </div>
                  <div className="analysis-section-label">Mistakes</div>
                  {selectedLeakScenario.mistakes.map((mistake, idx) => (
                    <div
                      key={idx}
                      className="analysis-mistake-item"
                      onClick={() => setSelectedMistakeIndex(idx)}
                    >
                      <div className="mistake-hand">
                        <HandDisplay hand={mistake.hand} size="mini" />
                      </div>
                      <div className="mistake-details">
                        <span className="mistake-user-answer">{mistake.userAnswer}</span>
                        <span className="mistake-arrow">→</span>
                        <span className="mistake-correct-answer">{mistake.correctAnswer}</span>
                      </div>
                      <span className="mistake-chevron">›</span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Overview view
              <>
                {/* Overall stats */}
                <div className="analysis-overview">
                  <div className="analysis-stat">
                    <span className="analysis-stat-value">{analysisData.totalHands}</span>
                    <span className="analysis-stat-label">Hands Analyzed</span>
                  </div>
                  <div className="analysis-stat">
                    <span className="analysis-stat-value correct">{analysisData.overallAccuracy.toFixed(0)}%</span>
                    <span className="analysis-stat-label">Accuracy</span>
                  </div>
                  <div className="analysis-stat">
                    <span className="analysis-stat-value incorrect">{analysisData.totalIncorrect}</span>
                    <span className="analysis-stat-label">Mistakes</span>
                  </div>
                </div>

                {/* Leaks by scenario */}
                <div className="analysis-section">
                  <h4>Scenarios to Work On</h4>
                  {analysisData.scenarios.length === 0 ? (
                    <div className="analysis-empty">Not enough data per scenario yet</div>
                  ) : (
                    <div className="analysis-leaks-list">
                      {analysisData.scenarios.slice(0, 5).map((scenario, idx) => (
                        <div
                          key={scenario.key}
                          className={`analysis-leak-item clickable ${scenario.errorRate > 30 ? 'high-error' : scenario.errorRate > 15 ? 'medium-error' : 'low-error'}`}
                          onClick={() => setSelectedLeakScenario(scenario)}
                        >
                          <div className="leak-rank">{idx + 1}</div>
                          <div className="leak-info">
                            <span className="leak-scenario">{scenario.label}</span>
                            <span className="leak-stats">
                              {scenario.incorrect}/{scenario.total} wrong ({scenario.errorRate.toFixed(0)}% error rate)
                            </span>
                          </div>
                          <div className="leak-indicator">
                            {scenario.errorRate > 30 ? '🔴' : scenario.errorRate > 15 ? '🟡' : '🟢'}
                          </div>
                          <span className="leak-chevron">›</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mark as reviewed button - only visible in overview */}
          {selectedLeakScenario === null && (
            <button
              className="analysis-done-btn"
              onClick={() => {
                const updatedOverview = markAnalysisDone(historyOverview);
                setHistoryOverview(updatedOverview);
                setShowAnalysis(false);
                setAnalysisData(null);
              }}
            >
              Mark as Reviewed
            </button>
          )}
        </div>
      )}

      {/* Hand History Panel */}
      {showHistory && (
        <div className="history-panel" ref={historyPanelRef}>
          <div className="history-panel-header">
            {selectedHandId !== null ? (
              <>
                <button
                  className="close-detail-btn"
                  onClick={() => { setSelectedHandId(null); setSelectedHandData(null); }}
                  title="Back to Hand History"
                >
                  ↩
                </button>
                <div className="detail-nav-group">
                  <button
                    className="nav-arrow-btn prev"
                    onClick={() => {
                      // Navigate to newer hand (higher ID)
                      const newId = selectedHandId + 1;
                      if (newId < historyOverview.nextHandId) {
                        const data = loadHandById(newId);
                        if (data) {
                          setSelectedHandId(newId);
                          setSelectedHandData(data);
                          setShowHHHandChart(false);
                        }
                      }
                    }}
                    disabled={selectedHandId >= historyOverview.nextHandId - 1}
                    title="Next Hand (Newer)"
                  >
                    ←
                  </button>
                  <h3>Hand Details</h3>
                  <button
                    className="nav-arrow-btn next"
                    onClick={() => {
                      // Navigate to older hand (lower ID)
                      const newId = selectedHandId - 1;
                      if (newId >= 1) {
                        const data = loadHandById(newId);
                        if (data) {
                          setSelectedHandId(newId);
                          setSelectedHandData(data);
                          setShowHHHandChart(false);
                        }
                      }
                    }}
                    disabled={selectedHandId <= 1}
                    title="Previous Hand (Older)"
                  >
                    →
                  </button>
                </div>
                <button className="close-detail-btn" style={{ visibility: 'hidden' }}>↩</button>
              </>
            ) : (
              <>
                <button
                  className="close-panel-btn"
                  onClick={() => setShowHistory(false)}
                  title="Close Hand History"
                >
                  ×
                </button>
                <h3>Hand History</h3>
                <div className="header-spacer"></div>
              </>
            )}
          </div>

          {selectedHandId !== null && selectedHandData ? (
            // Detail view for selected hand
            <div className="history-detail-view">
              {(() => {
                const item = selectedHandData;
                return (
                  <>
                    <div className="detail-hand-info">
                      <div className="detail-hand-display">
                        <HandDisplay hand={item.hand} size="mini" />
                      </div>
                      <div className="scenario-label-wrapper detail-scenario-wrapper">
                        <div
                          className="detail-scenario clickable"
                          onClick={() => setShowHHHandChart(!showHHHandChart)}
                        >
                          {item.scenario}
                        </div>
                        {showHHHandChart && (
                          <div className="hand-chart-tooltip visible" ref={hhHandChartRef}>
                            <HandChart
                              category={item.category}
                              scenarioKey={item.scenarioKey}
                            />
                          </div>
                        )}
                      </div>
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

                    <div className="detail-view-controls">
                      <div className="detail-view-toggle">
                        <button
                          className={`toggle-btn ${detailViewMode === 'visual' ? 'active' : ''}`}
                          onClick={() => setDetailViewMode('visual')}
                        >
                          Visual
                        </button>
                        <button
                          className={`toggle-btn ${detailViewMode === 'text' ? 'active' : ''}`}
                          onClick={() => setDetailViewMode('text')}
                        >
                          Text
                        </button>
                      </div>
                      <button
                        className={`copy-btn ${copySuccess ? 'success' : ''}`}
                        onClick={() => copyHandHistory(item)}
                      >
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {detailViewMode === 'visual' ? (
                      <>
                        <div className="detail-actions-header">Action Sequence</div>
                        <div className="detail-actions-list">
                          {item.actions && item.actions.map((action, actionIdx) => {
                            const pType = item.playerTypes?.[action.position];
                            return (
                              <div
                                key={actionIdx}
                                className={`detail-action-item ${action.isHeroAction ? 'hero-action' : ''} ${action.type.toLowerCase()}`}
                              >
                                <span className="detail-action-position">{action.position}</span>
                                <span className={`detail-action-player-type ${pType ? `player-type-${pType}` : ''}`}>
                                  {pType ? pType.toUpperCase() : ''}
                                </span>
                                <span className="detail-action-text">{action.text || action.type}</span>
                              </div>
                            );
                          })}
                          <div className={`detail-action-item hero-action hero-decision ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                            <span className="detail-action-position">{item.heroPosition}</span>
                            <span className="detail-action-player-type"></span>
                            <span className="detail-action-text">
                              {item.userAnswer}
                              {item.isCorrect ? (
                                <span className="result-icon correct">✓</span>
                              ) : (
                                <>
                                  <span className="result-icon incorrect">✗</span>
                                  <span className="should-be">(should: {item.correctAnswer})</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="detail-plaintext">
                        <pre>{generatePlaintextHH(item)}</pre>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            // Hands list view - shows only last 5 hands from overview
            <>
              {/* All-time stats from overview */}
              {historyOverview.totalHands > 0 && (
                <div className="history-stats">
                  <div className="stat-item">
                    <span className="stat-value">{historyOverview.totalHands}</span>
                    <span className="stat-label">Total Hands</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value correct">
                      {historyOverview.correct}
                    </span>
                    <span className="stat-label">Correct</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value incorrect">
                      {historyOverview.incorrect}
                    </span>
                    <span className="stat-label">Mistakes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {Math.round((historyOverview.correct / historyOverview.totalHands) * 100)}%
                    </span>
                    <span className="stat-label">Accuracy</span>
                  </div>
                </div>
              )}
              <div className="history-section-label">Recent Hands</div>
              {recentHands.length === 0 ? (
                <div className="history-empty">No hands played yet</div>
              ) : (
                <div className="history-list">
                  {recentHands.map((item) => (
                    <div
                      key={item.id}
                      className={`history-item ${item.isCorrect ? 'correct' : 'incorrect'}`}
                      onClick={() => {
                        setSelectedHandId(item.id);
                        setSelectedHandData(item);
                        setShowHHHandChart(false);
                      }}
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

      <div className="scenario-label-wrapper">
        <div
          className="scenario-label clickable"
          onClick={() => setShowHandChart(!showHandChart)}
        >
          {currentScenario.label}
        </div>
        {showHandChart && (
          <div className="hand-chart-tooltip visible" ref={handChartRef}>
            <HandChart
              category={currentScenario.category}
              scenarioKey={currentScenario.key}
              title={currentScenario.label}
            />
          </div>
        )}
      </div>

      <PokerTable
        heroPosition={getHeroPosition()}
        dealerPosition={getDealerPosition()}
        actions={actions}
        currentActionIndex={currentActionIndex}
        showHeroHighlight={showHeroHighlight && userAnswer === null}
        blinds={blinds}
        playerTypes={playerTypes}
        nextToActPosition={nextToActPosition}
        chipStyle={chipStyle}
        playerColors={playerColors}
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
        <div className={`feedback ${correctAnswer && correctAnswer.split('/').includes(userAnswer) ? 'correct' : 'incorrect'}`}>
          {correctAnswer && correctAnswer.split('/').includes(userAnswer) ? (
            <span>✓ Correct!</span>
          ) : (
            <span>✗ Wrong! Correct: <strong>{correctAnswer}</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
