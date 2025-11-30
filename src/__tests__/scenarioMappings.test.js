import { describe, it, expect } from 'vitest';
import { SCENARIO_MAPPINGS } from '../components/Settings';

// Position order (first to act preflop after blinds)
const POSITION_ORDER = ['UTG', 'EP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITION_ALIASES = {
  'EP': 'UTG',
  'UTG': 'UTG',
  'HJ': 'HJ',
  'CO': 'CO',
  'BTN': 'BTN',
  'SB': 'SB',
  'BB': 'BB'
};

function normalizePosition(pos) {
  return POSITION_ALIASES[pos] || pos;
}

function getPositionIndex(pos) {
  const normalized = normalizePosition(pos);
  return POSITION_ORDER.indexOf(normalized);
}

// Check if position A acts before position B preflop
function actsBefore(posA, posB) {
  return getPositionIndex(posA) < getPositionIndex(posB);
}

describe('Scenario Mappings - Position Logic', () => {
  describe('vs_3bet scenarios', () => {
    it('hero can open and face 3bet from villain in later position', () => {
      const scenario = SCENARIO_MAPPINGS.oop_vs_passive_3bet;
      // In vs_3bet: Hero opens, villain 3-bets
      // Hero should act before villain (to open first)
      // But actually, villain (BB) can 3-bet anyone who opens
      expect(scenario.villainAction).toBe('3bet');
      expect(scenario.category).toBe('vs_3bet_ranges');
    });
  });

  describe('vs_4bet scenarios', () => {
    it('OOP vs_4bet scenarios have hero in blinds', () => {
      const scenario = SCENARIO_MAPPINGS.oop_vs_passive_4bet;
      // In OOP vs_4bet: Hero is in blinds (BB/SB)
      expect(scenario.positions).toContain('BB');
      expect(scenario.positions).toContain('SB');
      expect(scenario.villain).toBe('BTN');
    });

    it('IP vs_4bet scenarios have hero on BTN', () => {
      const scenario = SCENARIO_MAPPINGS.ip_vs_aggro_4bet;
      // In IP vs_4bet: Hero is BTN, facing CO 4bet (CO opens, BTN 3bets, CO 4bets)
      expect(scenario.positions).toContain('BTN');
      expect(scenario.villain).toBe('CO');
    });

    it('vs_4bet action sequence makes positional sense', () => {
      const scenario = SCENARIO_MAPPINGS.oop_vs_aggro_4bet;
      expect(scenario.villainAction).toBe('4bet');
      expect(scenario.category).toBe('vs_4bet_ranges');
      // Villain (BTN) opens, Hero (BB/SB) 3-bets, Villain 4-bets
      expect(scenario.villain).toBe('BTN');
      expect(scenario.positions).toContain('BB');
    });
  });

  describe('open scenarios', () => {
    it('open scenarios have no villain (hero opens first)', () => {
      const openScenarios = ['ep_open', 'hj_open', 'btn_open'];
      openScenarios.forEach(key => {
        const scenario = SCENARIO_MAPPINGS[key];
        expect(scenario.category).toBe('open_ranges');
        expect(scenario.villain).toBeUndefined();
      });
    });
  });

  describe('vs_open scenarios', () => {
    it('villain opens before hero position for vs_open scenarios', () => {
      const scenario = SCENARIO_MAPPINGS.hj_vs_ep_open;
      // Villain (EP) opens, Hero (HJ) acts after
      expect(scenario.villain).toBe('EP');
      expect(scenario.positions).toContain('HJ');
      expect(actsBefore('EP', 'HJ')).toBe(true);
    });

    it('btn_vs_aggro_open has correct positions', () => {
      const scenario = SCENARIO_MAPPINGS.btn_vs_aggro_open;
      expect(scenario.villain).toBe('CO');
      expect(scenario.positions).toContain('BTN');
      // CO acts before BTN
      expect(actsBefore('CO', 'BTN')).toBe(true);
    });
  });

  describe('cold 4bet scenarios', () => {
    it('OOP cold 4bet has hero in CO', () => {
      const scenario = SCENARIO_MAPPINGS.oop_cold_4bet_vs_tight;
      // Villain1 (EP) opens, Villain2 (HJ) 3-bets, Hero (CO) 4-bets
      expect(scenario.villain).toBe('EP');
      expect(scenario.villain2).toBe('HJ');
      expect(scenario.villain2Action).toBe('3bet');
      expect(scenario.positions).toContain('CO');
      expect(actsBefore('EP', 'CO')).toBe(true);
      expect(actsBefore('HJ', 'CO')).toBe(true);
    });

    it('IP cold 4bet has hero on BTN', () => {
      const scenario = SCENARIO_MAPPINGS.ip_cold_4bet_vs_tight;
      // Villain1 (EP) opens, Villain2 (HJ) 3-bets, Hero (BTN) 4-bets
      expect(scenario.villain).toBe('EP');
      expect(scenario.villain2).toBe('HJ');
      expect(scenario.villain2Action).toBe('3bet');
      expect(scenario.positions).toContain('BTN');
      expect(actsBefore('EP', 'BTN')).toBe(true);
      expect(actsBefore('HJ', 'BTN')).toBe(true);
    });
  });
});

