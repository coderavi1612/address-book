import { useState, useRef, useEffect, useCallback } from 'react';
import { AddressBlock, GridConfig } from '@/types/block';

interface DragSelectState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface SelectionBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function useDragSelect(
  blocks: AddressBlock[],
  gridConfig: GridConfig,
  containerRef: React.RefObject<HTMLDivElement>,
  onSelectionChange: (selectedIds: string[]) => void
) {
  const [dragState, setDragState] = useState<DragSelectState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const isDraggingRef = useRef(false);

  // Calculate selection box dimensions
  const getSelectionBox = useCallback((): SelectionBox | null => {
    if (!dragState.isSelecting) return null;

    const left = Math.min(dragState.startX, dragState.currentX);
    const top = Math.min(dragState.startY, dragState.currentY);
    const width = Math.abs(dragState.currentX - dragState.startX);
    const height = Math.abs(dragState.currentY - dragState.startY);

    return { left, top, width, height };
  }, [dragState]);

  // Check if a block intersects with the selection box
  const isBlockInSelection = useCallback(
    (block: AddressBlock, selectionBox: SelectionBox): boolean => {
      const blockLeft = block.x * gridConfig.unitWidth + gridConfig.margin;
      const blockTop = block.y * gridConfig.unitHeight + gridConfig.margin;
      const blockRight = blockLeft + block.width * gridConfig.unitWidth;
      const blockBottom = blockTop + block.height * gridConfig.unitHeight;

      const selectionRight = selectionBox.left + selectionBox.width;
      const selectionBottom = selectionBox.top + selectionBox.height;

      // Check for intersection
      return !(
        blockRight < selectionBox.left ||
        blockLeft > selectionRight ||
        blockBottom < selectionBox.top ||
        blockTop > selectionBottom
      );
    },
    [gridConfig]
  );

  // Handle mouse down to start selection
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    console.log('[DragSelect] Mouse down');
    
    // Only start selection on canvas background (not on blocks)
    if ((e.target as HTMLElement).closest('[role="button"]')) {
      console.log('[DragSelect] Clicked on block, ignoring');
      return;
    }

    console.log('[DragSelect] Starting selection at', e.clientX, e.clientY);

    // Prevent text selection and default drag behavior
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    // Use client coordinates for simpler positioning
    const x = e.clientX;
    const y = e.clientY;

    isDraggingRef.current = true;
    setDragState({
      isSelecting: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  }, [containerRef]);

  // Handle mouse move during selection
  useEffect(() => {
    if (!dragState.isSelecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Use client coordinates
      const x = e.clientX;
      const y = e.clientY;

      console.log('[DragSelect] Mouse move to', x, y);

      setDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      console.log('[DragSelect] Mouse up, ending selection');

      isDraggingRef.current = false;
      
      // Calculate selected blocks
      const selectionBox = getSelectionBox();
      if (selectionBox && (selectionBox.width > 5 || selectionBox.height > 5)) {
        const container = containerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        
        // Convert selection box from viewport coordinates to container coordinates
        const containerSelectionBox = {
          left: selectionBox.left - rect.left + container.scrollLeft,
          top: selectionBox.top - rect.top + container.scrollTop,
          width: selectionBox.width,
          height: selectionBox.height,
        };
        
        console.log('[DragSelect] Selection box:', containerSelectionBox);
        
        const selectedIds = blocks
          .filter((block) => isBlockInSelection(block, containerSelectionBox))
          .map((block) => block.id);
        
        console.log('[DragSelect] Selected blocks:', selectedIds);
        
        onSelectionChange(selectedIds);
      }

      setDragState({
        isSelecting: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isSelecting, blocks, containerRef, getSelectionBox, isBlockInSelection, onSelectionChange]);

  // Calculate which blocks are currently in the selection box (for live preview)
  const getBlocksInSelection = useCallback((): string[] => {
    const selectionBox = getSelectionBox();
    if (!selectionBox || !containerRef.current) return [];
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Convert selection box from viewport coordinates to container coordinates
    const containerSelectionBox = {
      left: selectionBox.left - rect.left + containerRef.current.scrollLeft,
      top: selectionBox.top - rect.top + containerRef.current.scrollTop,
      width: selectionBox.width,
      height: selectionBox.height,
    };
    
    return blocks
      .filter((block) => isBlockInSelection(block, containerSelectionBox))
      .map((block) => block.id);
  }, [blocks, containerRef, getSelectionBox, isBlockInSelection]);

  return {
    dragState,
    selectionBox: getSelectionBox(),
    handleMouseDown,
    previewSelectedIds: getBlocksInSelection(),
  };
}
