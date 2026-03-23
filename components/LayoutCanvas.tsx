'use client';

import { useState, useRef, memo, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors } from '@dnd-kit/core';
import { ConditionalPointerSensor } from '@/hooks/useConditionalPointerSensor';
import { AddressBlock } from './AddressBlock';
import { useBlockStore } from '@/store/blockStore';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useVirtualization } from '@/hooks/useVirtualization';
import { useDragSelect } from '@/hooks/useDragSelect';
import { calculateGridConfig } from '@/lib/gridConfig';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Grid3x3, RotateCw } from 'lucide-react';
import { updateBlock } from '@/app/actions/blocks';

/**
 * LayoutCanvas component with DndContext, multi-page vertical scroll,
 * page separators, grid overlay, click-to-select, and zoom controls
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 16.1, 16.2, 16.4
 */
/**
 * Inner component that uses drag and drop hooks
 * Must be inside DndContext to use useDndMonitor
 */
const CanvasContent = memo(function CanvasContent({ 
  gridConfig, 
  showGrid,
  containerRef,
  onAddBlock,
  matchIds = [],
  activeMatchId = null,
}: { 
  gridConfig: ReturnType<typeof calculateGridConfig>;
  showGrid: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAddBlock?: () => void;
  matchIds?: string[];
  activeMatchId?: string | null;
}) {
  const blocks = useBlockStore((state) => state.blocks);
  const selectedBlockId = useBlockStore((state) => state.selectedBlockId);
  const selectedBlockIds = useBlockStore((state) => state.selectedBlockIds);
  const selectBlock = useBlockStore((state) => state.selectBlock);
  const selectBlocks = useBlockStore((state) => state.selectBlocks);
  const toggleBlockSelection = useBlockStore((state) => state.toggleBlockSelection);
  const clearSelection = useBlockStore((state) => state.clearSelection);
  const zoomLevel = useBlockStore((state) => state.zoomLevel);
  
  // Initialize drag and drop handling (must be inside DndContext)
  useDragAndDrop(gridConfig);
  
  // Use virtualization to filter visible blocks for performance
  const { visibleBlocks } = useVirtualization({
    blocks,
    gridConfig,
    containerRef,
    visiblePageBuffer: 1,
  });
  
  // Initialize drag-to-select
  const { dragState, selectionBox, handleMouseDown, previewSelectedIds } = useDragSelect(
    blocks,
    gridConfig,
    containerRef,
    (selectedIds) => {
      console.log('[LayoutCanvas] Selection changed:', selectedIds);
      console.log('[LayoutCanvas] Calling selectBlocks with:', selectedIds);
      selectBlocks(selectedIds);
    }
  );
  
  // Log selection box for debugging
  useEffect(() => {
    if (selectionBox) {
      console.log('[LayoutCanvas] Selection box visible:', selectionBox);
      console.log('[LayoutCanvas] Preview selected blocks:', previewSelectedIds);
    }
  }, [selectionBox, previewSelectedIds]);
  
  // Debug: Log selectedBlockIds changes
  useEffect(() => {
    console.log('[LayoutCanvas] selectedBlockIds updated:', selectedBlockIds);
  }, [selectedBlockIds]);
  
  // Calculate number of pages needed
  const maxPage = blocks.length > 0 
    ? Math.max(...blocks.map(b => b.page_number))
    : 1;
  const pages = Array.from({ length: maxPage }, (_, i) => i + 1);

  // Build a global sequential number map: sorted by page, then y, then x
  const blockNumberMap = useMemo(() => {
    const sorted = [...blocks].sort((a, b) =>
      a.page_number !== b.page_number ? a.page_number - b.page_number :
      a.y !== b.y ? a.y - b.y : a.x - b.x
    );
    const map: Record<string, number> = {};
    sorted.forEach((b, i) => { map[b.id] = i + 1; });
    return map;
  }, [blocks]);
  
  // Handle block selection with multi-select support
  const handleBlockSelect = (id: string, isMultiSelect: boolean, isShiftSelect: boolean) => {
    if (isShiftSelect) {
      // Shift+Click: Select range from last selected to current
      if (selectedBlockIds.length > 0) {
        const lastSelectedId = selectedBlockIds[selectedBlockIds.length - 1];
        const lastIndex = blocks.findIndex(b => b.id === lastSelectedId);
        const currentIndex = blocks.findIndex(b => b.id === id);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = blocks.slice(start, end + 1).map(b => b.id);
          
          // Merge with existing selection
          const newSelection = Array.from(new Set([...selectedBlockIds, ...rangeIds]));
          selectBlocks(newSelection);
          return;
        }
      }
      // If no previous selection, just select this block
      selectBlocks([id]);
    } else if (isMultiSelect) {
      // Ctrl/Cmd+Click: Toggle individual block
      toggleBlockSelection(id);
    } else {
      // Normal click: Select only this block
      selectBlock(id);
    }
  };
  
  // Handle click on empty space to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto p-8 relative select-none"
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      role="region"
      aria-label="Address book layout canvas"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Selection Rectangle - Fixed positioning relative to viewport */}
      {selectionBox && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: `${selectionBox.left}px`,
            top: `${selectionBox.top}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
            border: '2px solid rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            zIndex: 9999,
          }}
        />
      )}
      
      <div 
            className="mx-auto select-none"
            style={{
              width: gridConfig.pageWidth,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {/* Render pages */}
            {pages.map((pageNum) => {
              // Use virtualized blocks for rendering
              const pageBlocks = visibleBlocks.filter(b => b.page_number === pageNum);
              
              return (
                <div key={pageNum} className="mb-8" data-page={pageNum}>
                  {/* Page Container */}
                  <div
                    className="relative bg-white shadow-lg mx-auto"
                    style={{
                      width: gridConfig.pageWidth,
                      height: gridConfig.pageHeight,
                    }}
                    role="article"
                    aria-label={`Page ${pageNum}`}
                  >
                    {/* Grid Overlay */}
                    {showGrid && (
                      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                        <svg width="100%" height="100%">
                          {/* Vertical lines */}
                          {Array.from({ length: gridConfig.columns + 1 }).map((_, i) => (
                            <line
                              key={`v-${i}`}
                              x1={gridConfig.margin + i * gridConfig.unitWidth}
                              y1={gridConfig.margin}
                              x2={gridConfig.margin + i * gridConfig.unitWidth}
                              y2={gridConfig.pageHeight - gridConfig.margin}
                              stroke="#e5e5e5"
                              strokeWidth="1"
                            />
                          ))}
                          {/* Horizontal lines */}
                          {Array.from({ length: gridConfig.rows + 1 }).map((_, i) => (
                            <line
                              key={`h-${i}`}
                              x1={gridConfig.margin}
                              y1={gridConfig.margin + i * gridConfig.unitHeight}
                              x2={gridConfig.pageWidth - gridConfig.margin}
                              y2={gridConfig.margin + i * gridConfig.unitHeight}
                              stroke="#e5e5e5"
                              strokeWidth="1"
                            />
                          ))}
                        </svg>
                      </div>
                    )}
                    
                    {/* Empty State for first page with no blocks */}
                    {pageNum === 1 && blocks.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="text-center space-y-4 max-w-md">
                          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Start Your Address Book
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Click "Add Block" in the toolbar above to create your first contact card.
                            </p>
                          </div>
                          <div className="space-y-2 text-xs text-gray-500 text-left bg-gray-50 rounded-lg p-4">
                            <p className="font-medium text-gray-700 mb-2">Quick Tips:</p>
                            <p>• Drag blocks to rearrange them on the page</p>
                            <p>• Resize blocks using the corner handle</p>
                            <p>• Toggle grid view to align blocks precisely</p>
                            <p>• Export to PDF when you're ready to print</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Page Content Area */}
                    <div
                      className="absolute"
                      style={{
                        left: gridConfig.margin,
                        top: gridConfig.margin,
                        width: gridConfig.pageWidth - gridConfig.margin * 2,
                        height: gridConfig.pageHeight - gridConfig.margin * 2,
                      }}
                    >
                      {/* Render blocks for this page */}
                      {pageBlocks.map((block) => {
                        const isInPreview = dragState.isSelecting && previewSelectedIds.includes(block.id);
                        const isMultiSelected = (selectedBlockIds || []).includes(block.id);
                        const isPermanentlySelected = isMultiSelected && !dragState.isSelecting;
                        
                        return (
                          <AddressBlock
                            key={block.id}
                            block={block}
                            blockNumber={blockNumberMap[block.id] ?? 0}
                            isSelected={block.id === selectedBlockId}
                            isMultiSelected={isPermanentlySelected || isInPreview}
                            isInPreview={isInPreview}
                            isSearchMatch={matchIds.includes(block.id)}
                            isActiveMatch={block.id === activeMatchId}
                            gridUnit={gridConfig.unitWidth}
                            gridConfig={gridConfig}
                            onSelect={handleBlockSelect}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Page Number */}
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400" aria-label={`Page ${pageNum} of ${maxPage}`}>
                      Page {pageNum}
                    </div>
                  </div>
                  
                  {/* Page Separator */}
                  {pageNum < maxPage && (
                    <div className="h-px bg-gray-300 my-4" role="separator" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
});

/**
 * LayoutCanvas component with DndContext, multi-page vertical scroll,
 * page separators, grid overlay, click-to-select, zoom controls, and virtualization
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 16.1, 16.2, 16.4, 20.3
 */
export function LayoutCanvas({ matchIds = [], activeMatchId = null }: { matchIds?: string[]; activeMatchId?: string | null }) {
  const zoomLevel = useBlockStore((state) => state.zoomLevel);
  const setZoomLevel = useBlockStore((state) => state.setZoomLevel);
  const pageOrientation = useBlockStore((state) => state.pageOrientation);
  const setPageOrientation = useBlockStore((state) => state.setPageOrientation);
  const [showGrid, setShowGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const gridConfig = calculateGridConfig(pageOrientation);
  
  // Configure sensors to NOT activate when Shift is held
  const sensors = useSensors(
    useSensor(ConditionalPointerSensor, {
      activationConstraint: {
        // Only activate drag if pointer moves at least 5px
        // This prevents accidental drags and allows clicks
        distance: 5,
      },
    })
  );
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  const reflowBlocks = useBlockStore((state) => state.reflowBlocks);

  const toggleOrientation = async () => {
    const newOrientation = pageOrientation === 'portrait' ? 'landscape' : 'portrait';
    setPageOrientation(newOrientation);

    // Reflow all pages and persist to DB
    const allBlocks = useBlockStore.getState().blocks;
    const pageNums = [...new Set(allBlocks.map(b => b.page_number))];
    let reflowed = allBlocks;
    for (const p of pageNums) {
      reflowed = reflowBlocks(p);
    }
    const finalBlocks = useBlockStore.getState().blocks;
    await Promise.all(
      finalBlocks.map(b => updateBlock(b.id, { x: b.x, y: b.y, width: b.width, height: b.height }))
    );
  };
  
  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white p-2 rounded-lg shadow-md" role="toolbar" aria-label="Zoom controls">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out canvas"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetZoom}
          title="Reset Zoom"
          aria-label={`Reset zoom to 100%, currently at ${Math.round(zoomLevel * 100)}%`}
        >
          {Math.round(zoomLevel * 100)}%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in canvas"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
          aria-label={showGrid ? "Hide grid overlay" : "Show grid overlay"}
          aria-pressed={showGrid}
          className={showGrid ? 'bg-blue-100' : ''}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleOrientation}
          title={`Switch to ${pageOrientation === 'portrait' ? 'Landscape' : 'Portrait'}`}
          aria-label={`Switch page orientation to ${pageOrientation === 'portrait' ? 'landscape' : 'portrait'}, currently ${pageOrientation}`}
          className={pageOrientation === 'landscape' ? 'bg-blue-100' : ''}
        >
          <RotateCw className="h-4 w-4 mr-1" />
          <span className="text-xs">{pageOrientation === 'portrait' ? 'Portrait' : 'Landscape'}</span>
        </Button>
      </div>
      
      {/* Scrollable Canvas with DndContext */}
      <DndContext sensors={sensors}>
        <CanvasContent gridConfig={gridConfig} showGrid={showGrid} containerRef={containerRef} onAddBlock={undefined} matchIds={matchIds} activeMatchId={activeMatchId} />
        <DragOverlay>
          {/* Optional: render a preview of the dragged block */}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
