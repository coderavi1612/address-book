import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useExportPDF } from './useExportPDF';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';
import * as reactPdf from '@react-pdf/renderer';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(),
  Document: vi.fn(),
  Page: vi.fn(),
  View: vi.fn(),
  Text: vi.fn(),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/gridConfig', () => ({
  calculateGridConfig: vi.fn(() => ({
    columns: 3,
    rows: 3,
    unitWidth: 160.63,
    unitHeight: 242.84,
    pageWidth: 595.28,
    pageHeight: 841.89,
    margin: 56.69,
  })),
}));

describe('useExportPDF Hook', () => {
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

  beforeEach(() => {
    // Ensure DOM is set up
    if (!document.body) {
      const body = document.createElement('body');
      document.documentElement.appendChild(body);
    }
    
    // Reset store
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
      history: [],
      historyIndex: -1,
    });

    // Clear mocks
    vi.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement and related methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test PDF blob generation
   * **Validates: Requirements 9.1, 9.2**
   */
  describe('PDF generation', () => {
    it('should generate PDF blob and trigger download', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      // Render the hook with explicit container
      const { result } = renderHook(() => useExportPDF(), {
        container: document.body
      });
      
      await result.current.exportPDF();

      // Verify PDF was generated
      expect(reactPdf.pdf).toHaveBeenCalled();
      expect(mockToBlob).toHaveBeenCalled();

      // Verify download was triggered
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      
      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith('PDF exported successfully');
    });

    it('should generate PDF with multiple blocks', async () => {
      const blocks = [
        createMockBlock({ id: 'block-1', names: ['Alice'] }),
        createMockBlock({ id: 'block-2', names: ['Bob'] }),
        createMockBlock({ id: 'block-3', names: ['Charlie'] }),
      ];
      useBlockStore.setState({ blocks });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });
      await result.current.exportPDF();

      expect(reactPdf.pdf).toHaveBeenCalled();
      expect(mockToBlob).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should generate PDF with empty blocks array', async () => {
      useBlockStore.setState({ blocks: [] });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });
      await result.current.exportPDF();

      expect(reactPdf.pdf).toHaveBeenCalled();
      expect(mockToBlob).toHaveBeenCalled();
    });
  });

  /**
   * Test error handling
   * **Validates: Requirements 9.7, 19.1, 19.2**
   */
  describe('Error handling', () => {
    it('should handle PDF generation errors with user-friendly message', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const error = new Error('PDF generation failed');
      const mockToBlob = vi.fn().mockRejectedValue(error);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });

      await result.current.exportPDF();

      // Wait for state update
      await waitFor(() => {
        expect(result.current.error).toBe('PDF generation failed');
      });
      
      // Verify error toast
      expect(toast.error).toHaveBeenCalledWith('Failed to export PDF');
    });

    it('should handle unknown errors gracefully', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const mockToBlob = vi.fn().mockRejectedValue('Unknown error');
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });

      await result.current.exportPDF();

      // Wait for state update
      await waitFor(() => {
        expect(result.current.error).toBe('An unexpected error occurred');
      });
      expect(toast.error).toHaveBeenCalledWith('Failed to export PDF');
    });

    it('should log errors to console', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const mockToBlob = vi.fn().mockRejectedValue(error);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });

      await result.current.exportPDF();

      expect(consoleErrorSpy).toHaveBeenCalledWith('PDF export failed:', error);
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should clear error state', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const error = new Error('PDF generation failed');
      const mockToBlob = vi.fn().mockRejectedValue(error);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });

      await result.current.exportPDF();
      
      // Wait for error state to be set
      await waitFor(() => {
        expect(result.current.error).toBe('PDF generation failed');
      });
      
      // Clear error
      result.current.clearError();
      
      // Wait for error to be cleared
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  /**
   * Test download functionality
   * **Validates: Requirements 9.7**
   */
  describe('Browser download', () => {
    it('should create download link with correct filename', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });
      await result.current.exportPDF();

      // Verify link was created with correct attributes
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toMatch(/^address-book-\d+\.pdf$/);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should clean up blob URL after download', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });
      await result.current.exportPDF();

      // Verify URL was revoked
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should remove link element from DOM after download', async () => {
      const blocks = [createMockBlock()];
      useBlockStore.setState({ blocks });

      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      const mockToBlob = vi.fn().mockResolvedValue(mockBlob);
      vi.mocked(reactPdf.pdf).mockReturnValue({ toBlob: mockToBlob } as any);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const { result } = renderHook(() => useExportPDF(), { container: document.body });
      await result.current.exportPDF();

      // Verify link was added and removed from DOM
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });
});
