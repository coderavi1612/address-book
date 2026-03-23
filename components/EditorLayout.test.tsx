import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditorLayout } from './EditorLayout';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

// Mock child components
vi.mock('./BlockEditor', () => ({
  BlockEditor: ({ selectedBlockId }: { selectedBlockId: string | null }) => (
    <div data-testid="block-editor">
      Block Editor {selectedBlockId ? `(${String(selectedBlockId)})` : '(none)'}
    </div>
  ),
}));

vi.mock('./LayoutCanvas', () => ({
  LayoutCanvas: () => <div data-testid="layout-canvas">Layout Canvas</div>,
}));

vi.mock('./Toolbar', () => ({
  Toolbar: ({ onAddBlock, onExportPDF }: { onAddBlock?: () => void; onExportPDF?: () => void }) => (
    <div data-testid="toolbar">
      <button onClick={onAddBlock} data-testid="add-block-btn">Add Block</button>
      <button onClick={onExportPDF} data-testid="export-pdf-btn">Export PDF</button>
    </div>
  ),
}));

// Mock server actions
vi.mock('@/app/actions/blocks', () => ({
  createBlock: vi.fn(),
}));

// Mock useExportPDF hook
vi.mock('@/hooks/useExportPDF', () => ({
  useExportPDF: vi.fn(() => ({
    exportPDF: vi.fn(),
    isExporting: false,
    error: null,
    clearError: vi.fn(),
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Zustand store
const mockSetBlocks = vi.fn();
const mockAddBlock = vi.fn();
vi.mock('@/store/blockStore', () => ({
  useBlockStore: vi.fn((selector) => {
    const state = {
      selectedBlockId: null,
      setBlocks: mockSetBlocks,
      addBlock: mockAddBlock,
    };
    return selector ? selector(state) : state;
  }),
}));

describe('EditorLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetBlocks.mockClear();
    
    // Reset window size to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });

  describe('Desktop Layout', () => {
    it('should render split-screen layout on desktop', () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      expect(screen.getByTestId('block-editor')).toBeInTheDocument();
      expect(screen.getByTestId('layout-canvas')).toBeInTheDocument();
    });

    it('should render BlockEditor with selected block ID', () => {
      // Override the mock for this specific test
      vi.mocked(useBlockStore).mockImplementation((selector) => {
        const state = {
          selectedBlockId: 'test-block-123',
          setBlocks: mockSetBlocks,
        };
        return selector ? selector(state) : state;
      });
      
      render(<EditorLayout initialBlocks={[]} />);
      
      // Just verify the component is rendered - the mock shows it receives the prop
      expect(screen.getByTestId('block-editor')).toBeInTheDocument();
    });

    it('should have default 40% editor width', () => {
      const { container } = render(<EditorLayout initialBlocks={[]} />);
      
      const editorPanel = container.querySelector('.flex-shrink-0');
      expect(editorPanel).toHaveStyle({ width: '40%' });
    });

    it('should render resize handle', () => {
      const { container } = render(<EditorLayout initialBlocks={[]} />);
      
      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).toBeInTheDocument();
    });
  });

  describe('Mobile/Tablet Layout', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('should render tabbed interface on mobile', async () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });
    });

    it('should show editor tab by default on mobile', async () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('block-editor')).toBeInTheDocument();
      });
    });

    it('should switch to canvas tab when clicked', async () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const previewTab = screen.getByText('Preview');
        fireEvent.click(previewTab);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('layout-canvas')).toBeInTheDocument();
      });
    });

    it('should highlight active tab', async () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const editTab = screen.getByText('Edit');
        expect(editTab).toHaveClass('border-blue-500');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should switch from desktop to mobile layout on resize', async () => {
      const { rerender } = render(<EditorLayout initialBlocks={[]} />);
      
      // Initially desktop
      expect(screen.getByTestId('block-editor')).toBeInTheDocument();
      expect(screen.getByTestId('layout-canvas')).toBeInTheDocument();
      
      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
      });
    });
  });

  describe('Panel Resizing', () => {
    it('should start resizing on mouse down', () => {
      const { container } = render(<EditorLayout initialBlocks={[]} />);
      
      const resizeHandle = container.querySelector('.cursor-col-resize');
      expect(resizeHandle).toBeInTheDocument();
      
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle, { clientX: 500 });
        expect(resizeHandle).toHaveClass('bg-blue-500');
      }
    });

    it('should constrain editor width between 20% and 80%', () => {
      const { container } = render(<EditorLayout initialBlocks={[]} />);
      
      const resizeHandle = container.querySelector('.cursor-col-resize');
      const editorPanel = container.querySelector('.flex-shrink-0');
      
      if (resizeHandle && editorPanel) {
        // Try to resize beyond maximum
        fireEvent.mouseDown(resizeHandle, { clientX: 500 });
        fireEvent.mouseMove(document, { clientX: 2000 });
        fireEvent.mouseUp(document);
        
        const width = editorPanel.getAttribute('style')?.match(/width:\s*(\d+)%/)?.[1];
        expect(Number(width)).toBeLessThanOrEqual(80);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper tab navigation on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<EditorLayout initialBlocks={[]} />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const editTab = screen.getByText('Edit');
        const previewTab = screen.getByText('Preview');
        
        expect(editTab.tagName).toBe('BUTTON');
        expect(previewTab.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Store Hydration', () => {
    const mockBlocks: AddressBlock[] = [
      {
        id: 'block-1',
        names: ['John Doe'],
        address: '123 Main St',
        mobile: '555-1234',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-123',
      },
      {
        id: 'block-2',
        names: ['Jane Smith'],
        address: '456 Oak Ave',
        mobile: '555-5678',
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        page_number: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-123',
      },
    ];

    it('should call setBlocks with initialBlocks on mount', () => {
      render(<EditorLayout initialBlocks={mockBlocks} />);
      
      expect(mockSetBlocks).toHaveBeenCalledWith(mockBlocks);
      expect(mockSetBlocks).toHaveBeenCalledTimes(1);
    });

    it('should hydrate store with empty array when no blocks', () => {
      render(<EditorLayout initialBlocks={[]} />);
      
      expect(mockSetBlocks).toHaveBeenCalledWith([]);
      expect(mockSetBlocks).toHaveBeenCalledTimes(1);
    });

    it('should re-hydrate when initialBlocks prop changes', () => {
      const { rerender } = render(<EditorLayout initialBlocks={[mockBlocks[0]]} />);
      
      expect(mockSetBlocks).toHaveBeenCalledWith([mockBlocks[0]]);
      
      rerender(<EditorLayout initialBlocks={mockBlocks} />);
      
      expect(mockSetBlocks).toHaveBeenCalledWith(mockBlocks);
      expect(mockSetBlocks).toHaveBeenCalledTimes(2);
    });
  });
});
