import { useState, useCallback, MouseEvent } from 'react';
import { useBlockStore } from '@/store/blockStore';
import { updateBlock } from '@/app/actions/blocks';
import { GridConfig, AddressBlock } from '@/types/block';

/**
 * Calculate new dimensions after resize operation
 * Exported for testing purposes
 */
export function calculateResizeDimensions(
  block: AddressBlock,
  deltaWidth: number,
  deltaHeight: number,
  gridConfig: GridConfig
) {
  // Calculate new dimensions in grid units (snap to grid)
  const deltaWidthUnits = Math.round(deltaWidth / gridConfig.unitWidth);
  const deltaHeightUnits = Math.round(deltaHeight / gridConfig.unitHeight);
  
  // Calculate new dimensions (enforce minimum of 1 grid unit)
  const newWidth = Math.max(1, block.width + deltaWidthUnits);
  const newHeight = Math.max(1, block.height + deltaHeightUnits);
  
  return {
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Hook for handling resize functionality
 * Calculates new dimensions in grid units, enforces minimum dimensions,
 * performs optimistic update to store, and persists to database
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function useResize(blockId: string, gridConfig: GridConfig) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 });
  const updateBlockInStore = useBlockStore((state) => state.updateBlock);
  const blocks = useBlockStore((state) => state.blocks);
  
  const handleResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartDimensions({ width: block.width, height: block.height });
  }, [blockId, blocks]);
  
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    
    const deltaWidth = e.clientX - startPos.x;
    const deltaHeight = e.clientY - startPos.y;
    
    const newDimensions = calculateResizeDimensions(
      { ...block, width: startDimensions.width, height: startDimensions.height },
      deltaWidth,
      deltaHeight,
      gridConfig
    );
    
    // updateBlock triggers reflow automatically when dimensions change
    updateBlockInStore(blockId, newDimensions);
  }, [isResizing, blockId, blocks, startPos, startDimensions, gridConfig, updateBlockInStore]);
  
  const handleResizeEnd = useCallback(async () => {
    if (!isResizing) return;
    setIsResizing(false);

    // The store already has the reflowed state from the last handleResize call.
    // Read it directly — do NOT call reflowBlocks again (that would re-run on stale data).
    const currentBlocks = useBlockStore.getState().blocks;

    try {
      // Persist every block — positions and sizes may have changed due to reflow cascade
      await Promise.all(
        currentBlocks.map(b => updateBlock(b.id, {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          page_number: b.page_number,
        }))
      );
    } catch (error) {
      console.error('Failed to persist reflowed blocks:', error);
      updateBlockInStore(blockId, {
        width: startDimensions.width,
        height: startDimensions.height,
      });
    }
  }, [isResizing, blockId, startDimensions, updateBlockInStore]);
  
  return {
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
  };
}
