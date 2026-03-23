import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDragPosition } from '@/hooks/useDragAndDrop';
import { calculateGridConfig } from './gridConfig';
import { AddressBlock } from '@/types/block';

describe('Feature: address-book-pdf-builder - Cross-Page Dragging', () => {
  /**
   * Property 8: Cross-Page Dragging
   * **Validates: Requirements 5.5**
   * 
   * For any address block, when dragged to a position that corresponds to a different page, 
   * the page_number property should be updated to reflect the new page.
   * 
   * Page calculation: page_number = floor(y / rows) + 1
   * Within-page y: y % rows
   */
  it('Property 8: Cross-Page Dragging - dragging to different page updates page_number', () => {
    fc.assert(
      fc.property(
        // Generate a block on a specific page
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 2 }), // Within first page (0-2 for 3 rows)
          width: fc.integer({ min: 1, max: 3 }),
          height: fc.integer({ min: 1, max: 3 }),
          page_number: fc.integer({ min: 1, max: 1 }), // Start on page 1
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        // Generate a delta that moves to a different page
        fc.integer({ min: 1, max: 10 }), // Number of pages to move down
        (block: AddressBlock, pagesToMove) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate delta to move to a different page
          // Each page has gridConfig.rows rows
          const rowsToMove = pagesToMove * gridConfig.rows;
          const deltaY = rowsToMove * gridConfig.unitHeight;
          
          const delta = { x: 0, y: deltaY };
          
          // Calculate new position
          const newPosition = calculateDragPosition(block, delta, gridConfig);
          
          // Calculate expected page number
          const totalY = block.y + rowsToMove;
          const expectedPage = Math.floor(totalY / gridConfig.rows) + 1;
          const expectedPageY = totalY % gridConfig.rows;
          
          // Verify page_number was updated correctly
          expect(newPosition.page_number).toBe(expectedPage);
          expect(newPosition.page_number).toBeGreaterThan(block.page_number);
          
          // Verify y coordinate is within page bounds
          expect(newPosition.y).toBe(expectedPageY);
          expect(newPosition.y).toBeGreaterThanOrEqual(0);
          expect(newPosition.y).toBeLessThan(gridConfig.rows);
          
          // Verify x coordinate unchanged (only moved vertically)
          expect(newPosition.x).toBe(block.x);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 8 (variant): Cross-Page Dragging - page_number calculation is consistent', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary y position (can span multiple pages)
        fc.integer({ min: 0, max: 100 }),
        (totalY) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate page number using the formula
          const pageNumber = Math.floor(totalY / gridConfig.rows) + 1;
          const pageY = totalY % gridConfig.rows;
          
          // Verify page_number is at least 1
          expect(pageNumber).toBeGreaterThanOrEqual(1);
          
          // Verify pageY is within bounds
          expect(pageY).toBeGreaterThanOrEqual(0);
          expect(pageY).toBeLessThan(gridConfig.rows);
          
          // Verify we can reconstruct totalY from page_number and pageY
          const reconstructedY = (pageNumber - 1) * gridConfig.rows + pageY;
          expect(reconstructedY).toBe(totalY);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 8 (variant): Cross-Page Dragging - moving up can decrease page_number', () => {
    fc.assert(
      fc.property(
        // Generate a block on a page > 1
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 2 }), // Within page
          width: fc.integer({ min: 1, max: 3 }),
          height: fc.integer({ min: 1, max: 3 }),
          page_number: fc.integer({ min: 2, max: 5 }), // Start on page 2 or higher
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        (block: AddressBlock) => {
          const gridConfig = calculateGridConfig();
          
          // Calculate delta to move up to page 1
          const currentTotalY = (block.page_number - 1) * gridConfig.rows + block.y;
          const targetY = 0; // Move to top of page 1
          const rowsToMove = targetY - currentTotalY;
          const deltaY = rowsToMove * gridConfig.unitHeight;
          
          const delta = { x: 0, y: deltaY };
          
          // Calculate new position
          const newPosition = calculateDragPosition(block, delta, gridConfig);
          
          // Verify page_number decreased to 1
          expect(newPosition.page_number).toBe(1);
          expect(newPosition.page_number).toBeLessThan(block.page_number);
          
          // Verify y coordinate is 0 (top of page 1)
          expect(newPosition.y).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
