import { describe, it, expect } from 'vitest';
import { calculateGridConfig } from './gridConfig';

describe('calculateGridConfig', () => {
  it('should return correct A4 dimensions and margins', () => {
    const config = calculateGridConfig();
    
    expect(config.pageWidth).toBe(595.28);
    expect(config.pageHeight).toBe(841.89);
    expect(config.margin).toBe(56.69);
  });

  it('should return 3x3 grid configuration', () => {
    const config = calculateGridConfig();
    
    expect(config.columns).toBe(3);
    expect(config.rows).toBe(3);
  });

  it('should calculate unit dimensions correctly', () => {
    const config = calculateGridConfig();
    
    const expectedUsableWidth = 595.28 - (56.69 * 2);
    const expectedUsableHeight = 841.89 - (56.69 * 2);
    const expectedUnitWidth = expectedUsableWidth / 3;
    const expectedUnitHeight = expectedUsableHeight / 3;
    
    expect(config.unitWidth).toBeCloseTo(expectedUnitWidth, 2);
    expect(config.unitHeight).toBeCloseTo(expectedUnitHeight, 2);
  });
});
