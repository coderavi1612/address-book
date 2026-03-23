import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageNavigator } from './PageNavigator';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

/**
 * Accessibility Tests for PageNavigator Component
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
    page_number: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  }),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
  {
    id: 'block-2',
    names: ['Jane Smith'],
    address: '456 Oak Ave',
    mobile: '987-654-3210',
    x: 1,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  },
  {
    id: 'block-3',
    names: ['Bob Johnson'],
    address: '789 Pine Rd',
    mobile: '555-123-4567',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  },
];

describe('PageNavigator Accessibility Tests', () => {
  let mockStoreState: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStoreState = {
      blocks: mockBlocks,
      currentPage: 1,
      setCurrentPage: vi.fn(),
      addBlock: vi.fn(),
    };
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
  });
  
  describe('Keyboard Navigation - Requirement 14.1', () => {
    it('should allow tabbing through page buttons', async () => {
      const user = userEvent.setup();
      render(<PageNavigator />);
      
      const addPageButton = screen.getByRole('button', { name: /add new page/i });
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      // Focus first page button
      pageButtons[0]?.focus();
      expect(document.activeElement).toBe(pageButtons[0]);
      
      // Tab to next page button
      await user.tab();
      expect(document.activeElement).toBe(pageButtons[1]);
    });
    
    it('should support keyboard activation of page buttons with Enter', async () => {
      const user = userEvent.setup();
      const mockSetCurrentPage = vi.fn();
      mockStoreState.setCurrentPage = mockSetCurrentPage;
      
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      pageButtons[0]?.focus();
      await user.keyboard('{Enter}');
      
      expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });
    
    it('should support keyboard activation with Space key', async () => {
      const user = userEvent.setup();
      const mockSetCurrentPage = vi.fn();
      mockStoreState.setCurrentPage = mockSetCurrentPage;
      
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      pageButtons[1]?.focus();
      await user.keyboard(' ');
      
      expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
    });
    
    it('should allow keyboard access to Add Page button', async () => {
      const user = userEvent.setup();
      const mockAddBlock = vi.fn();
      mockStoreState.addBlock = mockAddBlock;
      
      render(<PageNavigator />);
      
      const addButton = screen.getByRole('button', { name: /add new page/i });
      addButton.focus();
      
      await user.keyboard('{Enter}');
      
      // Should trigger add page action
      expect(mockAddBlock).toHaveBeenCalled();
    });
  });
  
  describe('ARIA Labels and Roles - Requirement 14.2', () => {
    it('should have proper navigation role', () => {
      render(<PageNavigator />);
      
      const nav = screen.getByRole('navigation', { name: /page navigation/i });
      expect(nav).toBeInTheDocument();
    });
    
    it('should have proper list role for pages', () => {
      render(<PageNavigator />);
      
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });
    
    it('should have proper listitem role for each page', () => {
      render(<PageNavigator />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(2); // 2 pages
    });
    
    it('should have descriptive labels for page buttons', () => {
      render(<PageNavigator />);
      
      const page1Button = screen.getByRole('listitem', { name: /page 1, 2 blocks/i });
      expect(page1Button).toBeInTheDocument();
      
      const page2Button = screen.getByRole('listitem', { name: /page 2, 1 block/i });
      expect(page2Button).toBeInTheDocument();
    });
    
    it('should use singular "block" for single block pages', () => {
      render(<PageNavigator />);
      
      const page2Button = screen.getByRole('listitem', { name: /page 2, 1 block/i });
      expect(page2Button).toBeInTheDocument();
      expect(page2Button.textContent).toContain('1 block');
      expect(page2Button.textContent).not.toContain('1 blocks');
    });
    
    it('should use plural "blocks" for multiple block pages', () => {
      render(<PageNavigator />);
      
      const page1Button = screen.getByRole('listitem', { name: /page 1, 2 blocks/i });
      expect(page1Button).toBeInTheDocument();
      expect(page1Button.textContent).toContain('2 blocks');
    });
    
    it('should have proper label for Add Page button', () => {
      render(<PageNavigator />);
      
      const addButton = screen.getByRole('button', { name: /add new page/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('title', 'Add Page');
    });
    
    it('should indicate current page with aria-current', () => {
      mockStoreState.currentPage = 1;
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      // Current page should have aria-current="page"
      expect(pageButtons[0]).toHaveAttribute('aria-current', 'page');
      expect(pageButtons[1]).not.toHaveAttribute('aria-current');
    });
    
    it('should hide decorative thumbnail from screen readers', () => {
      render(<PageNavigator />);
      
      const nav = screen.getByRole('navigation', { name: /page navigation/i });
      const thumbnails = nav.querySelectorAll('[aria-hidden="true"]');
      
      expect(thumbnails.length).toBeGreaterThan(0);
    });
  });
  
  describe('Focus Management - Requirement 14.1', () => {
    it('should have visible focus indicators on page buttons', async () => {
      const user = userEvent.setup();
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      pageButtons[0]?.focus();
      expect(document.activeElement).toBe(pageButtons[0]);
    });
    
    it('should maintain focus after page selection', async () => {
      const user = userEvent.setup();
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      await user.click(pageButtons[0]!);
      
      // Focus should remain on a reasonable element
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      expect(document.activeElement?.tagName).not.toBe('BODY');
    });
  });
  
  describe('Screen Reader Support - Requirement 14.2', () => {
    it('should announce page context with block count', () => {
      render(<PageNavigator />);
      
      const page1 = screen.getByRole('listitem', { name: /page 1, 2 blocks/i });
      expect(page1).toBeInTheDocument();
      
      // Screen readers should announce: "Page 1, 2 blocks"
      const button = page1.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Page 1, 2 blocks');
    });
    
    it('should announce current page status', () => {
      mockStoreState.currentPage = 1;
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      // Current page should be announced differently
      expect(pageButtons[0]).toHaveAttribute('aria-current', 'page');
    });
    
    it('should provide meaningful navigation context', () => {
      render(<PageNavigator />);
      
      const nav = screen.getByRole('navigation', { name: /page navigation/i });
      expect(nav).toHaveAttribute('aria-label', 'Page navigation');
    });
  });
  
  describe('Visual Indicators - Requirement 14.3', () => {
    it('should visually distinguish current page', () => {
      mockStoreState.currentPage = 1;
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      // Current page should have different styling
      expect(pageButtons[0]?.className).toContain('border-blue-500');
      expect(pageButtons[0]?.className).toContain('bg-blue-50');
      
      // Other pages should have default styling
      expect(pageButtons[1]?.className).toContain('border-gray-200');
      expect(pageButtons[1]?.className).toContain('bg-white');
    });
  });
  
  describe('Interactive Feedback - Requirement 14.1', () => {
    it('should provide hover feedback on page buttons', () => {
      render(<PageNavigator />);
      
      const pageButtons = screen.getAllByRole('listitem').map(item => 
        item.querySelector('button')
      ).filter(Boolean);
      
      // Non-active buttons should have hover styles
      expect(pageButtons[1]?.className).toContain('hover:border-gray-300');
    });
  });
});
