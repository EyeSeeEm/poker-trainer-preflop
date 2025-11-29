import React, { useState, useEffect } from 'react';
import './Settings.css';

// localStorage key for selections
const SELECTIONS_STORAGE_KEY = 'poker-trainer-selections';

// Load saved selections from localStorage
const loadSavedSelections = () => {
  try {
    const stored = localStorage.getItem(SELECTIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        positions: new Set(parsed.positions || ['BTN']),
        situations: new Set(parsed.situations || ['vs_open']),
        difficulty: parsed.difficulty || 'medium'
      };
    }
  } catch (e) {
    console.error('Failed to load selections from localStorage:', e);
  }
  return null;
};

// Save selections to localStorage
const saveSelections = (positions, situations, difficulty) => {
  try {
    localStorage.setItem(SELECTIONS_STORAGE_KEY, JSON.stringify({
      positions: Array.from(positions),
      situations: Array.from(situations),
      difficulty
    }));
  } catch (e) {
    console.error('Failed to save selections to localStorage:', e);
  }
};

const POSITIONS = [
  { key: 'EP', label: 'EP (Early Position)' },
  { key: 'HJ', label: 'HJ (Hijack)' },
  { key: 'CO', label: 'CO (Cutoff)' },
  { key: 'BTN', label: 'BTN (Button)' },
  { key: 'SB', label: 'SB (Small Blind)' },
  { key: 'BB', label: 'BB (Big Blind)' }
];

const SITUATIONS = [
  { key: 'open', label: 'Open Raise' },
  { key: 'vs_open', label: 'Vs Open' },
  { key: 'vs_3bet', label: 'Vs 3-Bet' },
  { key: 'cold_4bet', label: 'Cold 4-Bet' },
  { key: 'vs_4bet', label: 'Vs 4-Bet' }
];

const DIFFICULTY_OPTIONS = [
  { key: 'easy', label: 'Easy', description: 'All hands including obvious plays' },
  { key: 'medium', label: 'Medium', description: 'Hands closer to range boundaries' },
  { key: 'hard', label: 'Hard', description: 'Only borderline decisions' }
];

