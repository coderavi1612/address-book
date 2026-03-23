'use client';

import { memo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AddressBlock as AddressBlockType, GridConfig } from '@/types/block';
import { useResize } from '@/hooks/useResize';

interface AddressBlockProps {
  block: AddressBlockType;
  blockNumber: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  isInPreview?: boolean;
  isSearchMatch?: boolean;
  isActiveMatch?: boolean;
  gridUnit: number;
  gridConfig: GridConfig;
  onSelect: (id: string, isMultiSelect: boolean, isShiftSelect: boolean) => void;
}

export const AddressBlock = memo(function AddressBlock({
  block,
  blockNumber,
  isSelected,
  isMultiSelected,
  isInPreview = false,
  isSearchMatch = false,
  isActiveMatch = false,
  gridUnit,
  gridConfig,
  onSelect,
}: AddressBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
  });

  const { isResizing, handleResizeStart, handleResize, handleResizeEnd } = useResize(
    block.id,
    gridConfig
  );

  const style = {
    left: block.x * gridConfig.unitWidth,
    top: block.y * gridConfig.unitHeight,
    width: block.width * gridConfig.unitWidth,
    height: block.height * gridConfig.unitHeight,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handle click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
    const isShiftSelect = e.shiftKey; // Shift for range selection
    onSelect(block.id, isMultiSelect, isShiftSelect);
  };

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: any) => {
      handleResize(e);
    };

    const handleMouseUp = () => {
      handleResizeEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      data-block-id={block.id}
      className={`
        absolute rounded-lg transition-all duration-200 shadow-sm select-none
        ${isActiveMatch ? 'search-match-active' :
          isSearchMatch ? 'search-match' :
          isSelected || isMultiSelected
            ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-200' 
            : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
        ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
        ${isInPreview ? 'bg-blue-50' : 'bg-white'}
      `}
      style={{
        ...style,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Address block for ${block.names.filter(n => n).join(', ') || 'New Contact'}`}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(block.id, false, false);
        }
      }}
    >
      {/* Drag handle - improved visual */}
      <div
        {...listeners}
        {...attributes}
        className={`
          px-3 py-2 cursor-grab active:cursor-grabbing rounded-t-lg
          border-b transition-colors
          ${isSelected || isMultiSelected
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
        aria-label="Drag handle to move block"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-xs text-gray-400 font-medium w-4 flex-shrink-0">{blockNumber}</span>
          <span className="text-xs text-gray-500 font-medium truncate">
            {block.names.filter(n => n).length > 0 ? block.names.filter(n => n)[0] : 'New Contact'}
          </span>
        </div>
      </div>
      
      {/* Content area - improved spacing and typography */}
      <div className="p-3 space-y-1">
        {block.names.filter(n => n).length > 0 ? (
          <>
            {block.names.filter(n => n).map((name, idx) => (
              <div key={idx} className="font-semibold text-sm text-gray-900 leading-tight">
                {name}
              </div>
            ))}
            {block.address && (
              <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                {block.address}
              </div>
            )}
            {block.mobile && (
              <div className="text-xs text-gray-600 font-medium">
                {block.mobile}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-400 italic">
            Click to edit
          </div>
        )}
      </div>
      
      {/* Resize handle - improved visual */}
      {isSelected && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-tl-lg rounded-br-lg cursor-se-resize hover:bg-blue-600 transition-colors flex items-center justify-center"
          style={{ cursor: 'se-resize' }}
          aria-label="Resize handle to change block size"
          role="button"
          tabIndex={0}
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H10M17 7v7" />
          </svg>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.blockNumber === nextProps.blockNumber &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMultiSelected === nextProps.isMultiSelected &&
    prevProps.isInPreview === nextProps.isInPreview &&
    prevProps.isSearchMatch === nextProps.isSearchMatch &&
    prevProps.isActiveMatch === nextProps.isActiveMatch &&
    prevProps.block.x === nextProps.block.x &&
    prevProps.block.y === nextProps.block.y &&
    prevProps.block.width === nextProps.block.width &&
    prevProps.block.height === nextProps.block.height &&
    prevProps.gridConfig.unitWidth === nextProps.gridConfig.unitWidth &&
    prevProps.gridConfig.unitHeight === nextProps.gridConfig.unitHeight &&
    JSON.stringify(prevProps.block.names) === JSON.stringify(nextProps.block.names) &&
    prevProps.block.address === nextProps.block.address &&
    prevProps.block.mobile === nextProps.block.mobile
  );
});
