import { describe, it, expect } from 'vitest';
import { getCorrectAction } from '../utils/rangeLogic';
import { rangeData } from '../rangeData';

describe('Range Logic', () => {
  describe('Open Ranges', () => {
    it('should return "Raise" for AA in EP Open', () => {
      const result = getCorrectAction('AA', 'open_ranges', 'ep_open');
      expect(result).toBe('Raise');
    });

    it('should return "Fold" for 72o in EP Open', () => {
      const result = getCorrectAction('72o', 'open_ranges', 'ep_open');
      expect(result).toBe('Fold');
    });

    it('should return "Raise" for AKs in HJ Open', () => {
      const result = getCorrectAction('AKs', 'open_ranges', 'hj_open');
      expect(result).toBe('Raise');
    });

    it('should return "Fold" for 32s in HJ Open', () => {
      const result = getCorrectAction('32s', 'open_ranges', 'hj_open');
      expect(result).toBe('Fold');
    });
  });

  describe('Vs Open Ranges', () => {
    it('should return "3bet" for AA in HJ vs EP Open', () => {
      const result = getCorrectAction('AA', 'vs_open_ranges', 'hj_vs_ep_open');
      expect(result).toBe('3bet');
    });

    it('should return "Call" for A7s in BTN vs Aggro Open', () => {
      const result = getCorrectAction('A7s', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result).toBe('Call');
    });

    it('should return "3bet" for AKs in BTN vs Aggro Open', () => {
      const result = getCorrectAction('AKs', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result).toBe('3bet');
    });

    it('should return "Fold" for 72o in BTN vs Aggro Open', () => {
      const result = getCorrectAction('72o', 'vs_open_ranges', 'btn_vs_aggro_open');
      expect(result).toBe('Fold');
    });
  });

  describe('Vs 3bet Ranges', () => {
    it('should return "4bet" for AA in OOP vs Passive 3bet', () => {
      const result = getCorrectAction('AA', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result).toBe('4bet');
    });

    it('should return "Call" for AKs in OOP vs Passive 3bet', () => {
      const result = getCorrectAction('AKs', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result).toBe('Call');
    });

    it('should return "Fold" for 72o in OOP vs Passive 3bet', () => {
      const result = getCorrectAction('72o', 'vs_3bet_ranges', 'oop_vs_passive_3bet');
      expect(result).toBe('Fold');
    });
  });

  describe('Cold 4bet Ranges', () => {
    it('should return "4bet" for AA in Cold 4bet vs Tight', () => {
      const result = getCorrectAction('AA', 'cold_4bet_ranges', 'cold_4bet_vs_tight');
      expect(result).toBe('4bet');
    });

    it('should return "Fold" for KQs in Cold 4bet vs Tight', () => {
      const result = getCorrectAction('KQs', 'cold_4bet_ranges', 'cold_4bet_vs_tight');
      expect(result).toBe('Fold');
    });
  });

  describe('Vs 4bet Ranges', () => {
    it('should return "5bet" for AA in Vs Passive 4bet', () => {
      const result = getCorrectAction('AA', 'vs_4bet_ranges', 'vs_passive_4bet');
      expect(result).toBe('5bet');
    });

    it('should return "Call" for KK in Vs Passive 4bet', () => {
      const result = getCorrectAction('KK', 'vs_4bet_ranges', 'vs_passive_4bet');
      expect(result).toBe('Call');
    });

    it('should return "Fold" for AQs in Vs Passive 4bet', () => {
      const result = getCorrectAction('AQs', 'vs_4bet_ranges', 'vs_passive_4bet');
      expect(result).toBe('Fold');
    });
  });
});
