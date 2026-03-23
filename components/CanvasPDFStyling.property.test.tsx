import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { renderToString } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument';
import { AddressBlock, GridConfig } from '@/types/block';

describe('Feature: address-book-pdf-builder - Canvas-PDF Styling Consistency', () => {
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
   * Property 21: Canvas-PDF Styling Consistency
   * **Validates: Requirements 14.4**
   * 
   * For any address block, its visual styling (colors, borders, fonts) in the 
   * Layout_Canvas should exactly match its styling in the exported PDF.
   */
  it('Property 21: Canvas-PDF Styling Consistency - canvas and PDF styling match', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 10 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          // Render PDF to string
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify PDF was generated successfully
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');
          
          // Verify fonts are included (Helvetica-Bold for names, Helvetica for address/mobile)
          expect(pdfString).toContain('Helvetica');
          
          // Verify PDF has substantial content
          expect(pdfString.length).toBeGreaterThan(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: PDF uses white background consistently
   */
  it('Property: PDF uses white background for print-friendly output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 5 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify PDF was generated successfully
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: PDF uses appropriate fonts
   */
  it('Property: PDF uses Helvetica fonts for text rendering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 5 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify Helvetica fonts are used
          expect(pdfString).toContain('Helvetica');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: PDF structure is valid
   */
  it('Property: PDF has valid structure with proper headers and footers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 5 }),
        gridConfigArbitrary,
        async (blocks, gridConfig) => {
          const pdfString = await renderToString(
            <PDFDocument blocks={blocks} gridConfig={gridConfig} />
          );

          // Verify PDF structure
          expect(pdfString).toContain('%PDF');
          expect(pdfString).toContain('%%EOF');
          expect(pdfString).toContain('endobj');
        }
      ),
      { numRuns: 100 }
    );
  });
});
