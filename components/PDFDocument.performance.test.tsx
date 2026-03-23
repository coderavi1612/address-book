import { describe, it, expect } from 'vitest';
import { renderToString } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument';
import { AddressBlock, GridConfig } from '@/types/block';

/**
 * Mock grid configuration matching A4 dimensions
 */
const mockGridConfig: GridConfig = {
  columns: 3,
  rows: 3,
  unitWidth: 160.63,
  unitHeight: 242.84,
  pageWidth: 595.28,
  pageHeight: 841.89,
  margin: 56.69,
};

/**
 * Helper function to create mock blocks
 */
const createMockBlock = (overrides: Partial<AddressBlock> = {}): AddressBlock => ({
  id: `block-${Math.random().toString(36).substr(2, 9)}`,
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
 * Helper function to generate multiple blocks
 */
const generateBlocks = (count: number): AddressBlock[] => {
  const blocks: AddressBlock[] = [];
  const blocksPerPage = 9; // 3x3 grid
  
  for (let i = 0; i < count; i++) {
    const pageNumber = Math.floor(i / blocksPerPage) + 1;
    const positionInPage = i % blocksPerPage;
    const x = positionInPage % 3;
    const y = Math.floor(positionInPage / 3);
    
    blocks.push(
      createMockBlock({
        id: `block-${i}`,
        names: [`Person ${i}`, `Family Member ${i}`],
        address: `${i} Test Street, City, State 12345`,
        mobile: `555-${String(i).padStart(4, '0')}`,
        x,
        y,
        page_number: pageNumber,
      })
    );
  }
  
  return blocks;
};

describe('PDFDocument Performance Tests', () => {
  /**
   * Test PDF generation time with large layouts
   * **Validates: Requirements 20.5**
   */
  describe('PDF Generation Performance', () => {
    it('should generate PDF with 100 blocks within 5 seconds', async () => {
      const blocks = generateBlocks(100);
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should generate within 5 seconds as per requirement 20.5
      expect(generationTime).toBeLessThan(5000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      expect(pdfString.length).toBeGreaterThan(10000);
    });

    it('should generate PDF with 50 blocks efficiently', async () => {
      const blocks = generateBlocks(50);
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should be faster with fewer blocks
      expect(generationTime).toBeLessThan(2500);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });

    it('should generate PDF with 150 blocks within reasonable time', async () => {
      const blocks = generateBlocks(150);
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should still complete within 7.5 seconds (1.5x the 100-block requirement)
      expect(generationTime).toBeLessThan(7500);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });

    it('should handle multiple PDF generations without performance degradation', async () => {
      const blocks = generateBlocks(100);
      const generationTimes: number[] = [];
      
      // Generate PDF 3 times
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        
        await renderToString(
          <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
        );
        
        const endTime = performance.now();
        generationTimes.push(endTime - startTime);
      }
      
      // All generations should be within 5 seconds
      generationTimes.forEach((time) => {
        expect(time).toBeLessThan(5000);
      });
      
      // Performance should not degrade significantly
      const firstTime = generationTimes[0];
      const lastTime = generationTimes[generationTimes.length - 1];
      const degradation = (lastTime - firstTime) / firstTime;
      
      // Degradation should be less than 100% (allowing for JIT warmup and GC)
      expect(Math.abs(degradation)).toBeLessThan(1.0);
    });
  });

  /**
   * Test PDF generation with complex layouts
   * **Validates: Requirements 20.5**
   */
  describe('Complex Layout Performance', () => {
    it('should handle blocks with multiple names efficiently', async () => {
      const blocks = generateBlocks(100).map((block) => ({
        ...block,
        names: ['Name 1', 'Name 2', 'Name 3', 'Name 4', 'Name 5'],
      }));
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should still complete within 5 seconds even with complex content
      expect(generationTime).toBeLessThan(5000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });

    it('should handle blocks with long addresses efficiently', async () => {
      const blocks = generateBlocks(100).map((block) => ({
        ...block,
        address: 'This is a very long address with multiple lines and lots of text to test performance with complex content that spans multiple lines in the PDF document',
      }));
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should still complete within 5 seconds
      expect(generationTime).toBeLessThan(5000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });

    it('should handle blocks with varying sizes efficiently', async () => {
      const blocks = generateBlocks(100).map((block, index) => ({
        ...block,
        width: (index % 3) + 1,
        height: (index % 3) + 1,
      }));
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should still complete within 5 seconds
      expect(generationTime).toBeLessThan(5000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });
  });

  /**
   * Test PDF generation with multi-page layouts
   * **Validates: Requirements 20.5**
   */
  describe('Multi-Page Performance', () => {
    it('should generate 12-page PDF (100+ blocks) efficiently', async () => {
      const blocks = generateBlocks(108); // 12 pages with 9 blocks each
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(generationTime).toBeLessThan(5000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
      
      // PDF should be substantial in size
      expect(pdfString.length).toBeGreaterThan(15000);
    });

    it('should handle sparse multi-page layouts efficiently', async () => {
      // Create blocks spread across many pages with gaps
      const blocks: AddressBlock[] = [];
      for (let page = 1; page <= 20; page += 2) {
        blocks.push(
          createMockBlock({
            id: `block-page-${page}`,
            names: [`Person on page ${page}`],
            page_number: page,
          })
        );
      }
      
      const startTime = performance.now();
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      // Should be fast with sparse layout
      expect(generationTime).toBeLessThan(2000);
      
      // Verify PDF was generated successfully
      expect(pdfString).toContain('%PDF');
      expect(pdfString).toContain('%%EOF');
    });
  });

  /**
   * Test PDF output size and quality
   * **Validates: Requirements 20.5**
   */
  describe('PDF Output Quality', () => {
    it('should produce reasonable file size for 100 blocks', async () => {
      const blocks = generateBlocks(100);
      
      const pdfString = await renderToString(
        <PDFDocument blocks={blocks} gridConfig={mockGridConfig} />
      );
      
      // PDF should be substantial but not excessively large
      // Typical range: 20KB - 500KB for 100 blocks
      expect(pdfString.length).toBeGreaterThan(20000);
      expect(pdfString.length).toBeLessThan(500000);
    });

    it('should maintain consistent output size per block', async () => {
      const blocks50 = generateBlocks(50);
      const blocks100 = generateBlocks(100);
      
      const pdf50 = await renderToString(
        <PDFDocument blocks={blocks50} gridConfig={mockGridConfig} />
      );
      
      const pdf100 = await renderToString(
        <PDFDocument blocks={blocks100} gridConfig={mockGridConfig} />
      );
      
      // Size should scale roughly linearly
      const ratio = pdf100.length / pdf50.length;
      
      // Ratio should be between 1.5 and 2.5 (accounting for PDF overhead)
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(2.5);
    });
  });
});