// Map scenarios to positions and situations
export const SCENARIO_MAPPINGS = {
  // Open Ranges
  ep_open: { positions: ['EP'], situation: 'open', label: 'EP Open', category: 'open_ranges' },
  hj_open: { positions: ['HJ'], situation: 'open', label: 'HJ Open', category: 'open_ranges' },
  btn_open: { positions: ['BTN'], situation: 'open', label: 'BTN Open', category: 'open_ranges' },
  btn_vs_limp: { positions: ['BTN'], situation: 'open', label: 'BTN vs Limp', category: 'open_ranges', limper: 'HJ', limperType: 'fish' },
  btn_vs_2_fish: { positions: ['BTN'], situation: 'open', label: 'BTN vs 2 Fish', category: 'open_ranges', limper: 'HJ', limperType: 'fish', limper2: 'CO', limper2Type: 'fish' },

  // Vs Open Ranges
  hj_vs_ep_open: { positions: ['HJ'], situation: 'vs_open', label: 'HJ vs EP Open', category: 'vs_open_ranges', villain: 'EP', villainAction: 'open', villainType: 'reg' },
  btn_vs_aggro_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs Aggro Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open', villainType: 'aggro' },
  btn_vs_passive_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs Passive Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open', villainType: 'passive' },
  bb_vs_passive_open: { positions: ['BB'], situation: 'vs_open', label: 'BB vs Passive Open', category: 'vs_open_ranges', villain: 'BTN', villainAction: 'open', villainType: 'passive' },
  bb_vs_aggro_open: { positions: ['BB'], situation: 'vs_open', label: 'BB vs Aggro Open', category: 'vs_open_ranges', villain: 'BTN', villainAction: 'open', villainType: 'aggro' },
  btn_squeeze: { positions: ['BTN'], situation: 'vs_open', label: 'BTN Squeeze', category: 'vs_open_ranges', villain: 'HJ', villainAction: 'open', villainType: 'reg', caller: 'CO', callerType: 'fish' },
  ep_vs_pro_open: { positions: ['HJ'], situation: 'vs_open', label: 'HJ vs UTG Pro Open', category: 'vs_open_ranges', villain: 'UTG', villainAction: 'open', villainType: 'pro' },
  btn_vs_co_pro_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs CO Pro Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open', villainType: 'pro' },

  // Vs 3bet Ranges
  oop_vs_passive_3bet: { positions: ['EP', 'HJ', 'CO'], situation: 'vs_3bet', label: 'OOP vs Passive 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet', villainType: 'passive' },
  oop_vs_aggro_3bet: { positions: ['EP', 'HJ', 'CO'], situation: 'vs_3bet', label: 'OOP vs Aggro 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet', villainType: 'aggro' },
  ip_vs_passive_3bet: { positions: ['BTN'], situation: 'vs_3bet', label: 'IP vs Passive 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet', villainType: 'passive' },
  ip_vs_aggro_3bet: { positions: ['BTN'], situation: 'vs_3bet', label: 'IP vs Aggro 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet', villainType: 'aggro' },

  // Cold 4bet Ranges
  cold_4bet_vs_tight: { positions: ['CO', 'BTN'], situation: 'cold_4bet', label: 'Cold 4bet vs Tight', category: 'cold_4bet_ranges', villain: 'EP', villainAction: 'open', villainType: 'tight', villain2: 'HJ', villain2Action: '3bet', villain2Type: 'tight' },
  cold_4bet_vs_aggro: { positions: ['CO', 'BTN'], situation: 'cold_4bet', label: 'Cold 4bet vs Aggro', category: 'cold_4bet_ranges', villain: 'EP', villainAction: 'open', villainType: 'reg', villain2: 'HJ', villain2Action: '3bet', villain2Type: 'aggro' },

  // Vs 4bet Ranges - split by IP/OOP since position-dependent hands call IP but fold OOP
  // IP scenarios (CO vs BTN 4bet - hero opened from CO, BTN 3bet, hero re-raised, BTN 4bets)
  ip_vs_passive_4bet: { positions: ['CO'], situation: 'vs_4bet', label: 'IP vs Passive 4bet', category: 'vs_4bet_ranges', villain: 'BTN', villainAction: '4bet', villainType: 'passive' },
  ip_vs_aggro_4bet: { positions: ['CO'], situation: 'vs_4bet', label: 'IP vs Aggro 4bet', category: 'vs_4bet_ranges', villain: 'BTN', villainAction: '4bet', villainType: 'aggro' },
  // OOP scenarios (BB/SB vs BTN 4bet - hero 3bet from blinds, BTN 4bets)
  oop_vs_passive_4bet: { positions: ['BB', 'SB'], situation: 'vs_4bet', label: 'OOP vs Passive 4bet', category: 'vs_4bet_ranges', villain: 'BTN', villainAction: '4bet', villainType: 'passive' },
  oop_vs_aggro_4bet: { positions: ['BB', 'SB'], situation: 'vs_4bet', label: 'OOP vs Aggro 4bet', category: 'vs_4bet_ranges', villain: 'BTN', villainAction: '4bet', villainType: 'aggro' }
};

// Fixed blinds - always 5/5
const FIXED_BLINDS = { sb: 5, bb: 5 };

