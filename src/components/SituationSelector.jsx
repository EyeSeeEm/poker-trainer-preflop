import React from 'react';
import './SituationSelector.css';

const situations = {
  'Open Ranges': {
    category: 'open_ranges',
    scenarios: [
      { key: 'ep_open', label: 'EP Open' },
      { key: 'hj_open', label: 'HJ Open' },
      { key: 'btn_open', label: 'BTN Open' },
      { key: 'btn_vs_limp', label: 'BTN vs Limp' },
      { key: 'btn_vs_2_fish', label: 'BTN vs 2 Fish' }
    ]
  },
  'Vs Open': {
    category: 'vs_open_ranges',
    scenarios: [
      { key: 'hj_vs_ep_open', label: 'HJ vs EP Open' },
      { key: 'btn_vs_aggro_open', label: 'BTN vs Aggro Open' },
      { key: 'btn_vs_passive_open', label: 'BTN vs Passive Open' },
      { key: 'bb_vs_passive_open', label: 'BB vs Passive Open' },
      { key: 'bb_vs_aggro_open', label: 'BB vs Aggro Open' },
      { key: 'btn_squeeze', label: 'BTN Squeeze' },
      { key: 'ep_vs_pro_open', label: 'HJ vs UTG Pro Open' },
      { key: 'btn_vs_co_pro_open', label: 'BTN vs CO Pro Open' }
    ]
  },
  'Vs 3bet': {
    category: 'vs_3bet_ranges',
    scenarios: [
      { key: 'oop_vs_passive_3bet', label: 'OOP vs Passive 3bet' },
      { key: 'oop_vs_aggro_3bet', label: 'OOP vs Aggro 3bet' },
      { key: 'ip_vs_passive_3bet', label: 'IP vs Passive 3bet' },
      { key: 'ip_vs_aggro_3bet', label: 'IP vs Aggro 3bet' }
    ]
  },
  'Cold 4bet': {
    category: 'cold_4bet_ranges',
    scenarios: [
      { key: 'cold_4bet_vs_tight', label: 'Cold 4bet vs Tight' },
      { key: 'cold_4bet_vs_aggro', label: 'Cold 4bet vs Aggro' }
    ]
  },
  'Vs 4bet': {
    category: 'vs_4bet_ranges',
    scenarios: [
      { key: 'vs_passive_4bet', label: 'Vs Passive 4bet' },
      { key: 'vs_aggro_4bet', label: 'Vs Aggro 4bet' }
    ]
  }
};

export default function SituationSelector({ onSelect }) {
  return (
    <div className="situation-selector">
      <h1>Poker Preflop Trainer</h1>
      <p className="subtitle">Select a situation to practice:</p>

      {Object.entries(situations).map(([groupName, group]) => (
        <div key={groupName} className="situation-group">
          <h2>{groupName}</h2>
          <div className="scenario-buttons">
            {group.scenarios.map(scenario => (
              <button
                key={scenario.key}
                className="scenario-button"
                onClick={() => onSelect(group.category, scenario.key, scenario.label)}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
