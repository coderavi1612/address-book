import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateResizeDimensions } from './useResize';
import { calculateGridConfig } from '@/lib/gridConfig';
import { AddressBlock } from '@/types/block';

describe('Feature: address-book-pdf-builder - useResize', () => {
  /**
   * Property 9: Block Resize Update
   * **Validates: Requirements 6.2, 6.4**
   * 
   * For any address block and any valid dimensions, resizing the block should update 
   * its width and height properties in both the store and database.
   */
  it('Property 9: Block Resize Update - resizing updates width and height correctly', () => {
    fc.assert(
      fc.property(
        // Generate a block with initial dimensions
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
        // Generate delta values for resize
        fc.record({
          width: fc.integer({ min: -300, max: 300 }),
          height: fc.integer({ min: -300, max: 300 }),
        }),
        (block: AddressBlock, delta) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate expected new dimensions
          const deltaWidthUnits = Math.round(delta.width / gridConfig.unitWidth);
          const deltaHeightUnits = Math.round(delta.height / gridConfig.unitHeight);
          const expectedWidth = Math.max(1, block.width + deltaWidthUnits);
          const expectedHeight = Math.max(1, block.height + deltaHeightUnits);
          
          // Calculate dimensions using the function
          const result = calculateResizeDimensions(block, delta.width, delta.height, gridConfig);
          
          // Verify the result matches expected values
          expect(result.width).toBe(expectedWidth);
          expect(result.height).toBe(expectedHeight);
          
          // Verify width and height are at least 1 (minimum constraint)
          expect(result.width).toBeGreaterThanOrEqual(1);
          expect(result.height).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Minimum Dimensions Constraint
   * **Validates: Requirements 6.5**
   * 
   * For any resize operation on an address block, the resulting width and height 
   * should both be at least 1 grid unit.
   */
  it('Property 10: Minimum Dimensions Constraint - width and height are always at least 1 grid unit', () => {
    fc.assert(
      fc.property(
        // Generate a block with small dimensions
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
        // Generate large negative deltas to test minimum constraint
        fc.record({
          width: fc.integer({ min: -1000, max: 0 }),
          height: fc.integer({ min: -1000, max: 0 }),
        }),
        (block: AddressBlock, delta) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate dimensions using the function
          const result = calculateResizeDimensions(block, delta.width, delta.height, gridConfig);
          
          // Verify minimum dimensions are enforced
          expect(result.width).toBeGreaterThanOrEqual(1);
          expect(result.height).toBeGreaterThanOrEqual(1);
          
          // Verify they are exactly 1 when negative deltas would make them smaller
          const deltaWidthUnits = Math.round(delta.width / gridConfig.unitWidth);
          const deltaHeightUnits = Math.round(delta.height / gridConfig.unitHeight);
          
          if (block.width + deltaWidthUnits < 1) {
            expect(result.width).toBe(1);
          }
          
          if (block.height + deltaHeightUnits < 1) {
            expect(result.height).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('useResize - Unit Tests', () => {
  const gridConfig = calculateGridConfig();
  
  /**
   * Unit test: Resize calculations with various deltas
   * **Validates: Requirements 6.2, 6.4**
   */
  it('should handle resize with positive delta', () => {
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
    
    const deltaWidth = gridConfig.unitWidth * 2;
    const deltaHeight = gridConfig.unitHeight * 2;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    expect(result.width).toBe(3); // 1 + 2
    expect(result.height).toBe(3); // 1 + 2
  });
  
  it('should handle resize with negative delta (clamped to 1)', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    const deltaWidth = -1000;
    const deltaHeight = -1000;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    // Should clamp to 1
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });
  
  it('should handle resize with zero delta (no change)', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 2,
      height: 3,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    const deltaWidth = 0;
    const deltaHeight = 0;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    // Should remain same dimensions
    expect(result.width).toBe(2);
    expect(result.height).toBe(3);
  });
  
  /**
   * Unit test: Minimum dimension enforcement
   * **Validates: Requirements 6.5**
   */
  it('should enforce minimum width of 1 grid unit', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 2,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Try to make width smaller than 1
    const deltaWidth = -gridConfig.unitWidth * 2;
    const deltaHeight = 0;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    expect(result.width).toBe(1);
    expect(result.height).toBe(2);
  });
  
  it('should enforce minimum height of 1 grid unit', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 2,
      height: 1,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Try to make height smaller than 1
    const deltaWidth = 0;
    const deltaHeight = -gridConfig.unitHeight * 2;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    expect(result.width).toBe(2);
    expect(result.height).toBe(1);
  });
  
  /**
   * Unit test: Snap-to-grid behavior
   * **Validates: Requirements 6.3**
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
    const deltaWidth = gridConfig.unitWidth * 0.6;
    const deltaHeight = gridConfig.unitHeight * 0.4;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    // Should snap to nearest grid unit (0.6 rounds to 1, 0.4 rounds to 0)
    expect(result.width).toBe(2); // 1 + 1
    expect(result.height).toBe(1); // 1 + 0
  });
  
  it('should handle mixed positive and negative deltas', () => {
    const block: AddressBlock = {
      id: '1',
      names: ['Test'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 3,
      height: 3,
      page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    
    // Increase width, decrease height
    const deltaWidth = gridConfig.unitWidth * 1;
    const deltaHeight = -gridConfig.unitHeight * 1;
    const result = calculateResizeDimensions(block, deltaWidth, deltaHeight, gridConfig);
    
    expect(result.width).toBe(4); // 3 + 1
    expect(result.height).toBe(2); // 3 - 1
  });
});
