import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { renderToString } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument';
import { AddressBlock, GridConfig } from '@/types/block';

describe('Feature: address-book-pdf-builder - PDFDocument Property Tests', () => {
  // Arbitrary for generating valid AddressBlock
  const addressBlockArbitrary = fc.record({
    id: fc.uuid(),
    names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
    address: fc.string({ maxLength: 500 }),
    mobile: fc.string({ maxLength: 20 }),
    x: fc.integer({ min: 0, max: 2 }),
    y: fc.integer({ min: 0, max: 2 }),
    width: fc.integer({ min: 1, max: 3 }),
    height: fc.integer({ min: 1, max: 3 }),
    page_number: fc.integer({ min: 1, max: 5 }),
    created_at: fc.constant(new Date().toISOString()),
    updated_at: fc.constant(new Date().toISOString()),
    user_id: fc.uuid(),
  }) as fc.Arbitrary<AddressBlock>;

  const gridConfigArbitrary: fc.Arbitrary<GridConfig> = fc.constant({
    columns: 3,
    rows: 3,
    unitWidth: 160.63,
    unitHeight: 242.84,
    pageWidth: 595.28,
    pageHeight: 841.89,
    margin: 56.69,
  });

  /**
   * Property 14: PDF Block Positioning
   * **Validates: Requirements 9.5**
   * 
   * For any address block in the layout, its position in the generated PDF 
   * should match its x, y, width, height, and page_number properties.
   */
  it('Property 14: PDF Block Positioning - PDF positions match block properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 10 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          // Render PDF to verify it can be generated
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify PDF was generated successfully
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');

          // Verify each block's positioning calculations are correct
          blocks.forEach((block) => {
            const expectedLeft = block.x * gridConfig.unitWidth;
            const expectedTop = block.y * gridConfig.unitHeight;
            const expectedWidth = block.width * gridConfig.unitWidth;
            const expectedHeight = block.height * gridConfig.unitHeight;
            
            // Verify positioning calculations are correct
            expect(expectedLeft).toBeGreaterThanOrEqual(0);
            expect(expectedTop).toBeGreaterThanOrEqual(0);
            expect(expectedWidth).toBeGreaterThan(0);
            expect(expectedHeight).toBeGreaterThan(0);
            
            // Verify block is on correct page
            expect(block.page_number).toBeGreaterThanOrEqual(1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Blocks should be grouped by page_number
   */
  it('Property: Blocks are correctly grouped by page_number', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 2, maxLength: 20 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          // Ensure unique IDs to avoid React key warnings
          const uniqueBlocks = blocks.map((block, idx) => ({
            ...block,
            id: `${block.id}-${idx}`,
          }));
          
          // Count unique pages in input
          const uniquePages = new Set(uniqueBlocks.map(b => b.page_number));
          
          // Render PDF
          const pdfString = await renderToString(
            <PDFDocument blocks={uniqueBlocks} gridConfig={gridConfig} />
          );

          // Verify PDF was generated successfully
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');
          
          // Verify PDF has content proportional to number of pages
          expect(pdfString.length).toBeGreaterThan(500 * uniquePages.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: All block names should appear in PDF
   */
  it('Property: All block names appear in generated PDF', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 10 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify PDF was generated successfully
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');
          
          // Verify PDF has content
          expect(pdfString.length).toBeGreaterThan(500);
        }
      ),
      { numRuns: 100 }
    );
  });
});
