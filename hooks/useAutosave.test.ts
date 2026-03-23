import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from './useAutosave';
import * as blockActions from '@/app/actions/blocks';
import { AddressBlock } from '@/types/block';

// Mock dependencies
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

describe('useAutosave Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return idle status initially', () => {
    const { result } = renderHook(() => useAutosave(mockBlock, 500));
    expect(result.current.status).toBe('idle');
  });

  it('should export AutosaveStatus type and return status object', () => {
    const { result } = renderHook(() => useAutosave(mockBlock, 500));
    expect(result.current).toHaveProperty('status');
    expect(['idle', 'saving', 'saved']).toContain(result.current.status);
  });

  it('should handle null block gracefully', () => {
    const { result } = renderHook(() => useAutosave(null, 500));
    expect(result.current.status).toBe('idle');
  });

  it('should update status to saving when block changes', () => {
    const { result, rerender } = renderHook(
      ({ block }) => useAutosave(block, 500),
      { initialProps: { block: mockBlock } }
    );

    // Initial status
    expect(result.current.status).toBe('idle');

    // Update block
    act(() => {
      rerender({ block: { ...mockBlock, address: '456 New St' } });
    });

    // Status should change to saving
    expect(result.current.status).toBe('saving');
  });

  it('should call updateBlock with correct parameters', async () => {
    const mockUpdateBlock = vi.fn().mockResolvedValue(mockBlock);
    vi.mocked(blockActions.updateBlock).mockImplementation(mockUpdateBlock);

    const { rerender } = renderHook(
      ({ block }) => useAutosave(block, 100),
      { initialProps: { block: mockBlock } }
    );

    // Update block
    act(() => {
      rerender({ block: { ...mockBlock, address: '456 New St' } });
    });

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockUpdateBlock).toHaveBeenCalledWith('test-block-1', {
      names: ['John Doe'],
      address: '456 New St',
      mobile: '123-456-7890',
    });
  });

  it('should handle errors gracefully', async () => {
    const mockUpdateBlock = vi.fn().mockRejectedValue(new Error('Save failed'));
    vi.mocked(blockActions.updateBlock).mockImplementation(mockUpdateBlock);

    const { result, rerender } = renderHook(
      ({ block }) => useAutosave(block, 100),
      { initialProps: { block: mockBlock } }
    );

    // Update block
    act(() => {
      rerender({ block: { ...mockBlock, address: '456 New St' } });
    });

    // Wait for debounce and error handling
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should return to idle on error
    expect(result.current.status).toBe('idle');
  });
});

