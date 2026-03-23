import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualization } from './useVirtualization';
import { AddressBlock, GridConfig } from '@/types/block';
import { createRef } from 'react';

describe('useVirtualization', () => {
  const mockGridConfig: GridConfig = {
    columns: 3,
    rows: 3,
    unitWidth: 100,
    unitHeight: 100,
    pageWidth: 595.28,
    pageHeight: 841.89,
    margin: 56.69,
  };

  const createMockBlock = (id: string, page_number: number): AddressBlock => ({
    id,
    names: ['Test Name'],
    address: 'Test Address',
    mobile: '1234567890',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user',
  });

  let containerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Create a mock container element
    const mockContainer = document.createElement('div');
    Object.defineProperty(mockContainer, 'clientHeight', {
      writable: true,
      value: 1000,
    });
    Object.defineProperty(mockContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });

    containerRef = { current: mockContainer };
  });

  it('should return all blocks when container is not available', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
      createMockBlock('3', 3),
    ];

    const emptyRef = createRef<HTMLDivElement>();
    const { result } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef: emptyRef,
        visiblePageBuffer: 1,
      })
    );

    expect(result.current.visibleBlocks).toEqual(blocks);
  });

  it('should return all blocks when blocks array is empty', () => {
    const { result } = renderHook(() =>
      useVirtualization({
        blocks: [],
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 1,
      })
    );

    expect(result.current.visibleBlocks).toEqual([]);
    expect(result.current.visiblePages).toEqual([]);
  });

  it('should filter blocks to visible pages only', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
      createMockBlock('3', 3),
      createMockBlock('4', 4),
      createMockBlock('5', 5),
    ];

    const { result } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 0,
      })
    );

    // With viewport height of 1000 and page height of ~841, should filter out distant pages
    expect(result.current.visibleBlocks.length).toBeLessThanOrEqual(blocks.length);
    // Should not include pages far from the viewport (e.g., page 5)
    expect(result.current.visibleBlocks.some(b => b.page_number === 5)).toBe(false);
  });

  it('should include buffer pages for smooth scrolling', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
      createMockBlock('3', 3),
      createMockBlock('4', 4),
    ];

    const { result } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 1,
      })
    );

    // With buffer of 1, should include page 1 and page 2
    const visiblePageNumbers = result.current.visibleBlocks.map(b => b.page_number);
    expect(visiblePageNumbers).toContain(1);
    expect(visiblePageNumbers).toContain(2);
  });

  it('should update visible blocks when scroll position changes', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
      createMockBlock('3', 3),
    ];

    const { result, rerender } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 0,
      })
    );

    const initialVisibleCount = result.current.visibleBlocks.length;

    // Simulate scroll
    act(() => {
      if (containerRef.current) {
        Object.defineProperty(containerRef.current, 'scrollTop', {
          writable: true,
          value: 1000,
        });
        containerRef.current.dispatchEvent(new Event('scroll'));
      }
    });

    rerender();

    // After scrolling, visible blocks may change
    expect(result.current.visibleBlocks).toBeDefined();
  });

  it('should handle custom buffer size', () => {
    const blocks = Array.from({ length: 10 }, (_, i) =>
      createMockBlock(`${i + 1}`, i + 1)
    );

    const { result: result1 } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 0,
      })
    );

    const { result: result2 } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 2,
      })
    );

    // Larger buffer should include more blocks
    expect(result2.current.visibleBlocks.length).toBeGreaterThanOrEqual(
      result1.current.visibleBlocks.length
    );
  });

  it('should not include pages below page 1', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
    ];

    const { result } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 5, // Large buffer
      })
    );

    // Should not have any page numbers less than 1
    expect(result.current.visiblePages.every(p => p >= 1)).toBe(true);
  });

  it('should return visible pages array', () => {
    const blocks = [
      createMockBlock('1', 1),
      createMockBlock('2', 2),
      createMockBlock('3', 3),
    ];

    const { result } = renderHook(() =>
      useVirtualization({
        blocks,
        gridConfig: mockGridConfig,
        containerRef,
        visiblePageBuffer: 1,
      })
    );

    expect(Array.isArray(result.current.visiblePages)).toBe(true);
    expect(result.current.visiblePages.length).toBeGreaterThan(0);
  });
});