// Preflop action order (matching Quiz.jsx) - EP is same as UTG in 6-max
const PREFLOP_ACTION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// Get positions from UTG up to (but not including) a given position
function getPositionsBefore(pos) {
  const targetIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(pos));
  if (targetIdx <= 0) return []; // UTG is first, nothing before
  return PREFLOP_ACTION_ORDER.slice(0, targetIdx);
}

function getPositionsBetween(openerPos, responderPos) {
  const openerIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(openerPos));
  const responderIdx = PREFLOP_ACTION_ORDER.indexOf(normalizePosition(responderPos));

  if (openerIdx === -1 || responderIdx === -1) return [];

  const positions = [];
  let idx = openerIdx + 1;
  while (idx < PREFLOP_ACTION_ORDER.length && idx !== responderIdx) {
    if (idx === responderIdx) break;
    positions.push(PREFLOP_ACTION_ORDER[idx]);
    idx++;
  }
  return positions;
}

describe('Action Sequence Building', () => {
  // Helper to build action sequence matching Quiz.jsx - shows FULL hand from UTG forward
  function buildActionSequence(scenario) {
    const actions = [];
    const heroPosition = scenario.positions[0];

    // Helper to add quick folds
    const addFolds = (positions) => {
      positions.forEach(pos => {
        actions.push({ position: pos, type: 'Fold', text: 'Fold', isQuickFold: true });
      });
    };

    // === OPEN RANGES: Hero opens ===
    if (scenario.category === 'open_ranges') {
      // Folds from UTG to hero
      addFolds(getPositionsBefore(heroPosition));

      // Handle limpers (they limp before hero opens)
      if (scenario.limper) {
        const limperIdx = actions.findIndex(a => a.position === scenario.limper);
        if (limperIdx >= 0) actions.splice(limperIdx, 1);
        actions.push({ position: scenario.limper, type: 'Limp', text: 'Limp' });
      }
      if (scenario.limper2) {
        const limperIdx = actions.findIndex(a => a.position === scenario.limper2);
        if (limperIdx >= 0) actions.splice(limperIdx, 1);
        actions.push({ position: scenario.limper2, type: 'Limp', text: 'Limp' });
      }
    }

    // === VS OPEN RANGES: Villain opens, hero responds ===
    else if (scenario.category === 'vs_open_ranges') {
      // Folds from UTG to villain
      addFolds(getPositionsBefore(scenario.villain));

      // Villain opens
      actions.push({ position: scenario.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // For squeeze: there's a caller between villain and hero
      if (scenario.caller) {
        addFolds(getPositionsBetween(scenario.villain, scenario.caller));
        actions.push({ position: scenario.caller, type: 'Call', text: 'Call' });
        addFolds(getPositionsBetween(scenario.caller, heroPosition));
      } else {
        addFolds(getPositionsBetween(scenario.villain, heroPosition));
      }
    }

    // === VS 3BET RANGES: Hero opened, villain 3bets ===
    else if (scenario.category === 'vs_3bet_ranges') {
      // Folds from UTG to hero
      addFolds(getPositionsBefore(heroPosition));

      // Hero opens
      actions.push({ position: heroPosition, type: 'Raise', text: 'Raise 2.5BB', isHeroAction: true });

      // Folds from hero to villain
      addFolds(getPositionsBetween(heroPosition, scenario.villain));

      // Villain 3-bets
      actions.push({ position: scenario.villain, type: '3bet', text: '3-Bet 9BB' });
    }

    // === VS 4BET RANGES: Villain opened, hero 3bet, villain 4bets ===
    else if (scenario.category === 'vs_4bet_ranges') {
      // Folds from UTG to villain
      addFolds(getPositionsBefore(scenario.villain));

      // Villain opens
      actions.push({ position: scenario.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // Folds from villain to hero
      addFolds(getPositionsBetween(scenario.villain, heroPosition));

      // Hero 3-bets
      actions.push({ position: heroPosition, type: '3bet', text: '3-Bet 9BB', isHeroAction: true });

      // Villain 4-bets
      actions.push({ position: scenario.villain, type: '4bet', text: '4-Bet 22BB' });
    }

    // === COLD 4BET RANGES: V1 opens, V2 3bets, hero cold 4bets ===
    else if (scenario.category === 'cold_4bet_ranges') {
      // Folds from UTG to villain1
      addFolds(getPositionsBefore(scenario.villain));

      // Villain1 opens
      actions.push({ position: scenario.villain, type: 'Raise', text: 'Raise 2.5BB' });

      // Folds from villain1 to villain2
      addFolds(getPositionsBetween(scenario.villain, scenario.villain2));

      // Villain2 3-bets
      actions.push({ position: scenario.villain2, type: '3bet', text: '3-Bet 9BB' });

      // Folds from villain2 to hero
      addFolds(getPositionsBetween(scenario.villain2, heroPosition));
    }

    return actions;
  }

  it('vs_4bet builds correct action sequence: folds to villain, villain opens, folds, hero 3bets, villain 4bets', () => {
    const scenario = SCENARIO_MAPPINGS.oop_vs_aggro_4bet;
    const actions = buildActionSequence(scenario);

    // Hero is BB, Villain is BTN
    // Full sequence: UTG folds -> HJ folds -> CO folds -> BTN opens -> SB folds -> BB 3bets -> BTN 4bets
    // So 7 actions total

    // Actions 0-2: UTG, HJ, CO fold (before BTN)
    expect(actions[0].position).toBe('UTG');
    expect(actions[0].type).toBe('Fold');
    expect(actions[0].isQuickFold).toBe(true);
    expect(actions[1].position).toBe('HJ');
    expect(actions[2].position).toBe('CO');

    // Action 3: Villain opens
    expect(actions[3].position).toBe('BTN');
    expect(actions[3].type).toBe('Raise');

    // Action 4: SB folds (quick)
    expect(actions[4].position).toBe('SB');
    expect(actions[4].type).toBe('Fold');
    expect(actions[4].isQuickFold).toBe(true);

    // Action 5: Hero 3-bets
    expect(actions[5].type).toBe('3bet');
    expect(actions[5].isHeroAction).toBe(true);

    // Action 6: Villain 4-bets
    expect(actions[6].position).toBe('BTN');
    expect(actions[6].type).toBe('4bet');
  });

  it('vs_3bet builds correct action sequence: hero opens, folds, villain 3bets', () => {
    const scenario = SCENARIO_MAPPINGS.oop_vs_aggro_3bet;
    const actions = buildActionSequence(scenario);

    // Hero is EP (UTG), Villain is BB
    // Sequence: UTG opens -> HJ folds -> CO folds -> BTN folds -> SB folds -> BB 3bets
    // So 6 actions total

    // Action 0: Hero opens
    expect(actions[0].type).toBe('Raise');
    expect(actions[0].isHeroAction).toBe(true);

    // Actions 1-4: Quick folds from HJ, CO, BTN, SB
    const foldActions = actions.slice(1, 5);
    expect(foldActions.length).toBe(4);
    foldActions.forEach(action => {
      expect(action.type).toBe('Fold');
      expect(action.isQuickFold).toBe(true);
    });
    expect(foldActions.map(a => a.position)).toEqual(['HJ', 'CO', 'BTN', 'SB']);

    // Last action: Villain 3-bets
    const lastAction = actions[actions.length - 1];
    expect(lastAction.position).toBe('BB');
    expect(lastAction.type).toBe('3bet');
  });

  it('cold_4bet builds correct sequence: v1 opens, v2 3bets', () => {
    const scenario = SCENARIO_MAPPINGS.oop_cold_4bet_vs_tight;
    const actions = buildActionSequence(scenario);

    // Should have 2 actions: villain1 open, villain2 3bet
    expect(actions.length).toBe(2);

    // Action 0: Villain1 opens
    expect(actions[0].position).toBe('EP');
    expect(actions[0].type).toBe('Raise');

    // Action 1: Villain2 3-bets
    expect(actions[1].position).toBe('HJ');
    expect(actions[1].type).toBe('3bet');
  });

  it('vs_open builds correct sequence: villain opens', () => {
    const scenario = SCENARIO_MAPPINGS.hj_vs_ep_open;
    const actions = buildActionSequence(scenario);

    // EP (UTG) opens, nothing before since EP is first
    // Should have 1 action: villain open
    expect(actions.length).toBe(1);
    expect(actions[0].position).toBe('EP');
    expect(actions[0].type).toBe('Raise');
  });

  it('open_ranges builds folds before hero position', () => {
    const scenario = SCENARIO_MAPPINGS.hj_open;
    const actions = buildActionSequence(scenario);

    // Hero is HJ, so UTG should fold first
    // Sequence: UTG folds -> (hero at HJ makes decision)
    expect(actions.length).toBe(1);
    expect(actions[0].position).toBe('UTG');
    expect(actions[0].type).toBe('Fold');
    expect(actions[0].isQuickFold).toBe(true);
  });

  it('btn_open shows all folds before BTN', () => {
    const scenario = SCENARIO_MAPPINGS.btn_open;
    const actions = buildActionSequence(scenario);

    // Hero is BTN, so UTG/HJ/CO should fold first
    // Sequence: UTG folds -> HJ folds -> CO folds -> (hero at BTN makes decision)
    expect(actions.length).toBe(3);
    expect(actions.map(a => a.position)).toEqual(['UTG', 'HJ', 'CO']);
    actions.forEach(a => {
      expect(a.type).toBe('Fold');
      expect(a.isQuickFold).toBe(true);
    });
  });

  it('ep_open has no folds (UTG is first)', () => {
    const scenario = SCENARIO_MAPPINGS.ep_open;
    const actions = buildActionSequence(scenario);

    // Hero is EP (UTG), nothing before since EP is first
    expect(actions.length).toBe(0);
  });
});
