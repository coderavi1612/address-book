import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorLayout } from './EditorLayout';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

/**
 * Accessibility Tests for EditorLayout Component
 * Requirements: 14.1, 14.2, 14.3
 */

// Mock dependencies
vi.mock('@/store/blockStore');
vi.mock('@/app/actions/blocks', () => ({
  createBlock: vi.fn().mockResolvedValue({
    id: 'new-block',
    names: ['New Contact'],
    address: '',
    mobile: '',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  }),
}));
vi.mock('@/hooks/useExportPDF', () => ({
  useExportPDF: () => ({
    exportPDF: vi.fn(),
    isExporting: false,
    error: null,
    clearError: vi.fn(),
  }),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('./BlockEditor', () => ({
  BlockEditor: () => <div data-testid="block-editor">Block Editor</div>,
}));
vi.mock('./LayoutCanvas', () => ({
  LayoutCanvas: () => <div data-testid="layout-canvas">Layout Canvas</div>,
}));
vi.mock('./Toolbar', () => ({
  Toolbar: ({ onAddBlock, onExportPDF }: any) => (
    <div data-testid="toolbar">
      <button onClick={onAddBlock}>Add Block</button>
      <button onClick={onExportPDF}>Export PDF</button>
    </div>
  ),
}));

const mockBlocks: AddressBlock[] = [
  {
    id: 'block-1',
    names: ['John Doe'],
    address: '123 Main St',
    mobile: '123-456-7890',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  },
];

describe('EditorLayout Accessibility Tests', () => {
  let mockStoreState: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStoreState = {
      blocks: mockBlocks,
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
      history: [],
      historyIndex: -1,
      setBlocks: vi.fn(),
      addBlock: vi.fn(),
      updateBlock: vi.fn(),
      deleteBlock: vi.fn(),
      selectBlock: vi.fn(),
      setCurrentPage: vi.fn(),
      setZoomLevel: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      pushHistory: vi.fn(),
    };
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
    
    // Mock window.innerWidth for desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });
  
  describe('Desktop Layout - Keyboard Navigation - Requirement 14.1', () => {
    it('should allow keyboard navigation through resize handle', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      expect(resizeHandle).toBeInTheDocument();
      
      resizeHandle.focus();
      expect(document.activeElement).toBe(resizeHandle);
    });
    
    it('should support arrow keys to resize panels', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      resizeHandle.focus();
      
      // Press ArrowRight to increase editor width
      await user.keyboard('{ArrowRight}');
      
      // Press ArrowLeft to decrease editor width
      await user.keyboard('{ArrowLeft}');
      
      // Should not throw errors
      expect(resizeHandle).toBeInTheDocument();
    });
    
    it('should have tabindex on resize handle for keyboard access', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      expect(resizeHandle).toHaveAttribute('tabIndex', '0');
    });
  });
  
  describe('Desktop Layout - ARIA Labels and Roles - Requirement 14.2', () => {
    it('should have proper separator role for resize handle', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const separator = screen.getByRole('separator', { name: /resize panels/i });
      expect(separator).toBeInTheDocument();
    });
    
    it('should have proper aria-orientation for resize handle', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const separator = screen.getByRole('separator', { name: /resize panels/i });
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    });
    
    it('should have descriptive aria-label for resize handle', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const separator = screen.getByRole('separator', { name: /resize panels/i });
      expect(separator).toHaveAttribute('aria-label', 'Resize panels');
    });
  });
  
  describe('Mobile Layout - Keyboard Navigation - Requirement 14.1', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });
    
    it('should allow tabbing through tab buttons', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const editTab = screen.getByRole('tab', { name: /edit/i });
        const previewTab = screen.getByRole('tab', { name: /preview/i });
        
        expect(editTab).toBeInTheDocument();
        expect(previewTab).toBeInTheDocument();
      });
      
      const editTab = screen.getByRole('tab', { name: /edit/i });
      editTab.focus();
      expect(document.activeElement).toBe(editTab);
      
      await user.tab();
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      expect(document.activeElement).toBe(previewTab);
    });
    
    it('should support keyboard activation of tabs with Enter', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
      });
      
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      previewTab.focus();
      
      await user.keyboard('{Enter}');
      
      // Tab should be activated
      expect(previewTab).toHaveAttribute('aria-selected', 'true');
    });
    
    it('should support keyboard activation of tabs with Space', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
      });
      
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      previewTab.focus();
      
      await user.keyboard(' ');
      
      // Tab should be activated
      expect(previewTab).toHaveAttribute('aria-selected', 'true');
    });
  });
  
  describe('Mobile Layout - ARIA Labels and Roles - Requirement 14.2', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });
    
    it('should have proper tablist role', async () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const tablist = screen.getByRole('tablist', { name: /editor view tabs/i });
        expect(tablist).toBeInTheDocument();
      });
    });
    
    it('should have proper tab roles', async () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(2);
      });
    });
    
    it('should have proper aria-selected on active tab', async () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const editTab = screen.getByRole('tab', { name: /edit/i });
        expect(editTab).toHaveAttribute('aria-selected', 'true');
        
        const previewTab = screen.getByRole('tab', { name: /preview/i });
        expect(previewTab).toHaveAttribute('aria-selected', 'false');
      });
    });
    
    it('should have proper aria-controls linking tabs to panels', async () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const editTab = screen.getByRole('tab', { name: /edit/i });
        expect(editTab).toHaveAttribute('aria-controls', 'editor-panel');
        expect(editTab).toHaveAttribute('id', 'editor-tab');
        
        const previewTab = screen.getByRole('tab', { name: /preview/i });
        expect(previewTab).toHaveAttribute('aria-controls', 'canvas-panel');
        expect(previewTab).toHaveAttribute('id', 'canvas-tab');
      });
    });
    
    it('should have proper tabpanel roles', async () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const panel = screen.getByRole('tabpanel');
        expect(panel).toBeInTheDocument();
        expect(panel).toHaveAttribute('id', 'editor-panel');
        expect(panel).toHaveAttribute('aria-labelledby', 'editor-tab');
      });
    });
    
    it('should update aria-selected when switching tabs', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
      });
      
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await user.click(previewTab);
      
      await waitFor(() => {
        expect(previewTab).toHaveAttribute('aria-selected', 'true');
        
        const editTab = screen.getByRole('tab', { name: /edit/i });
        expect(editTab).toHaveAttribute('aria-selected', 'false');
      });
    });
  });
  
  describe('Focus Management - Requirement 14.1', () => {
    it('should have visible focus indicators on resize handle', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      resizeHandle.focus();
      
      expect(document.activeElement).toBe(resizeHandle);
    });
    
    it('should maintain focus when resizing with keyboard', async () => {
      const user = userEvent.setup();
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      resizeHandle.focus();
      
      await user.keyboard('{ArrowRight}');
      
      // Focus should remain on resize handle
      expect(document.activeElement).toBe(resizeHandle);
    });
  });
  
  describe('Screen Reader Support - Requirement 14.2', () => {
    it('should announce panel resize functionality', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const separator = screen.getByRole('separator', { name: /resize panels/i });
      expect(separator).toHaveAttribute('aria-label', 'Resize panels');
    });
    
    it('should announce tab navigation context', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const tablist = screen.getByRole('tablist', { name: /editor view tabs/i });
        expect(tablist).toHaveAttribute('aria-label', 'Editor view tabs');
      });
    });
  });
  
  describe('Responsive Behavior - Requirement 14.1', () => {
    it('should switch to tabbed interface on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        // Should have tabs instead of resize handle
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.queryByRole('separator', { name: /resize panels/i })).not.toBeInTheDocument();
      });
    });
    
    it('should use split-screen on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      // Should have resize handle instead of tabs
      expect(screen.getByRole('separator', { name: /resize panels/i })).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });
  
  describe('Visual Indicators - Requirement 14.3', () => {
    it('should provide visual feedback during resize', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      const resizeHandle = screen.getByRole('separator', { name: /resize panels/i });
      
      // Should have hover styles
      expect(resizeHandle.className).toContain('hover:bg-blue-400');
    });
    
    it('should visually distinguish active tab on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      await waitFor(() => {
        const editTab = screen.getByRole('tab', { name: /edit/i });
        
        // Active tab should have distinct styling
        expect(editTab.className).toContain('border-blue-500');
        expect(editTab.className).toContain('text-blue-600');
      });
    });
  });
});
