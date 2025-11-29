import { describe, it, expect } from 'vitest';
import { generateAllHands, getRandomHand } from '../utils/handGeneration';

describe('Hand Generation', () => {
  describe('generateAllHands', () => {
    it('should generate exactly 169 unique hands', () => {
      const hands = generateAllHands();
      expect(hands).toHaveLength(169);

      // Check uniqueness
      const uniqueHands = new Set(hands);
      expect(uniqueHands.size).toBe(169);
    });

    it('should include pocket pairs', () => {
      const hands = generateAllHands();
      expect(hands).toContain('AA');
      expect(hands).toContain('KK');
      expect(hands).toContain('22');
    });

    it('should include suited hands', () => {
      const hands = generateAllHands();
      expect(hands).toContain('AKs');
      expect(hands).toContain('87s');
    });

    it('should include offsuit hands', () => {
      const hands = generateAllHands();
      expect(hands).toContain('AKo');
      expect(hands).toContain('72o');
    });

    it('should not include invalid hands', () => {
      const hands = generateAllHands();
      expect(hands).not.toContain('AAs');
      expect(hands).not.toContain('KKo');
    });
  });

  describe('getRandomHand', () => {
    it('should return a valid hand', () => {
      const allHands = generateAllHands();
      const randomHand = getRandomHand();
      expect(allHands).toContain(randomHand);
    });

    it('should return different hands on multiple calls', () => {
      const hands = new Set();
      for (let i = 0; i < 50; i++) {
        hands.add(getRandomHand());
      }
      // With 50 calls, we should get at least a few different hands
      expect(hands.size).toBeGreaterThan(10);
    });
  });
});
