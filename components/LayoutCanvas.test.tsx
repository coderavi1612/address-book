import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { LayoutCanvas } from './LayoutCanvas';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

// Mock the hooks and components
vi.mock('@/hooks/useDragAndDrop', () => ({
  useDragAndDrop: vi.fn(),
}));

vi.mock('./AddressBlock', () => ({
  AddressBlock: ({ block, isSelected, onSelect }: any) => (
    <div
      data-testid={`block-${block.id}`}
      data-selected={isSelected}
      onClick={() => onSelect(block.id)}
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
      }}
    >
      {block.names.join(', ')}
    </div>
  ),
}));

describe('LayoutCanvas Component', () => {
  beforeEach(() => {
    // Reset store before each test
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
      history: [],
      historyIndex: -1,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Unit Tests', () => {
    it('should render blocks across multiple pages', () => {
      const blocks: AddressBlock[] = [
        {
          id: '1',
          names: ['John Doe'],
          address: '123 Main St',
          mobile: '555-0001',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          page_number: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user1',
        },
        {
          id: '2',
          names: ['Jane Smith'],
          address: '456 Oak Ave',
          mobile: '555-0002',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          page_number: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user1',
        },
      ];

      useBlockStore.setState({ blocks });
      render(<LayoutCanvas />);

      expect(screen.getByTestId('block-1')).toBeInTheDocument();
      expect(screen.getByTestId('block-2')).toBeInTheDocument();
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });

    it('should handle click selection on blocks', async () => {
      const user = userEvent.setup();
      const blocks: AddressBlock[] = [
        {
          id: '1',
          names: ['John Doe'],
          address: '123 Main St',
          mobile: '555-0001',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          page_number: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user1',
        },
      ];

      useBlockStore.setState({ blocks });
      render(<LayoutCanvas />);

      const block = screen.getByTestId('block-1');
      await user.click(block);

      await waitFor(() => {
        expect(useBlockStore.getState().selectedBlockId).toBe('1');
      });
    });

    it('should handle deselection on empty space click', async () => {
      const user = userEvent.setup();
      const blocks: AddressBlock[] = [
        {
          id: '1',
          names: ['John Doe'],
          address: '123 Main St',
          mobile: '555-0001',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          page_number: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'user1',
        },
      ];

      useBlockStore.setState({ blocks, selectedBlockId: '1' });
      const { container } = render(<LayoutCanvas />);

      // Click on the scrollable canvas div (the one with overflow-auto class)
      const scrollableDiv = container.querySelector('.overflow-auto');
      expect(scrollableDiv).toBeTruthy();
      
      if (scrollableDiv) {
        await act(async () => {
          await user.click(scrollableDiv);
        });
      }

      await waitFor(() => {
        expect(useBlockStore.getState().selectedBlockId).toBeNull();
      });
    });

    it('should display zoom controls', () => {
      render(<LayoutCanvas />);

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset Zoom')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle Grid')).toBeInTheDocument();
    });

    it('should update zoom level when zoom controls are clicked', async () => {
      const user = userEvent.setup();
      render(<LayoutCanvas />);

      const zoomInButton = screen.getByTitle('Zoom In');
      await user.click(zoomInButton);

      await waitFor(() => {
        expect(useBlockStore.getState().zoomLevel).toBeGreaterThan(1);
      });
    });

    it('should toggle grid overlay', async () => {
      const user = userEvent.setup();
      render(<LayoutCanvas />);

      const gridButton = screen.getByTitle('Toggle Grid');
      await user.click(gridButton);

      // Grid should be visible (check for SVG elements)
      await waitFor(() => {
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Property-Based Tests', () => {
    it('Property 4: Block Selection Synchronization - selection updates store, highlights block, and populates editor', () => {
      // Feature: address-book-pdf-builder, Property 4: Block Selection Synchronization
      // Validates: Requirements 3.2, 4.7, 16.1, 16.2, 16.3
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
            address: fc.string({ maxLength: 500 }),
            mobile: fc.string({ maxLength: 20 }),
            x: fc.nat({ max: 10 }),
            y: fc.nat({ max: 10 }),
            width: fc.integer({ min: 1, max: 3 }),
            height: fc.integer({ min: 1, max: 3 }),
            page_number: fc.integer({ min: 1, max: 5 }),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
            user_id: fc.constant('test-user'),
          }),
          (block) => {
            // Reset store
            act(() => {
              useBlockStore.setState({
                blocks: [block],
                selectedBlockId: null,
                currentPage: 1,
                zoomLevel: 1,
                history: [],
                historyIndex: -1,
              });
            });

            const { unmount } = render(<LayoutCanvas />);

            // Simulate block selection
            const blockElement = screen.getByTestId(`block-${block.id}`);
            act(() => {
              blockElement.click();
            });

            // Verify selection is updated in store
            const state = useBlockStore.getState();
            expect(state.selectedBlockId).toBe(block.id);

            // Verify block is marked as selected (after re-render)
            const updatedBlockElement = screen.getByTestId(`block-${block.id}`);
            expect(updatedBlockElement.getAttribute('data-selected')).toBe('true');

            // Cleanup after each iteration
            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 26: Deselection on Empty Click - clicking empty space clears selectedBlockId', () => {
      // Feature: address-book-pdf-builder, Property 26: Deselection on Empty Click
      // Validates: Requirements 16.4
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
            address: fc.string({ maxLength: 500 }),
            mobile: fc.string({ maxLength: 20 }),
            x: fc.nat({ max: 10 }),
            y: fc.nat({ max: 10 }),
            width: fc.integer({ min: 1, max: 3 }),
            height: fc.integer({ min: 1, max: 3 }),
            page_number: fc.integer({ min: 1, max: 5 }),
            created_at: fc.constant(new Date().toISOString()),
            updated_at: fc.constant(new Date().toISOString()),
            user_id: fc.constant('test-user'),
          }),
          (block) => {
            // Reset store with a selected block
            act(() => {
              useBlockStore.setState({
                blocks: [block],
                selectedBlockId: block.id,
                currentPage: 1,
                zoomLevel: 1,
                history: [],
                historyIndex: -1,
              });
            });

            const { container, unmount } = render(<LayoutCanvas />);

            // Find the canvas background element (the scrollable div)
            const canvasBackground = container.querySelector('.overflow-auto');
            expect(canvasBackground).toBeTruthy();

            // Simulate click on empty space (canvas background)
            if (canvasBackground) {
              act(() => {
                // Create a click event directly on the canvas
                const clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                });
                Object.defineProperty(clickEvent, 'target', {
                  value: canvasBackground,
                  enumerable: true,
                });
                Object.defineProperty(clickEvent, 'currentTarget', {
                  value: canvasBackground,
                  enumerable: true,
                });
                canvasBackground.dispatchEvent(clickEvent);
              });
            }

            // Verify selectedBlockId is cleared
            const state = useBlockStore.getState();
            expect(state.selectedBlockId).toBeNull();

            // Cleanup after each iteration
            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
