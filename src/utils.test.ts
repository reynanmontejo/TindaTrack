import { calculateChangePercent, calculateUnitCost, parseMoneyToCents, shiftDateKey } from './utils';

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

  it('calculates tingi cost from a pack price', () => {
    expect(calculateUnitCost(24000, 24)).toBe(1000);
    expect(calculateUnitCost(10000, 3)).toBe(3333);
    expect(calculateUnitCost(10000, 0)).toBe(0);
  });
});
