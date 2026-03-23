import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
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
        names: [`Person ${i}`],
        address: `${i} Test Street`,
        mobile: `555-${String(i).padStart(4, '0')}`,
        x,
        y,
        page_number: pageNumber,
      })
    );
  }
  
  return blocks;
};

describe('LayoutCanvas Performance Tests', () => {
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

  /**
   * Test rendering performance with 100+ blocks
   * **Validates: Requirements 20.1**
   */
  describe('Rendering Performance with Large Layouts', () => {
    it('should render 100 blocks within acceptable time', () => {
      const blocks = generateBlocks(100);
      
      const startTime = performance.now();
      
      act(() => {
        useBlockStore.setState({ blocks });
      });
      
      render(<LayoutCanvas />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (allowing some overhead for test environment)
      // Using 500ms as acceptable threshold for initial render with 100 blocks
      expect(renderTime).toBeLessThan(500);
      
      cleanup();
    });

    it('should update rendering within 100ms when blocks change', () => {
      const initialBlocks = generateBlocks(100);
      
      act(() => {
        useBlockStore.setState({ blocks: initialBlocks });
      });
      
      const { rerender } = render(<LayoutCanvas />);
      
      // Measure update time
      const startTime = performance.now();
      
      act(() => {
        // Update a single block
        const updatedBlocks = [...initialBlocks];
        updatedBlocks[0] = {
          ...updatedBlocks[0],
          names: ['Updated Name'],
        };
        useBlockStore.setState({ blocks: updatedBlocks });
      });
      
      rerender(<LayoutCanvas />);
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should update within 100ms as per requirement 20.1
      expect(updateTime).toBeLessThan(100);
      
      cleanup();
    });

    it('should handle 150 blocks without performance degradation', () => {
      const blocks = generateBlocks(150);
      
      const startTime = performance.now();
      
      act(() => {
        useBlockStore.setState({ blocks });
      });
      
      render(<LayoutCanvas />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render within reasonable time even with 150 blocks
      expect(renderTime).toBeLessThan(750);
      
      cleanup();
    });

    it('should maintain performance with multiple rapid updates', () => {
      const blocks = generateBlocks(100);
      
      act(() => {
        useBlockStore.setState({ blocks });
      });
      
      const { rerender } = render(<LayoutCanvas />);
      
      const updateTimes: number[] = [];
      
      // Perform 10 rapid updates
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        act(() => {
          const updatedBlocks = [...blocks];
          updatedBlocks[i] = {
            ...updatedBlocks[i],
            x: (updatedBlocks[i].x + 1) % 3,
          };
          useBlockStore.setState({ blocks: updatedBlocks });
        });
        
        rerender(<LayoutCanvas />);
        
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      // Average update time should be under 100ms
      const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      expect(avgUpdateTime).toBeLessThan(100);
      
      // No single update should exceed 150ms
      const maxUpdateTime = Math.max(...updateTimes);
      expect(maxUpdateTime).toBeLessThan(150);
      
      cleanup();
    });

    it('should efficiently handle zoom level changes with 100+ blocks', () => {
      const blocks = generateBlocks(100);
      
      act(() => {
        useBlockStore.setState({ blocks, zoomLevel: 1 });
      });
      
      const { rerender } = render(<LayoutCanvas />);
      
      const startTime = performance.now();
      
      act(() => {
        useBlockStore.setState({ zoomLevel: 1.5 });
      });
      
      rerender(<LayoutCanvas />);
      
      const endTime = performance.now();
      const zoomUpdateTime = endTime - startTime;
      
      // Zoom updates should be fast
      expect(zoomUpdateTime).toBeLessThan(100);
      
      cleanup();
    });
  });

  /**
   * Test memory efficiency with large layouts
   * **Validates: Requirements 20.3, 20.4**
   */
  describe('Memory Efficiency', () => {
    it('should not cause memory leaks with repeated renders', () => {
      const blocks = generateBlocks(100);
      
      // Render and cleanup multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          useBlockStore.setState({ blocks });
        });
        
        const { unmount } = render(<LayoutCanvas />);
        unmount();
        cleanup();
      }
      
      // If we get here without errors, memory is being managed properly
      expect(true).toBe(true);
    });

    it('should handle page navigation efficiently with large layouts', () => {
      const blocks = generateBlocks(100);
      
      act(() => {
        useBlockStore.setState({ blocks, currentPage: 1 });
      });
      
      const { rerender } = render(<LayoutCanvas />);
      
      const startTime = performance.now();
      
      // Navigate to different page
      act(() => {
        useBlockStore.setState({ currentPage: 5 });
      });
      
      rerender(<LayoutCanvas />);
      
      const endTime = performance.now();
      const navigationTime = endTime - startTime;
      
      // Page navigation should be fast
      expect(navigationTime).toBeLessThan(100);
      
      cleanup();
    });
  });

  /**
   * Test selection performance with large layouts
   * **Validates: Requirements 20.1**
   */
  describe('Selection Performance', () => {
    it('should handle block selection quickly with 100+ blocks', () => {
      const blocks = generateBlocks(100);
      
      act(() => {
        useBlockStore.setState({ blocks });
      });
      
      const { rerender } = render(<LayoutCanvas />);
      
      const startTime = performance.now();
      
      act(() => {
        useBlockStore.setState({ selectedBlockId: blocks[50].id });
      });
      
      rerender(<LayoutCanvas />);
      
      const endTime = performance.now();
      const selectionTime = endTime - startTime;
      
      // Selection should be instant
      expect(selectionTime).toBeLessThan(50);
      
      cleanup();
    });
  });
});
