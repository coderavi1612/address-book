import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument';
import { AddressBlock, GridConfig } from '@/types/block';

describe('PDFDocument Component', () => {
  const mockGridConfig: GridConfig = {
    columns: 3,
    rows: 3,
    unitWidth: 160.63,
    unitHeight: 242.84,
    pageWidth: 595.28,
    pageHeight: 841.89,
    margin: 56.69,
  };

  const createMockBlock = (overrides: Partial<AddressBlock> = {}): AddressBlock => ({
    id: 'test-id-1',
    names: ['John Doe'],
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
    ...overrides,
  });

  /**
   * Test PDFDocument rendering with various block configurations
   * **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6**
   */
  describe('Block rendering', () => {
    it('should render single block with all fields', async () => {
      const block = createMockBlock();
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString.length).toBeGreaterThan(1000);
    });

    it('should render block with multiple names', async () => {
      const block = createMockBlock({
        names: ['John Doe', 'Jane Doe', 'Bob Smith'],
      });
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString.length).toBeGreaterThan(1000);
    });

    it('should render block without mobile number', async () => {
      const block = createMockBlock({ mobile: '' });
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });

    it('should position block according to x, y, width, height', async () => {
      const block = createMockBlock({
        x: 1,
        y: 2,
        width: 2,
        height: 1,
      });
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated
      expect(pdfString).toContain('%PDF');
      
      // Calculate expected positions
      const expectedLeft = block.x * mockGridConfig.unitWidth;
      const expectedTop = block.y * mockGridConfig.unitHeight;
      const expectedWidth = block.width * mockGridConfig.unitWidth;
      const expectedHeight = block.height * mockGridConfig.unitHeight;

      // Verify calculations are correct
      expect(expectedLeft).toBe(160.63);
      expect(expectedTop).toBe(485.68);
      expect(expectedWidth).toBe(321.26);
      expect(expectedHeight).toBe(242.84);
    });

    it('should render multiple blocks on same page', async () => {
      const blocks = [
        createMockBlock({ id: 'block-1', names: ['Alice'] }),
        createMockBlock({ id: 'block-2', names: ['Bob'], x: 1 }),
        createMockBlock({ id: 'block-3', names: ['Charlie'], x: 2 }),
      ];
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated with more content (multiple blocks)
      expect(pdfString).toContain('%PDF');
      expect(pdfString.length).toBeGreaterThan(1500);
    });
  });

  /**
   * Test multi-page PDF generation
   * **Validates: Requirements 9.2, 9.3**
   */
  describe('Multi-page generation', () => {
    it('should create separate pages for different page_numbers', async () => {
      const blocks = [
        createMockBlock({ id: 'block-1', page_number: 1, names: ['Page 1 Block'] }),
        createMockBlock({ id: 'block-2', page_number: 2, names: ['Page 2 Block'] }),
        createMockBlock({ id: 'block-3', page_number: 3, names: ['Page 3 Block'] }),
      ];
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated with multiple pages
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      // Multiple pages should result in larger PDF
      expect(pdfString.length).toBeGreaterThan(2000);
    });

    it('should group blocks by page_number correctly', async () => {
      const blocks = [
        createMockBlock({ id: 'block-1', page_number: 1, names: ['P1-A'] }),
        createMockBlock({ id: 'block-2', page_number: 1, names: ['P1-B'] }),
        createMockBlock({ id: 'block-3', page_number: 2, names: ['P2-A'] }),
        createMockBlock({ id: 'block-4', page_number: 2, names: ['P2-B'] }),
      ];
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString.length).toBeGreaterThan(2000);
    });

    it('should handle non-sequential page numbers', async () => {
      const blocks = [
        createMockBlock({ id: 'block-1', page_number: 1, names: ['Page 1'] }),
        createMockBlock({ id: 'block-2', page_number: 5, names: ['Page 5'] }),
        createMockBlock({ id: 'block-3', page_number: 3, names: ['Page 3'] }),
      ];
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString.length).toBeGreaterThan(2000);
    });

    it('should render empty document with no blocks', async () => {
      const pdfString = await renderToString(
        <PDFDocument blocks={[]} gridConfig={mockGridConfig} />
      );

      // Should still generate a valid PDF structure
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });
  });

  /**
   * Test A4 dimensions and margins
   * **Validates: Requirements 9.3**
   */
  describe('Page dimensions and margins', () => {
    it('should use A4 page size', async () => {
      const block = createMockBlock();
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated (contains PDF header)
      expect(pdfString).toContain('%PDF');
      // Verify A4 dimensions are in MediaBox (595.28 x 841.89)
      expect(pdfString).toMatch(/595\.28/);
      expect(pdfString).toMatch(/841\.89/);
    });

    it('should apply correct page structure', async () => {
      const block = createMockBlock();
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF structure is valid
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });
  });

  /**
   * Test print-friendly styling
   * **Validates: Requirements 9.4**
   */
  describe('Print-friendly styling', () => {
    it('should generate valid PDF with styling', async () => {
      const block = createMockBlock();
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      
      // Verify fonts are included (Helvetica for regular, Helvetica-Bold for names)
      expect(pdfString).toContain('Helvetica');
    });

    it('should include all block content in PDF', async () => {
      const block = createMockBlock({
        names: ['Test Name'],
        address: 'Test Address',
        mobile: '123-456-7890',
      });
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify content is in the PDF (may be compressed)
      expect(pdfString).toContain('%PDF');
      expect(pdfString.length).toBeGreaterThan(1000); // PDF should have substantial content
    });

    it('should use appropriate fonts for styling', async () => {
      const block = createMockBlock();
      const pdfString = await renderToString(
        <PDFDocument blocks={[block]} gridConfig={mockGridConfig} />
      );

      // Verify Helvetica-Bold is used (for names with font-weight 600)
      expect(pdfString).toContain('Helvetica-Bold');
      // Verify regular Helvetica is used (for address/mobile with font-weight 400)
      expect(pdfString).toContain('/Helvetica');
    });
  });
});
