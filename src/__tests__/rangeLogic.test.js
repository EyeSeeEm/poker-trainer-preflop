import { describe, it, expect } from 'vitest';
import { getCorrectAction, isAnswerCorrect, getCorrectActionDisplay } from '../utils/rangeLogic';
import { rangeData } from '../rangeData';

describe('Range Logic', () => {
  describe('Open Ranges', () => {
    it('should return "Raise" for AA in EP Open', () => {
      const result = getCorrectAction('AA', 'open_ranges', 'ep_open');
      expect(result.action).toBe('Raise');
      expect(result.isMixed).toBe(false);
    });

    it('should return "Fold" for 72o in EP Open', () => {
      const result = getCorrectAction('72o', 'open_ranges', 'ep_open');
      expect(result.action).toBe('Fold');
    });

    it('should return "Raise" for AKs in HJ Open', () => {
      const result = getCorrectAction('AKs', 'open_ranges', 'hj_open');
      expect(result.action).toBe('Raise');
    });

    it('should return "Fold" for 32s in HJ Open', () => {
      const result = getCorrectAction('32s', 'open_ranges', 'hj_open');
      expect(result.action).toBe('Fold');
    });
  });

  describe('Vs Open Ranges', () => {
    it('should return "3bet" for AA in HJ vs EP Open', () => {
      const result = getCorrectAction('AA', 'vs_open_ranges', 'hj_vs_ep_open');
      expect(result.action).toBe('3bet');
    });

    it('should return "Call" for A7s in BTN vs Aggro Open (mixed)', () => {
      const result = getCorrectAction('A7s', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result.action).toBe('Call');
      expect(result.isMixed).toBe(true);
      expect(result.altAction).toBe('3bet');
    });

    it('should return "3bet" for AKs in BTN vs Aggro Open', () => {
      const result = getCorrectAction('AKs', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result.action).toBe('3bet');
    });

    it('should return "Fold" for 72o in BTN vs Aggro Open', () => {
      const result = getCorrectAction('72o', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result.action).toBe('Fold');
    });
  });

  describe('Vs 3bet Ranges', () => {
    it('should return "4bet" for AA in OOP vs Passive 3bet', () => {
      const result = getCorrectAction('AA', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result.action).toBe('4bet');
    });

    it('should return "4bet" for AKs in OOP vs Passive 3bet (mixed)', () => {
      const result = getCorrectAction('AKs', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result.action).toBe('4bet');
      expect(result.isMixed).toBe(true);
      expect(result.altAction).toBe('Call');
    });

    it('should return "Fold" for 72o in OOP vs Passive 3bet', () => {
      const result = getCorrectAction('72o', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result.action).toBe('Fold');
    });
  });

  describe('Cold 4bet Ranges', () => {
    it('should return "4bet" for AA in Cold 4bet vs Tight', () => {
      const result = getCorrectAction('AA', 'cold_4bet_ranges', 'cold_4bet_vs_tight');
      expect(result.action).toBe('4bet');
    });

    it('should return "Fold" for KQs in Cold 4bet vs Tight', () => {
      const result = getCorrectAction('KQs', 'cold_4bet_ranges', 'cold_4bet_vs_tight');
      expect(result.action).toBe('Fold');
    });
  });

  describe('Vs 4bet Ranges', () => {
    // OOP vs Passive 4bet
    it('should return "5bet" for AA in OOP vs Passive 4bet', () => {
      const result = getCorrectAction('AA', 'vs_4bet_ranges', 'oop_vs_passive_4bet');
      expect(result.action).toBe('5bet');
    });

    it('should return "5bet" for KK in OOP vs Passive 4bet (mixed)', () => {
      const result = getCorrectAction('KK', 'vs_4bet_ranges', 'oop_vs_passive_4bet');
      expect(result.action).toBe('5bet');
      expect(result.isMixed).toBe(true);
    });

    it('should return "Call" for QQ in OOP vs Passive 4bet', () => {
      const result = getCorrectAction('QQ', 'vs_4bet_ranges', 'oop_vs_passive_4bet');
      expect(result.action).toBe('Call');
    });

    // IP vs Passive 4bet
    it('should return "5bet" for AA in IP vs Passive 4bet', () => {
      const result = getCorrectAction('AA', 'vs_4bet_ranges', 'ip_vs_passive_4bet');
      expect(result.action).toBe('5bet');
    });

    it('should return "Call" for KK in IP vs Passive 4bet (mixed)', () => {
      const result = getCorrectAction('KK', 'vs_4bet_ranges', 'ip_vs_passive_4bet');
      expect(result.action).toBe('Call');
      expect(result.isMixed).toBe(true);
    });

    // OOP vs Aggro 4bet
    it('should return "5bet" for AA in OOP vs Aggro 4bet', () => {
      const result = getCorrectAction('AA', 'vs_4bet_ranges', 'oop_vs_aggro_4bet');
      expect(result.action).toBe('5bet');
    });

    it('should return "5bet" for KK in OOP vs Aggro 4bet (mixed)', () => {
      const result = getCorrectAction('KK', 'vs_4bet_ranges', 'oop_vs_aggro_4bet');
      expect(result.action).toBe('5bet');
      expect(result.isMixed).toBe(true);
    });

    it('should return "Call" for QQ in OOP vs Aggro 4bet', () => {
      const result = getCorrectAction('QQ', 'vs_4bet_ranges', 'oop_vs_aggro_4bet');
      expect(result.action).toBe('Call');
    });

    // IP vs Aggro 4bet
    it('should return "5bet" for AA in IP vs Aggro 4bet', () => {
      const result = getCorrectAction('AA', 'vs_4bet_ranges', 'ip_vs_aggro_4bet');
      expect(result.action).toBe('5bet');
    });

    it('should return "Call" for KK in IP vs Aggro 4bet (mixed)', () => {
      const result = getCorrectAction('KK', 'vs_4bet_ranges', 'ip_vs_aggro_4bet');
      expect(result.action).toBe('Call');
      expect(result.isMixed).toBe(true);
    });

    it('should return "Fold" for AQs in IP vs Aggro 4bet', () => {
      const result = getCorrectAction('AQs', 'vs_4bet_ranges', 'ip_vs_aggro_4bet');
      expect(result.action).toBe('Fold');
    });
  });

  describe('isAnswerCorrect', () => {
    it('should accept both actions for mixed hands in vs_open scenarios', () => {
      // A7s in btn_vs_aggro_open is mixed between Call and 3bet
      expect(isAnswerCorrect('Call', 'A7s', 'vs_open_ranges', 'btn_vs_aggro_open')).toBe(true);
      expect(isAnswerCorrect('3bet', 'A7s', 'vs_open_ranges', 'btn_vs_aggro_open')).toBe(true);
      expect(isAnswerCorrect('Fold', 'A7s', 'vs_open_ranges', 'btn_vs_aggro_open')).toBe(false);
    });

    it('should only accept single action for non-mixed hands', () => {
      // AA in ep_open is pure Raise
      expect(isAnswerCorrect('Raise', 'AA', 'open_ranges', 'ep_open')).toBe(true);
      expect(isAnswerCorrect('Fold', 'AA', 'open_ranges', 'ep_open')).toBe(false);
    });
  });

  describe('getCorrectActionDisplay', () => {
    it('should return single action for non-mixed hands', () => {
      expect(getCorrectActionDisplay('AA', 'open_ranges', 'ep_open')).toBe('Raise');
    });

    it('should return both actions for mixed hands', () => {
      // A7s in btn_vs_aggro_open is mixed Call/3bet
      expect(getCorrectActionDisplay('A7s', 'vs_open_ranges', 'btn_vs_aggro_open')).toBe('Call/3bet');
    });
  });
});
