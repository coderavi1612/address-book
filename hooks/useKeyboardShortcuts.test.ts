import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useBlockStore } from '@/store/blockStore';
import * as blockActions from '@/app/actions/blocks';
import { AddressBlock } from '@/types/block';

// Mock the server actions
vi.mock('@/app/actions/blocks', () => ({
  deleteBlock: vi.fn(),
  duplicateBlock: vi.fn(),
}));

describe('Feature: address-book-pdf-builder - useKeyboardShortcuts', () => {
  beforeEach(() => {
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
    });
    vi.clearAllMocks();
  });

  /**
   * Property 18: Delete Keyboard Shortcut
   * **Validates: Requirements 13.1**
   */
  it('Property 18: Delete Keyboard Shortcut - Delete key removes selected block', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 10 }),
          width: fc.integer({ min: 1, max: 3 }),
          height: fc.integer({ min: 1, max: 3 }),
          page_number: fc.integer({ min: 1, max: 5 }),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        async (block: AddressBlock) => {
          useBlockStore.setState({
            blocks: [block],
            selectedBlockId: block.id,
            selectedBlockIds: [block.id],
          });

          vi.mocked(blockActions.deleteBlock).mockResolvedValue(undefined);

          renderHook(() => useKeyboardShortcuts());

          const deleteEvent = new KeyboardEvent('keydown', {
            key: 'Delete',
            bubbles: true,
            cancelable: true,
          });

          await act(async () => {
            window.dispatchEvent(deleteEvent);
            await waitFor(() => {
              expect(blockActions.deleteBlock).toHaveBeenCalledWith(block.id);
            }, { timeout: 1000 });
          });

          const state = useBlockStore.getState();
          expect(state.blocks).not.toContainEqual(block);
          expect(state.blocks.length).toBe(0);
          expect(blockActions.deleteBlock).toHaveBeenCalledWith(block.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Duplicate Keyboard Shortcut
   * **Validates: Requirements 13.2**
   */
  it('Property 19: Duplicate Keyboard Shortcut - Ctrl+D duplicates selected block', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          names: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          address: fc.string({ maxLength: 100 }),
          mobile: fc.string({ maxLength: 20 }),
          x: fc.integer({ min: 0, max: 10 }),
          y: fc.integer({ min: 0, max: 10 }),
          width: fc.integer({ min: 1, max: 3 }),
          height: fc.integer({ min: 1, max: 3 }),
          page_number: fc.integer({ min: 1, max: 5 }),
          created_at: fc.constant(new Date().toISOString()),
          updated_at: fc.constant(new Date().toISOString()),
          user_id: fc.uuid(),
        }),
        async (block: AddressBlock) => {
          vi.clearAllMocks();
          
          useBlockStore.setState({
            blocks: [block],
            selectedBlockId: block.id,
          });

          const duplicateBlock: AddressBlock = {
            ...block,
            id: 'duplicate-' + block.id,
            x: block.x + 1,
            y: block.y + 1,
          };

          vi.mocked(blockActions.duplicateBlock).mockResolvedValue(duplicateBlock);

          const { unmount } = renderHook(() => useKeyboardShortcuts());

          const duplicateEvent = new KeyboardEvent('keydown', {
            key: 'd',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          });

          await act(async () => {
            window.dispatchEvent(duplicateEvent);
            await waitFor(() => {
              expect(blockActions.duplicateBlock).toHaveBeenCalledWith(block.id);
            }, { timeout: 1000 });
          });

          const state = useBlockStore.getState();
          expect(state.blocks.length).toBe(2);
          expect(state.blocks).toContainEqual(block);
          expect(state.blocks).toContainEqual(duplicateBlock);
          expect(blockActions.duplicateBlock).toHaveBeenCalledTimes(1);
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20: Deselect Keyboard Shortcut
   * **Validates: Requirements 13.5**
   */
  it('Property 20: Deselect Keyboard Shortcut - Escape clears selectedBlockId', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (blockId: string) => {
          useBlockStore.setState({
            blocks: [],
            selectedBlockId: blockId,
          });

          renderHook(() => useKeyboardShortcuts());

          const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          });

          act(() => {
            window.dispatchEvent(escapeEvent);
          });

          const state = useBlockStore.getState();
          expect(state.selectedBlockId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('useKeyboardShortcuts - Unit Tests', () => {
  beforeEach(() => {
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delete block when Delete key is pressed with selection', async () => {
    const block: AddressBlock = {
      id: 'test-block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0, y: 0, width: 1, height: 1, page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };

    useBlockStore.setState({ blocks: [block], selectedBlockId: block.id, selectedBlockIds: [block.id] });
    vi.mocked(blockActions.deleteBlock).mockResolvedValue(undefined);

    renderHook(() => useKeyboardShortcuts());

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
      await waitFor(() => expect(blockActions.deleteBlock).toHaveBeenCalledWith(block.id));
    });

    expect(useBlockStore.getState().blocks.length).toBe(0);
  });

  it('should not delete anything when Delete key is pressed without selection', async () => {
    const block: AddressBlock = {
      id: 'test-block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0, y: 0, width: 1, height: 1, page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };

    useBlockStore.setState({ blocks: [block], selectedBlockId: null, selectedBlockIds: [] });
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
    });

    expect(useBlockStore.getState().blocks.length).toBe(1);
    expect(blockActions.deleteBlock).not.toHaveBeenCalled();
  });

  it('should duplicate block when Ctrl+D is pressed with selection', async () => {
    const block: AddressBlock = {
      id: 'test-block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0, y: 0, width: 1, height: 1, page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };
    const duplicateBlock: AddressBlock = { ...block, id: 'test-block-2', x: 1, y: 1 };

    useBlockStore.setState({ blocks: [block], selectedBlockId: block.id });
    vi.mocked(blockActions.duplicateBlock).mockResolvedValue(duplicateBlock);

    renderHook(() => useKeyboardShortcuts());

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true, cancelable: true }));
      await waitFor(() => expect(blockActions.duplicateBlock).toHaveBeenCalledWith(block.id));
    });

    expect(useBlockStore.getState().blocks.length).toBe(2);
    expect(useBlockStore.getState().blocks).toContainEqual(duplicateBlock);
  });

  it('should not duplicate anything when Ctrl+D is pressed without selection', async () => {
    const block: AddressBlock = {
      id: 'test-block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0, y: 0, width: 1, height: 1, page_number: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
    };

    useBlockStore.setState({ blocks: [block], selectedBlockId: null });
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true, cancelable: true }));
    });

    expect(useBlockStore.getState().blocks.length).toBe(1);
    expect(blockActions.duplicateBlock).not.toHaveBeenCalled();
  });

  it('should deselect block when Escape is pressed', () => {
    useBlockStore.setState({ blocks: [], selectedBlockId: 'test-block-1' });
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });

    expect(useBlockStore.getState().selectedBlockId).toBeNull();
  });

  it('should handle Escape key when nothing is selected', () => {
    useBlockStore.setState({ blocks: [], selectedBlockId: null });
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });

    expect(useBlockStore.getState().selectedBlockId).toBeNull();
  });

  it('should prevent default behavior for keyboard shortcuts', () => {
    useBlockStore.setState({ blocks: [], selectedBlockId: 'test-block-1', selectedBlockIds: ['test-block-1'] });
    renderHook(() => useKeyboardShortcuts());

    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true });
    const deletePreventDefaultSpy = vi.spyOn(deleteEvent, 'preventDefault');
    act(() => { window.dispatchEvent(deleteEvent); });
    expect(deletePreventDefaultSpy).toHaveBeenCalled();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    const escapePreventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault');
    act(() => { window.dispatchEvent(escapeEvent); });
    expect(escapePreventDefaultSpy).toHaveBeenCalled();
  });
});
