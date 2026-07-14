import { describe, it, expect } from 'vitest';
import { generateShortId } from '../../src/lib/shortId';

describe('generateShortId', () => {
  it('returns a 4-character string', () => {
    expect(generateShortId()).toHaveLength(4);
  });

  it('only uses unambiguous characters (no 0/O/1/I)', () => {
    const allowed = /^[A-HJ-NP-Z2-9]{4}$/;
    for (let i = 0; i < 200; i++) {
      expect(generateShortId()).toMatch(allowed);
    }
  });

  it('is deterministic given a fixed random source', () => {
    const createFixedRandom = () => {
      let calls = 0;
      return () => {
        return [0, 0.25, 0.5, 0.75][calls++ % 4];
      };
    };
    const random1 = createFixedRandom();
    const random2 = createFixedRandom();
    expect(generateShortId(random1)).toBe(generateShortId(random2));
  });
});
