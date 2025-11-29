import React, { useState } from 'react';
import './Settings.css';

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

const BLIND_OPTIONS = [
  { sb: 1, bb: 2, label: '$1/$2' },
  { sb: 2, bb: 5, label: '$2/$5' },
  { sb: 5, bb: 5, label: '$5/$5' },
  { sb: 5, bb: 10, label: '$5/$10' },
  { sb: 10, bb: 20, label: '$10/$20' },
  { sb: 25, bb: 50, label: '$25/$50' }
];

// Map scenarios to positions and situations
export const SCENARIO_MAPPINGS = {
  // Open Ranges
  ep_open: { positions: ['EP'], situation: 'open', label: 'EP Open', category: 'open_ranges' },
  hj_open: { positions: ['HJ'], situation: 'open', label: 'HJ Open', category: 'open_ranges' },
  btn_open: { positions: ['BTN'], situation: 'open', label: 'BTN Open', category: 'open_ranges' },
  btn_vs_limp: { positions: ['BTN'], situation: 'open', label: 'BTN vs Limp', category: 'open_ranges' },
  btn_vs_2_fish: { positions: ['BTN'], situation: 'open', label: 'BTN vs 2 Fish', category: 'open_ranges' },

  // Vs Open Ranges
  hj_vs_ep_open: { positions: ['HJ'], situation: 'vs_open', label: 'HJ vs EP Open', category: 'vs_open_ranges', villain: 'EP', villainAction: 'open' },
  btn_vs_aggro_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs Aggro Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open' },
  btn_vs_passive_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs Passive Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open' },
  bb_vs_passive_open: { positions: ['BB'], situation: 'vs_open', label: 'BB vs Passive Open', category: 'vs_open_ranges', villain: 'BTN', villainAction: 'open' },
  bb_vs_aggro_open: { positions: ['BB'], situation: 'vs_open', label: 'BB vs Aggro Open', category: 'vs_open_ranges', villain: 'BTN', villainAction: 'open' },
  btn_squeeze: { positions: ['BTN'], situation: 'vs_open', label: 'BTN Squeeze', category: 'vs_open_ranges', villain: 'HJ', villainAction: 'open', caller: 'CO' },
  ep_vs_pro_open: { positions: ['EP'], situation: 'vs_open', label: 'EP vs Pro Open', category: 'vs_open_ranges', villain: 'UTG', villainAction: 'open' },
  btn_vs_co_pro_open: { positions: ['BTN'], situation: 'vs_open', label: 'BTN vs CO Pro Open', category: 'vs_open_ranges', villain: 'CO', villainAction: 'open' },

  // Vs 3bet Ranges
  oop_vs_passive_3bet: { positions: ['EP', 'HJ', 'CO'], situation: 'vs_3bet', label: 'OOP vs Passive 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet' },
  oop_vs_aggro_3bet: { positions: ['EP', 'HJ', 'CO'], situation: 'vs_3bet', label: 'OOP vs Aggro 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet' },
  ip_vs_passive_3bet: { positions: ['BTN'], situation: 'vs_3bet', label: 'IP vs Passive 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet' },
  ip_vs_aggro_3bet: { positions: ['BTN'], situation: 'vs_3bet', label: 'IP vs Aggro 3bet', category: 'vs_3bet_ranges', villain: 'BB', villainAction: '3bet' },

  // Cold 4bet Ranges
  cold_4bet_vs_tight: { positions: ['CO', 'BTN'], situation: 'cold_4bet', label: 'Cold 4bet vs Tight', category: 'cold_4bet_ranges', villain: 'EP', villainAction: 'open', villain2: 'HJ', villain2Action: '3bet' },
  cold_4bet_vs_aggro: { positions: ['CO', 'BTN'], situation: 'cold_4bet', label: 'Cold 4bet vs Aggro', category: 'cold_4bet_ranges', villain: 'EP', villainAction: 'open', villain2: 'HJ', villain2Action: '3bet' },

  // Vs 4bet Ranges
  vs_passive_4bet: { positions: ['EP', 'HJ', 'CO'], situation: 'vs_4bet', label: 'Vs Passive 4bet', category: 'vs_4bet_ranges', villain: 'BB', villainAction: '4bet' },
  vs_aggro_4bet: { positions: ['EP', 'HJ', 'CO', 'BTN'], situation: 'vs_4bet', label: 'Vs Aggro 4bet', category: 'vs_4bet_ranges', villain: 'BB', villainAction: '4bet' }
};

export default function Settings({ onStartTraining }) {
  const [selectedPositions, setSelectedPositions] = useState(new Set(['BTN', 'BB']));
  const [selectedSituations, setSelectedSituations] = useState(new Set(['open', 'vs_open']));
  const [selectedBlinds, setSelectedBlinds] = useState(BLIND_OPTIONS[2]); // Default $5/$5

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
    onStartTraining(availableScenarios, selectedBlinds);
  };

  return (
    <div className="settings">
      <h1>Poker Preflop Trainer</h1>
      <p className="subtitle">Configure your training session</p>

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

      <div className="settings-section blinds-section">
        <div className="section-header">
          <h2>Blinds</h2>
        </div>
        <div className="blinds-options">
          {BLIND_OPTIONS.map((blind, index) => (
            <button
              key={index}
              className={`blind-button ${selectedBlinds === blind ? 'selected' : ''}`}
              onClick={() => setSelectedBlinds(blind)}
            >
              {blind.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scenarios-preview">
        <h3>Available Scenarios ({availableScenarios.length})</h3>
        <div className="scenario-tags">
          {availableScenarios.length > 0 ? (
            availableScenarios.map(s => (
              <span key={s.key} className="scenario-tag">{s.label}</span>
            ))
          ) : (
            <span className="no-scenarios">Select positions and situations to see available scenarios</span>
          )}
        </div>
      </div>

      <button
        className="start-button"
        onClick={handleStart}
        disabled={!canStart}
      >
        {canStart ? `Start Training (${availableScenarios.length} scenarios)` : 'Select at least one position and situation'}
      </button>
    </div>
  );
}
