import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDragPosition } from './useDragAndDrop';
import { calculateGridConfig } from '@/lib/gridConfig';
import { AddressBlock } from '@/types/block';

describe('Feature: address-book-pdf-builder - useDragAndDrop', () => {
  /**
   * Property 6: Drag Position Update
   * **Validates: Requirements 5.2, 5.4**
   * 
   * For any address block and any valid grid position, dragging the block to that position 
   * should update its x, y, and page_number properties in both the store and database.
   */
  it('Property 6: Drag Position Update - dragging updates x, y, page_number correctly', () => {
    fc.assert(
      fc.property(
        // Generate a block with initial position
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 10 }),
          width: fc.integer({ min: 1, max: 3 }),
          height: fc.integer({ min: 1, max: 3 }),
          page_number: fc.integer({ min: 1, max: 5 }),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        // Generate delta values for drag
        fc.record({
          x: fc.integer({ min: -500, max: 500 }),
          y: fc.integer({ min: -500, max: 500 }),
        }),
        (block: AddressBlock, delta) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate expected new position
          const deltaX = Math.round(delta.x / gridConfig.unitWidth);
          const deltaY = Math.round(delta.y / gridConfig.unitHeight);
          const newX = Math.max(0, block.x + deltaX);
          const newY = Math.max(0, block.y + deltaY);
          const expectedPage = Math.floor(newY / gridConfig.rows) + 1;
          const expectedPageY = newY % gridConfig.rows;
          
          // Calculate position using the function
          const result = calculateDragPosition(block, delta, gridConfig);
          
          // Verify the result matches expected values
          expect(result.x).toBe(newX);
          expect(result.y).toBe(expectedPageY);
          expect(result.page_number).toBe(expectedPage);
          
          // Verify x and y are non-negative
          expect(result.x).toBeGreaterThanOrEqual(0);
          expect(result.y).toBeGreaterThanOrEqual(0);
          
          // Verify page_number is at least 1
          expect(result.page_number).toBeGreaterThanOrEqual(1);
          
          // Verify y is within page bounds (0 to rows-1)
          expect(result.y).toBeLessThan(gridConfig.rows);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('useDragAndDrop - Unit Tests', () => {
  const gridConfig = calculateGridConfig();
  
  /**
   * Unit test: Drag end handler with various delta values
   * **Validates: Requirements 5.2, 5.4**
   */
  it('should handle drag with positive delta', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    const delta = { x: 100, y: 100 };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.page_number).toBeGreaterThanOrEqual(1);
  });
  
  it('should handle drag with negative delta (clamped to 0)', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    const delta = { x: -1000, y: -1000 };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should clamp to 0
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.page_number).toBe(1);
  });
  
  it('should handle drag with zero delta (no movement)', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 2,
      y: 1,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    const delta = { x: 0, y: 0 };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should remain in same position
    expect(result.x).toBe(2);
    expect(result.y).toBe(1);
    expect(result.page_number).toBe(1);
  });
  
  /**
   * Unit test: Page calculation logic
   * **Validates: Requirements 5.5**
   */
  it('should calculate page number correctly when dragging down', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Move down by 3 rows (one full page for 3x3 grid)
    const delta = { x: 0, y: gridConfig.rows * gridConfig.unitHeight };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should be on page 2
    expect(result.page_number).toBe(2);
    expect(result.y).toBe(0); // Top of page 2
  });
  
  it('should calculate page number correctly when dragging to middle of page 2', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Move down by 4 rows (into page 2)
    const delta = { x: 0, y: (gridConfig.rows + 1) * gridConfig.unitHeight };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should be on page 2, row 1
    expect(result.page_number).toBe(2);
    expect(result.y).toBe(1);
  });
  
  it('should handle dragging to page 3 and beyond', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Move down by 7 rows (into page 3)
    const delta = { x: 0, y: 7 * gridConfig.unitHeight };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should be on page 3, row 1 (7 / 3 = 2 pages + 1 row)
    expect(result.page_number).toBe(3);
    expect(result.y).toBe(1);
  });
  
  /**
   * Unit test: Snap-to-grid behavior
   * **Validates: Requirements 5.3**
   */
  it('should snap fractional pixel deltas to nearest grid unit', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Use fractional pixel values
    const delta = { x: gridConfig.unitWidth * 0.6, y: gridConfig.unitHeight * 0.4 };
    const result = calculateDragPosition(block, delta, gridConfig);
    
    // Should snap to nearest grid unit (0.6 rounds to 1, 0.4 rounds to 0)
    expect(result.x).toBe(1);
    expect(result.y).toBe(0);
  });
});
