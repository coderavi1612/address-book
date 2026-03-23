import { useDndMonitor, DragEndEvent } from '@dnd-kit/core';
import { useBlockStore } from '@/store/blockStore';
import { updateBlock } from '@/app/actions/blocks';
import { GridConfig, AddressBlock } from '@/types/block';

/**
 * Calculate new position after drag operation
 * Exported for testing purposes
 */
export function calculateDragPosition(
  block: AddressBlock,
  delta: { x: number; y: number },
  gridConfig: GridConfig
) {
  // Calculate new position in grid units (snap to grid)
  const deltaX = Math.round(delta.x / gridConfig.unitWidth);
  const deltaY = Math.round(delta.y / gridConfig.unitHeight);
  
  // Calculate new position (ensure non-negative)
  const newX = Math.max(0, block.x + deltaX);
  const newY = Math.max(0, block.y + deltaY);
  
  // Calculate page number based on Y position
  // Each page has gridConfig.rows rows
  const newPage = Math.floor(newY / gridConfig.rows) + 1;
  const pageY = newY % gridConfig.rows;
  
  return {
    x: newX,
    y: pageY,
    page_number: newPage,
  };
}

/**
 * Hook for handling drag-and-drop functionality with dnd-kit
 * Calculates new position in grid units, determines page number,
 * performs optimistic update to store, and persists to database
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export function useDragAndDrop(gridConfig: GridConfig) {
  const updateBlockInStore = useBlockStore((state) => state.updateBlock);
  const blocks = useBlockStore((state) => state.blocks);
  
  useDndMonitor({
    onDragEnd: async (event: DragEndEvent) => {
      const { active, delta } = event;
      const blockId = active.id as string;
      
      // Get current block
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      
      // Calculate new position
      const newPosition = calculateDragPosition(block, delta, gridConfig);
      
      // Optimistic update to store
      updateBlockInStore(blockId, newPosition);
      
      // Persist to database via server action
      try {
        await updateBlock(blockId, newPosition);
      } catch (error) {
        console.error('Failed to update block position:', error);
        // Revert optimistic update on error
        updateBlockInStore(blockId, {
          x: block.x,
          y: block.y,
          page_number: block.page_number,
        });
      }
    },
  });
}
