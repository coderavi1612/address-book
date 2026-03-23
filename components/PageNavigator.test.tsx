import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PageNavigator } from './PageNavigator';
import { useBlockStore } from '@/store/blockStore';
import { createBlock } from '@/app/actions/blocks';
import { toast } from 'sonner';
import { AddressBlock } from '@/types/block';

// Mock dependencies
vi.mock('@/app/actions/blocks');
vi.mock('sonner');

// Create a mock store
const createMockStore = (overrides = {}) => ({
  blocks: [],
  currentPage: 1,
  setCurrentPage: vi.fn(),
  addBlock: vi.fn(),
  ...overrides,
});

vi.mock('@/store/blockStore', () => ({
  useBlockStore: vi.fn(),
}));

describe('PageNavigator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock querySelector
    document.querySelector = vi.fn();
  });
  
  const createMockBlock = (overrides: Partial<AddressBlock> = {}): AddressBlock => ({
    id: '1',
    names: ['John Doe'],
    address: '123 Main St',
    mobile: '555-0100',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  });
  
  /**
   * Test page thumbnail rendering
   * Requirements: 8.2, 8.3
   */
  it('should render page thumbnails with page numbers', () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
      createMockBlock({ id: '2', page_number: 2, names: ['Jane Smith'] }),
    ];
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ blocks: mockBlocks, currentPage: 1 });
      return selector(state);
    });
    
    render(<PageNavigator />);
    
    // Should display page numbers
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    
    // Should display block counts
    const blockCounts = screen.getAllByText('1 block');
    expect(blockCounts).toHaveLength(2);
  });
  
  /**
   * Test page thumbnail rendering with multiple blocks
   * Requirements: 8.2
   */
  it('should display correct block count for pages with multiple blocks', () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
      createMockBlock({ id: '2', page_number: 1, names: ['Jane Smith'] }),
      createMockBlock({ id: '3', page_number: 1, names: ['Bob Johnson'] }),
    ];
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ blocks: mockBlocks, currentPage: 1 });
      return selector(state);
    });
    
    render(<PageNavigator />);
    
    // Should display correct plural form
    expect(screen.getByText('3 blocks')).toBeInTheDocument();
  });
  
  /**
   * Test click-to-scroll behavior
   * Requirements: 8.3, 8.4
   */
  it('should scroll to page when thumbnail is clicked', () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
      createMockBlock({ id: '2', page_number: 2 }),
    ];
    
    const mockSetCurrentPage = vi.fn();
    const mockPageElement = {
      scrollIntoView: vi.fn(),
    };
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ 
        blocks: mockBlocks, 
        currentPage: 1,
        setCurrentPage: mockSetCurrentPage,
      });
      return selector(state);
    });
    
    vi.mocked(document.querySelector).mockReturnValue(mockPageElement as any);
    
    render(<PageNavigator />);
    
    // Click on page 2 thumbnail
    const page2Button = screen.getByText('Page 2').closest('button');
    fireEvent.click(page2Button!);
    
    // Should update current page
    expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
    
    // Should query for the page element
    expect(document.querySelector).toHaveBeenCalledWith('[data-page="2"]');
    
    // Should scroll to the page
    expect(mockPageElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });
  
  /**
   * Test Add Page button
   * Requirements: 8.2
   */
  it('should create new page when Add Page button is clicked', async () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
    ];
    
    const newBlock = createMockBlock({
      id: '2',
      names: ['New Contact'],
      address: '',
      mobile: '',
      page_number: 2,
    });
    
    const mockAddBlock = vi.fn();
    const mockSetCurrentPage = vi.fn();
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ 
        blocks: mockBlocks, 
        currentPage: 1,
        addBlock: mockAddBlock,
        setCurrentPage: mockSetCurrentPage,
      });
      return selector(state);
    });
    
    vi.mocked(createBlock).mockResolvedValue(newBlock);
    
    render(<PageNavigator />);
    
    // Click Add Page button
    const addButton = screen.getByTitle('Add Page');
    fireEvent.click(addButton);
    
    // Should create a new block on page 2
    await waitFor(() => {
      expect(createBlock).toHaveBeenCalledWith({
        names: ['New Contact'],
        address: '',
        mobile: '',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: 2,
      });
    });
    
    // Should add block to store
    await waitFor(() => {
      expect(mockAddBlock).toHaveBeenCalledWith(newBlock);
    });
    
    // Should set current page to new page
    await waitFor(() => {
      expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
    });
    
    // Should show success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('New page added');
    });
  });
  
  /**
   * Test Add Page button error handling
   * Requirements: 8.2
   */
  it('should show error toast when Add Page fails', async () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
    ];
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ blocks: mockBlocks, currentPage: 1 });
      return selector(state);
    });
    
    vi.mocked(createBlock).mockRejectedValue(new Error('Failed to create block'));
    
    render(<PageNavigator />);
    
    // Click Add Page button
    const addButton = screen.getByTitle('Add Page');
    fireEvent.click(addButton);
    
    // Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add page');
    });
  });
  
  /**
   * Test active page highlighting
   * Requirements: 8.3
   */
  it('should highlight the current page', () => {
    const mockBlocks = [
      createMockBlock({ id: '1', page_number: 1 }),
      createMockBlock({ id: '2', page_number: 2 }),
    ];
    
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ blocks: mockBlocks, currentPage: 2 });
      return selector(state);
    });
    
    render(<PageNavigator />);
    
    // Page 2 button should have active styling
    const page2Button = screen.getByText('Page 2').closest('button');
    expect(page2Button).toHaveClass('border-blue-500', 'bg-blue-50');
    
    // Page 1 button should not have active styling
    const page1Button = screen.getByText('Page 1').closest('button');
    expect(page1Button).not.toHaveClass('border-blue-500');
    expect(page1Button).not.toHaveClass('bg-blue-50');
  });
  
  /**
   * Test rendering with no blocks (default page 1)
   * Requirements: 8.2
   */
  it('should render page 1 when there are no blocks', () => {
    vi.mocked(useBlockStore).mockImplementation((selector: any) => {
      const state = createMockStore({ blocks: [], currentPage: 1 });
      return selector(state);
    });
    
    render(<PageNavigator />);
    
    // Should display page 1
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('0 blocks')).toBeInTheDocument();
  });
});
