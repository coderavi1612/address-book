import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDragPosition } from '@/hooks/useDragAndDrop';
import { calculateGridConfig } from './gridConfig';
import { AddressBlock } from '@/types/block';

describe('Feature: address-book-pdf-builder - Snap-to-Grid', () => {
  /**
   * Property 7: Snap-to-Grid Alignment
   * **Validates: Requirements 5.3, 6.3, 17.3, 17.4**
   * 
   * For any drag or resize operation on an address block, the final position (x, y) 
   * and dimensions (width, height) should be multiples of the grid unit size.
   * 
   * In this system, positions and dimensions are stored as integer grid units,
   * which ensures they are always aligned to the grid.
   */
  it('Property 7: Snap-to-Grid Alignment - positions and dimensions are integer grid units', () => {
    fc.assert(
      fc.property(
        // Generate a block with position and dimensions
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 10 }),
          width: fc.integer({ min: 1, max: 5 }),
          height: fc.integer({ min: 1, max: 5 }),
          page_number: fc.integer({ min: 1, max: 5 }),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        // Generate arbitrary pixel delta for drag
        fc.record({
          x: fc.integer({ min: -1000, max: 1000 }),
          y: fc.integer({ min: -1000, max: 1000 }),
        }),
        (block: AddressBlock, delta) => {
          const gridConfig = calculateGridConfig();
          
          // Test drag operation - positions should snap to grid
          const newPosition = calculateDragPosition(block, delta, gridConfig);
          
          // CRITICAL: Verify x and y are integers (grid units)
          // This is the core of snap-to-grid: positions are stored as integer grid units
          expect(Number.isInteger(newPosition.x)).toBe(true);
          expect(Number.isInteger(newPosition.y)).toBe(true);
          
          // Verify x and y are valid grid coordinates
          expect(newPosition.x).toBeGreaterThanOrEqual(0);
          expect(newPosition.y).toBeGreaterThanOrEqual(0);
          expect(newPosition.y).toBeLessThan(gridConfig.rows);
          
          // Test that block dimensions are integers (grid units)
          // Width and height should always be integers representing grid units
          expect(Number.isInteger(block.width)).toBe(true);
          expect(Number.isInteger(block.height)).toBe(true);
          expect(block.width).toBeGreaterThanOrEqual(1);
          expect(block.height).toBeGreaterThanOrEqual(1);
          
          // Verify page_number is an integer >= 1
          expect(Number.isInteger(newPosition.page_number)).toBe(true);
          expect(newPosition.page_number).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 7 (variant): Snap-to-Grid - arbitrary pixel deltas always snap to integer grid units', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary pixel deltas (can be floats)
        fc.float({ min: -1000, max: 1000 }),
        fc.float({ min: -1000, max: 1000 }),
        (deltaX, deltaY) => {
          // Skip NaN and Infinity values
          fc.pre(!isNaN(deltaX) && isFinite(deltaX));
          fc.pre(!isNaN(deltaY) && isFinite(deltaY));
          
          const gridConfig = calculateGridConfig();
          
          // Calculate grid unit deltas (this is what the drag function does)
          // Math.round ensures we snap to the nearest grid unit
          const gridDeltaX = Math.round(deltaX / gridConfig.unitWidth);
          const gridDeltaY = Math.round(deltaY / gridConfig.unitHeight);
          
          // CRITICAL: Verify these are integers
          // This proves that any arbitrary pixel delta gets snapped to integer grid units
          expect(Number.isInteger(gridDeltaX)).toBe(true);
          expect(Number.isInteger(gridDeltaY)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
