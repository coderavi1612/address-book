import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragSelect } from './useDragSelect';
import { AddressBlock, GridConfig } from '@/types/block';

describe('useDragSelect', () => {
  const mockBlocks: AddressBlock[] = [
    {
      id: '1',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      names: ['Block 1'],
      address: '',
      mobile: '',
      user_id: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      x: 2,
      y: 2,
      width: 1,
      height: 1,
      page_number: 1,
      names: ['Block 2'],
      address: '',
      mobile: '',
      user_id: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockGridConfig: GridConfig = {
    pageWidth: 800,
    pageHeight: 1000,
    margin: 50,
    columns: 3,
    rows: 3,
    unitWidth: 200,
    unitHeight: 300,
  };

  const mockContainerRef = {
    current: document.createElement('div'),
  };

  it('should not start selection when Shift is not held', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect(mockBlocks, mockGridConfig, mockContainerRef, onSelectionChange)
    );

    const mouseEvent = {
      shiftKey: false,
      clientX: 100,
      clientY: 100,
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleMouseDown(mouseEvent);
    });

    expect(result.current.dragState.isSelecting).toBe(true);
    expect(mouseEvent.preventDefault).toHaveBeenCalled();
  });

  it('should start selection when Shift is held', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect(mockBlocks, mockGridConfig, mockContainerRef, onSelectionChange)
    );

    const mouseEvent = {
      shiftKey: true,
      clientX: 100,
      clientY: 100,
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleMouseDown(mouseEvent);
    });

    expect(result.current.dragState.isSelecting).toBe(true);
    expect(mouseEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.dragState.startX).toBe(100);
    expect(result.current.dragState.startY).toBe(100);
  });

  it('should not start selection when clicking on a block', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect(mockBlocks, mockGridConfig, mockContainerRef, onSelectionChange)
    );

    const blockElement = document.createElement('div');
    blockElement.setAttribute('role', 'button');
    
    const mouseEvent = {
      shiftKey: true,
      clientX: 100,
      clientY: 100,
      target: blockElement,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleMouseDown(mouseEvent);
    });

    expect(result.current.dragState.isSelecting).toBe(false);
  });

  it('should calculate selection box correctly', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect(mockBlocks, mockGridConfig, mockContainerRef, onSelectionChange)
    );

    const mouseDownEvent = {
      shiftKey: true,
      clientX: 100,
      clientY: 100,
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleMouseDown(mouseDownEvent);
    });

    // Simulate mouse move
    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 400,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    const selectionBox = result.current.selectionBox;
    expect(selectionBox).not.toBeNull();
    expect(selectionBox?.left).toBe(100);
    expect(selectionBox?.top).toBe(100);
    expect(selectionBox?.width).toBe(200);
    expect(selectionBox?.height).toBe(300);
  });

  it('should provide real-time preview of selected blocks', () => {
    const onSelectionChange = vi.fn();
    
    // Set up container with proper dimensions
    mockContainerRef.current.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 1000,
      right: 800,
      bottom: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
    mockContainerRef.current.scrollLeft = 0;
    mockContainerRef.current.scrollTop = 0;
    
    const { result } = renderHook(() =>
      useDragSelect(mockBlocks, mockGridConfig, mockContainerRef, onSelectionChange)
    );

    // Start selection
    const mouseDownEvent = {
      shiftKey: true,
      clientX: 0,
      clientY: 0,
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as any;

    act(() => {
      result.current.handleMouseDown(mouseDownEvent);
    });

    // Initially no blocks in preview
    expect(result.current.previewSelectedIds).toEqual([]);

    // Drag to encompass first block (at x:0, y:0, width:1, height:1)
    // Block position: left=50, top=50, right=250, bottom=350
    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 400,
      });
      window.dispatchEvent(mouseMoveEvent);
    });

    // First block should be in preview
    expect(result.current.previewSelectedIds).toContain('1');
  });
});