export default function Settings({ onStartTraining }) {
  // Initialize state from localStorage or defaults
  const savedSelections = loadSavedSelections();
  const [selectedPositions, setSelectedPositions] = useState(
    savedSelections?.positions || new Set(['BTN'])
  );
  const [selectedSituations, setSelectedSituations] = useState(
    savedSelections?.situations || new Set(['vs_open'])
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    savedSelections?.difficulty || 'medium'
  );

  // Save selections to localStorage whenever they change
  useEffect(() => {
    saveSelections(selectedPositions, selectedSituations, selectedDifficulty);
  }, [selectedPositions, selectedSituations, selectedDifficulty]);

  const togglePosition = (pos) => {
    const newSet = new Set(selectedPositions);
    if (newSet.has(pos)) {
      newSet.delete(pos);
    } else {
      newSet.add(pos);
    }
    setSelectedPositions(newSet);
  };

  const toggleSituation = (sit) => {
    const newSet = new Set(selectedSituations);
    if (newSet.has(sit)) {
      newSet.delete(sit);
    } else {
      newSet.add(sit);
    }
    setSelectedSituations(newSet);
  };

  const selectAllPositions = () => {
    setSelectedPositions(new Set(POSITIONS.map(p => p.key)));
  };

  const selectAllSituations = () => {
    setSelectedSituations(new Set(SITUATIONS.map(s => s.key)));
  };

  const clearPositions = () => setSelectedPositions(new Set());
  const clearSituations = () => setSelectedSituations(new Set());

  // Get available scenarios based on selections
  const getAvailableScenarios = () => {
    return Object.entries(SCENARIO_MAPPINGS).filter(([key, mapping]) => {
      const hasMatchingPosition = mapping.positions.some(pos => selectedPositions.has(pos));
      const hasMatchingSituation = selectedSituations.has(mapping.situation);
      return hasMatchingPosition && hasMatchingSituation;
    }).map(([key, mapping]) => ({
      key,
      ...mapping
    }));
  };

  const availableScenarios = getAvailableScenarios();
  const canStart = selectedPositions.size > 0 && selectedSituations.size > 0 && availableScenarios.length > 0;

  const handleStart = () => {
    onStartTraining(availableScenarios, FIXED_BLINDS, selectedDifficulty);
  };

  return (
    <div className="settings">
      {/* Hero section with decorative cards */}
      <div className="hero-section">
        <div className="decorative-cards">
          <div className="deco-card card-1">A<span className="suit spade">♠</span></div>
          <div className="deco-card card-2">K<span className="suit spade">♠</span></div>
        </div>
        <h1>ESM's Poker Preflop Trainer</h1>
        <p className="subtitle">Master your preflop ranges</p>
      </div>

      <div className="settings-grid">
        <div className="settings-section">
          <div className="section-header">
            <h2>Positions</h2>
            <div className="section-actions">
              <button className="link-button" onClick={selectAllPositions}>All</button>
              <button className="link-button" onClick={clearPositions}>None</button>
            </div>
          </div>
          <div className="checkbox-group">
            {POSITIONS.map(pos => (
              <label key={pos.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPositions.has(pos.key)}
                  onChange={() => togglePosition(pos.key)}
                />
                <span className="checkmark"></span>
                <span className="label-text">{pos.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>Situations</h2>
            <div className="section-actions">
              <button className="link-button" onClick={selectAllSituations}>All</button>
              <button className="link-button" onClick={clearSituations}>None</button>
            </div>
          </div>
          <div className="checkbox-group">
            {SITUATIONS.map(sit => (
              <label key={sit.key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedSituations.has(sit.key)}
                  onChange={() => toggleSituation(sit.key)}
                />
                <span className="checkmark"></span>
                <span className="label-text">{sit.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section difficulty-section">
        <div className="section-header">
          <h2>Difficulty</h2>
        </div>
        <div className="difficulty-options">
          {DIFFICULTY_OPTIONS.map(diff => (
            <button
              key={diff.key}
              className={`difficulty-button ${selectedDifficulty === diff.key ? 'selected' : ''}`}
              onClick={() => setSelectedDifficulty(diff.key)}
              title={diff.description}
            >
              {diff.label}
            </button>
          ))}
        </div>
        <p className="difficulty-description">
          {DIFFICULTY_OPTIONS.find(d => d.key === selectedDifficulty)?.description}
        </p>
      </div>

      <button
        className="start-button"
        onClick={handleStart}
        disabled={!canStart}
      >
        {canStart ? 'Start Training' : 'Select at least one position and situation'}
      </button>
    </div>
  );
}
