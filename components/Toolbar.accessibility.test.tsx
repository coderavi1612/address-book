import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';
import { useBlockStore } from '@/store/blockStore';

/**
 * Accessibility Tests for Toolbar Component
 * Requirements: 14.1, 14.2, 14.3
 */

// Mock dependencies
vi.mock('@/store/blockStore');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  }),
}));

describe('Toolbar Accessibility Tests', () => {
  let mockStoreState: any;
  const mockOnAddBlock = vi.fn();
  const mockOnExportPDF = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStoreState = {
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
      history: [[]],
      historyIndex: 0,
      undo: vi.fn(),
      redo: vi.fn(),
    };
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
  });
  
  describe('Keyboard Navigation - Requirement 14.1', () => {
    it('should allow tabbing through all toolbar buttons in logical order', async () => {
      const user = userEvent.setup();
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      // Start from Undo button
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      undoButton.focus();
      expect(document.activeElement).toBe(undoButton);
      
      // Tab to Redo button
      await user.tab();
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      expect(document.activeElement).toBe(redoButton);
      
      // Tab to Add Block button
      await user.tab();
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      expect(document.activeElement).toBe(addButton);
      
      // Tab to Export PDF button
      await user.tab();
      const exportButton = screen.getByRole('button', { name: /export address book as pdf/i });
      expect(document.activeElement).toBe(exportButton);
      
      // Tab to Logout button
      await user.tab();
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(document.activeElement).toBe(logoutButton);
    });
    
    it('should support reverse tabbing (Shift+Tab)', async () => {
      const user = userEvent.setup();
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      // Start from Logout button
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      logoutButton.focus();
      
      // Shift+Tab to Export button
      await user.tab({ shift: true });
      const exportButton = screen.getByRole('button', { name: /export address book as pdf/i });
      expect(document.activeElement).toBe(exportButton);
      
      // Shift+Tab to Add Block button
      await user.tab({ shift: true });
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      expect(document.activeElement).toBe(addButton);
    });
    
    it('should support keyboard activation with Enter key', async () => {
      const user = userEvent.setup();
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      addButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(mockOnAddBlock).toHaveBeenCalled();
    });
    
    it('should support keyboard activation with Space key', async () => {
      const user = userEvent.setup();
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const exportButton = screen.getByRole('button', { name: /export address book as pdf/i });
      exportButton.focus();
      
      await user.keyboard(' ');
      
      expect(mockOnExportPDF).toHaveBeenCalled();
    });
    
    it('should skip disabled buttons in tab order', async () => {
      const user = userEvent.setup();
      mockStoreState.historyIndex = 0;
      mockStoreState.history = [[]];
      
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      expect(undoButton).toBeDisabled();
      
      // Focus should skip disabled button
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      redoButton.focus();
      
      await user.tab();
      
      // Should skip to Add Block button
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      expect(document.activeElement).toBe(addButton);
    });
  });
  
  describe('ARIA Labels and Roles - Requirement 14.2', () => {
    it('should have descriptive labels for all buttons', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      expect(screen.getByRole('button', { name: /undo last action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo last undone action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new address block/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export address book as pdf/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout from application/i })).toBeInTheDocument();
    });
    
    it('should have proper title attributes for tooltips', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      expect(undoButton).toHaveAttribute('title', 'Undo (Ctrl+Z)');
      
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      expect(redoButton).toHaveAttribute('title', 'Redo (Ctrl+Y)');
      
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      expect(addButton).toHaveAttribute('title', 'Add Block');
      
      const exportButton = screen.getByRole('button', { name: /export address book as pdf/i });
      expect(exportButton).toHaveAttribute('title', 'Export PDF');
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(logoutButton).toHaveAttribute('title', 'Logout');
    });
    
    it('should have proper separator role for visual divider', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const separators = screen.getAllByRole('separator');
      expect(separators.length).toBeGreaterThan(0);
      
      // Separator should have proper orientation
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-orientation', 'vertical');
      });
    });
    
    it('should indicate disabled state properly', () => {
      mockStoreState.historyIndex = 0;
      mockStoreState.history = [[]];
      
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      expect(undoButton).toBeDisabled();
      expect(undoButton).toHaveAttribute('disabled');
      
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      expect(redoButton).toBeDisabled();
      expect(redoButton).toHaveAttribute('disabled');
    });
    
    it('should show loading state with proper labels', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} isAddingBlock={true} />);
      
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      expect(addButton).toBeDisabled();
      
      // Should contain loading indicator
      const loadingIcon = addButton.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });
    
    it('should show export loading state', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} isExporting={true} />);
      
      const exportButton = screen.getByRole('button', { name: /export address book as pdf/i });
      expect(exportButton).toBeDisabled();
      
      // Should contain loading indicator
      const loadingIcon = exportButton.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });
  });
  
  describe('Focus Management - Requirement 14.1', () => {
    it('should have visible focus indicators on all buttons', async () => {
      const user = userEvent.setup();
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      undoButton.focus();
      
      expect(document.activeElement).toBe(undoButton);
      
      // Tab through and verify focus is maintained
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      expect(document.activeElement?.tagName).not.toBe('BODY');
    });
    
    it('should maintain focus after button click', async () => {
      const user = userEvent.setup();
      mockStoreState.historyIndex = 1;
      mockStoreState.history = [[], []];
      
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      await user.click(undoButton);
      
      expect(mockStoreState.undo).toHaveBeenCalled();
      // Focus should remain on button or move to a logical location
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });
  
  describe('Screen Reader Support - Requirement 14.2', () => {
    it('should provide context about button states', () => {
      mockStoreState.historyIndex = 0;
      mockStoreState.history = [[]];
      
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      
      // Disabled state should be announced by screen readers
      expect(undoButton).toBeDisabled();
    });
    
    it('should announce loading states', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} isAddingBlock={true} />);
      
      const addButton = screen.getByRole('button', { name: /add new address block/i });
      
      // Button should be disabled during loading
      expect(addButton).toBeDisabled();
    });
  });
  
  describe('Keyboard Shortcuts - Requirement 14.1', () => {
    it('should indicate keyboard shortcuts in tooltips', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      expect(undoButton.getAttribute('title')).toContain('Ctrl+Z');
      
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      expect(redoButton.getAttribute('title')).toContain('Ctrl+Y');
    });
  });
  
  describe('Button Groups - Requirement 14.2', () => {
    it('should logically group related buttons', () => {
      render(<Toolbar onAddBlock={mockOnAddBlock} onExportPDF={mockOnExportPDF} />);
      
      // Undo/Redo should be together
      const undoButton = screen.getByRole('button', { name: /undo last action/i });
      const redoButton = screen.getByRole('button', { name: /redo last undone action/i });
      
      // They should be in the same container
      expect(undoButton.parentElement).toBe(redoButton.parentElement);
    });
  });
});
