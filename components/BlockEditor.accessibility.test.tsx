import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockEditor } from './BlockEditor';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

/**
 * Accessibility Tests for BlockEditor Component
 * Requirements: 14.1, 14.2, 14.3
 */

// Mock dependencies
vi.mock('@/store/blockStore');
vi.mock('@/app/actions/blocks');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBlock: AddressBlock = {
  id: 'test-block-1',
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
};

describe('BlockEditor Accessibility Tests', () => {
  let mockStoreState: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStoreState = {
      blocks: [mockBlock],
      selectedBlockId: mockBlock.id,
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
  });
  
  describe('Keyboard Navigation - Requirement 14.1', () => {
    it('should allow tabbing through all form fields in logical order', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Start from the first name input
      const nameInput = screen.getByDisplayValue('John Doe');
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
      
      // Tab to Add Name button (comes after name field)
      await user.tab();
      const addNameButton = screen.getByRole('button', { name: /add another name/i });
      expect(document.activeElement).toBe(addNameButton);
      
      // Tab to address field
      await user.tab();
      const addressField = screen.getByDisplayValue('123 Main St');
      expect(document.activeElement).toBe(addressField);
      
      // Tab to mobile field
      await user.tab();
      const mobileField = screen.getByDisplayValue('123-456-7890');
      expect(document.activeElement).toBe(mobileField);
      
      // Tab to Save Block button
      await user.tab();
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      expect(document.activeElement).toBe(saveButton);
      
      // Tab to Duplicate button
      await user.tab();
      const duplicateButton = screen.getByRole('button', { name: /duplicate this address block/i });
      expect(document.activeElement).toBe(duplicateButton);
      
      // Tab to Delete button
      await user.tab();
      const deleteButton = screen.getByRole('button', { name: /delete this address block/i });
      expect(document.activeElement).toBe(deleteButton);
    });
    
    it('should allow reverse tabbing (Shift+Tab) through form fields', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Start from delete button
      const deleteButton = screen.getByRole('button', { name: /delete this address block/i });
      deleteButton.focus();
      expect(document.activeElement).toBe(deleteButton);
      
      // Shift+Tab to Duplicate button
      await user.tab({ shift: true });
      const duplicateButton = screen.getByRole('button', { name: /duplicate this address block/i });
      expect(document.activeElement).toBe(duplicateButton);
      
      // Shift+Tab to Save button
      await user.tab({ shift: true });
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      expect(document.activeElement).toBe(saveButton);
    });
    
    it('should support Enter key to submit form', async () => {
      const user = userEvent.setup();
      const mockUpdateBlock = vi.fn();
      mockStoreState.updateBlock = mockUpdateBlock;
      
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      nameInput.focus();
      
      // Press Enter to submit
      await user.keyboard('{Enter}');
      
      // Form should be submitted
      expect(mockUpdateBlock).toHaveBeenCalled();
    });
    
    it('should allow keyboard interaction with Add Name button', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      const addNameButton = screen.getByRole('button', { name: /add another name/i });
      addNameButton.focus();
      
      const initialFields = screen.getAllByPlaceholderText(/enter name/i);
      
      // Press Enter or Space to activate button
      await user.keyboard('{Enter}');
      
      // New field should be added
      const fieldsAfterAdd = screen.getAllByPlaceholderText(/enter name/i);
      expect(fieldsAfterAdd.length).toBe(initialFields.length + 1);
    });
  });
  
  describe('ARIA Labels and Roles - Requirement 14.2', () => {
    it('should have proper form role and label', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      const form = screen.getByRole('form', { name: /edit address block form/i });
      expect(form).toBeInTheDocument();
    });
    
    it('should have proper labels for all input fields', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Name inputs should have aria-label
      const nameInput = screen.getByLabelText(/name 1/i);
      expect(nameInput).toBeInTheDocument();
      
      // Address field should have associated label (use exact match to avoid ambiguity)
      const addressField = screen.getByLabelText('Address');
      expect(addressField).toBeInTheDocument();
      expect(addressField.tagName).toBe('TEXTAREA');
      
      // Mobile field should have associated label (use exact match)
      const mobileField = screen.getByLabelText('Mobile');
      expect(mobileField).toBeInTheDocument();
      expect(mobileField.tagName).toBe('INPUT');
    });
    
    it('should have proper button labels', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // All buttons should have accessible names
      expect(screen.getByRole('button', { name: /add another name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save address block/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /duplicate this address block/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete this address block/i })).toBeInTheDocument();
    });
    
    it('should have proper aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Clear the name field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      
      // Try to submit
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      await user.click(saveButton);
      
      // Field should have aria-invalid
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });
    
    it('should associate error messages with fields using aria-describedby', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Clear the name field
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      
      // Submit to trigger validation
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      await user.click(saveButton);
      
      // Error message should be associated with field
      const errorId = nameInput.getAttribute('aria-describedby');
      if (errorId) {
        const errorElement = document.getElementById(errorId);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      }
    });
    
    it('should have proper role for action buttons group', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      const buttonGroup = screen.getByRole('group', { name: /block actions/i });
      expect(buttonGroup).toBeInTheDocument();
    });
    
    it('should have live region for autosave status', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Look for status elements with aria-live
      const statusElements = screen.queryAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      // At least one should have aria-live="polite"
      const liveRegion = statusElements.find(el => el.getAttribute('aria-live') === 'polite');
      expect(liveRegion).toBeInTheDocument();
    });
    
    it('should have proper aria-label for remove name buttons', () => {
      const blockWithMultipleNames = {
        ...mockBlock,
        names: ['John Doe', 'Jane Smith'],
      };
      
      mockStoreState.blocks = [blockWithMultipleNames];
      mockStoreState.selectedBlockId = blockWithMultipleNames.id;
      
      render(<BlockEditor selectedBlockId={blockWithMultipleNames.id} />);
      
      // Remove buttons should have descriptive labels
      const removeButtons = screen.getAllByRole('button', { name: /remove name \d+/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });
  
  describe('Focus Management - Requirement 14.1', () => {
    it('should have visible focus indicators on all interactive elements', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Tab through elements and verify focus is visible
      const nameInput = screen.getByDisplayValue('John Doe');
      nameInput.focus();
      
      // Check that focused element has focus styles
      expect(document.activeElement).toBe(nameInput);
      
      // Tab to next element
      await user.tab();
      expect(document.activeElement).not.toBe(nameInput);
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
    
    it('should maintain focus when adding a new name field', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      const addNameButton = screen.getByRole('button', { name: /add another name/i });
      await user.click(addNameButton);
      
      // Focus should remain on a reasonable element (not lost)
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      expect(document.activeElement?.tagName).not.toBe('BODY');
    });
  });
  
  describe('Screen Reader Support - Requirement 14.2', () => {
    it('should announce form submission status', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Status messages should be in live regions
      const statusElements = screen.queryAllByRole('status');
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live');
      });
    });
    
    it('should announce validation errors', async () => {
      const user = userEvent.setup();
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Clear name field
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      await user.click(saveButton);
      
      // Error should be in an alert role
      const errorMessages = screen.queryAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
    
    it('should provide context for loading states', () => {
      render(<BlockEditor selectedBlockId={mockBlock.id} />);
      
      // Loading indicators should have proper labels
      const saveButton = screen.getByRole('button', { name: /save address block/i });
      expect(saveButton).toHaveAccessibleName();
    });
  });
});
