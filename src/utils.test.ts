import { calculateChangePercent, parseMoneyToCents, shiftDateKey } from './utils';

describe('business utilities', () => {
  it('converts peso input to integer centavos', () => {
    expect(parseMoneyToCents('₱15.25')).toBe(1525);
  });

  it('calculates period change', () => {
    expect(calculateChangePercent(1120, 1000)).toBe(12);
    expect(calculateChangePercent(500, 0)).toBeNull();
  });

  it('shifts local date keys safely', () => {
    expect(shiftDateKey('2026-09-14', -1)).toBe('2026-09-13');
  });
});
