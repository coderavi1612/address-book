'use client';

import { useState, useRef, useEffect } from 'react';
import { BlockEditor } from './BlockEditor';
import { LayoutCanvas } from './LayoutCanvas';
import { Toolbar } from './Toolbar';
import { SearchBar } from './SearchBar';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';
import { createBlock, deleteBlock } from '@/app/actions/blocks';
import { useExportPDF } from '@/hooks/useExportPDF';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSearch } from '@/hooks/useSearch';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * EditorLayout component with split-screen layout
 * Features:
 * - Resizable panels (40% editor, 60% canvas default)
 * - Responsive behavior for tablet and mobile
 * - Drag handle for resizing
 * - Hydrates BlockStore from server-fetched data
 * - Toolbar with Add Block and Export PDF buttons
 * - Loading states and error dialogs
 * Requirements: 4.1, 10.5, 14.5, 14.6, 19.1, 19.2
 */
interface EditorLayoutProps {
  initialBlocks: AddressBlock[];
}

export function EditorLayout({ initialBlocks }: EditorLayoutProps) {
  const selectedBlockId = useBlockStore((state) => state.selectedBlockId);
  const selectedBlockIds = useBlockStore((state) => state.selectedBlockIds || []);
  const setBlocks = useBlockStore((state) => state.setBlocks);
  const addBlock = useBlockStore((state) => state.addBlock);
  const deleteBlocks = useBlockStore((state) => state.deleteBlocks);
  const { exportPDF, isExporting, error: pdfError, clearError } = useExportPDF();
  useKeyboardShortcuts();
  const search = useSearch();
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  
  // Hydrate BlockStore on mount
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks, setBlocks]);
  
  // Handle Add Block button
  const handleAddBlock = async () => {
    setIsAddingBlock(true);
    try {
      const currentBlocks = useBlockStore.getState().blocks;
      const COLS = 3;
      const ROWS = 3;

      // Find the highest page number in use
      const maxPage = currentBlocks.length > 0
        ? Math.max(...currentBlocks.map(b => b.page_number))
        : 1;

      // Search for a free 1x1 slot, page by page
      let targetX = 0;
      let targetY = 0;
      let targetPage = 1;
      let positionFound = false;

      for (let page = 1; page <= maxPage && !positionFound; page++) {
        for (let row = 0; row < ROWS && !positionFound; row++) {
          for (let col = 0; col < COLS && !positionFound; col++) {
            // A slot is occupied if any block overlaps it
            const isOccupied = currentBlocks.some(
              b =>
                b.page_number === page &&
                col >= b.x && col < b.x + b.width &&
                row >= b.y && row < b.y + b.height
            );
            if (!isOccupied) {
              targetX = col;
              targetY = row;
              targetPage = page;
              positionFound = true;
            }
          }
        }
      }

      // If no free slot found on existing pages, start a new page
      if (!positionFound) {
        targetX = 0;
        targetY = 0;
        targetPage = maxPage + 1;
      }

      const newBlock = await createBlock({
        names: ['New Contact'],
        address: '',
        mobile: '',
        x: targetX,
        y: targetY,
        width: 1,
        height: 1,
        page_number: targetPage,
      });

      addBlock(newBlock);
      toast.success('Block added successfully');
    } catch (error) {
      console.error('Failed to add block:', error);
      toast.error('Failed to add block');
    } finally {
      setIsAddingBlock(false);
    }
  };
  
  // Handle Delete Selected Blocks
  const handleDeleteSelected = async () => {
    if (selectedBlockIds.length === 0) return;
    
    try {
      // Delete from database
      await Promise.all(selectedBlockIds.map(id => deleteBlock(id)));
      
      // Delete from store
      deleteBlocks(selectedBlockIds);
      
      toast.success(`Deleted ${selectedBlockIds.length} block(s)`);
    } catch (error) {
      console.error('Failed to delete blocks:', error);
      toast.error('Failed to delete blocks');
    }
  };
  
  // Panel sizing state (percentage of total width)
  const [editorWidth, setEditorWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'canvas'>('editor');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(40);
  
  // Detect mobile/tablet breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle resize start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = editorWidth;
  };
  
  // Handle resize move
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      // Calculate new width with constraints (20% - 80%)
      const newWidth = Math.min(
        Math.max(startWidthRef.current + deltaPercent, 20),
        80
      );
      
      setEditorWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  // Mobile/Tablet: Tabbed interface
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <Toolbar 
          onAddBlock={handleAddBlock} 
          onExportPDF={exportPDF}
          onDeleteSelected={handleDeleteSelected}
          isAddingBlock={isAddingBlock}
          isExporting={isExporting}
          selectedCount={selectedBlockIds.length}
          onOpenSearch={search.open}
        />
        <SearchBar searchHook={search} />
        
        {/* Tab Navigation */}
        <div className="flex border-b bg-white" role="tablist" aria-label="Editor view tabs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'editor'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            role="tab"
            aria-selected={activeTab === 'editor'}
            aria-controls="editor-panel"
            id="editor-tab"
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'canvas'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            role="tab"
            aria-selected={activeTab === 'canvas'}
            aria-controls="canvas-panel"
            id="canvas-tab"
          >
            Preview
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' ? (
            <div className="h-full overflow-auto bg-white" role="tabpanel" id="editor-panel" aria-labelledby="editor-tab">
              <BlockEditor selectedBlockId={selectedBlockId} />
            </div>
          ) : (
            <div className="h-full overflow-hidden" role="tabpanel" id="canvas-panel" aria-labelledby="canvas-tab">
              <LayoutCanvas matchIds={search.isOpen ? search.matches.map(b => b.id) : []} activeMatchId={search.isOpen ? search.activeMatchId : null} />
            </div>
          )}
        </div>
        
        {/* PDF Error Dialog */}
        <Dialog open={!!pdfError} onOpenChange={(open) => !open && clearError()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                PDF Export Failed
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-2">
                <p className="text-sm">
                  We encountered an error while generating your PDF:
                </p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {pdfError}
                </p>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Troubleshooting steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Check that all blocks have valid data</li>
                    <li>Try reducing the number of blocks</li>
                    <li>Ensure your browser allows downloads</li>
                    <li>Try refreshing the page and exporting again</li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={clearError}>
                Close
              </Button>
              <Button onClick={() => { clearError(); exportPDF(); }}>
                Retry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Desktop: Split-screen with resizable panels
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toolbar */}
      <Toolbar 
        onAddBlock={handleAddBlock} 
        onExportPDF={exportPDF}
        onDeleteSelected={handleDeleteSelected}
        isAddingBlock={isAddingBlock}
        isExporting={isExporting}
        selectedCount={selectedBlockIds.length}
        onOpenSearch={search.open}
      />
      <SearchBar searchHook={search} />
      
      {/* Editor and Canvas */}
      <div
        ref={containerRef}
        className="flex flex-1 w-full overflow-hidden"
      >
        {/* Editor Panel */}
        <div
          className="flex-shrink-0 overflow-auto bg-white border-r"
          style={{ width: `${editorWidth}%` }}
        >
          <BlockEditor selectedBlockId={selectedBlockId} />
        </div>
        
        {/* Resize Handle */}
        <div
          className={`
            relative w-1 bg-gray-200 cursor-col-resize hover:bg-blue-400 
            transition-colors flex-shrink-0
            ${isResizing ? 'bg-blue-500' : ''}
          `}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setEditorWidth(Math.max(editorWidth - 5, 20));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setEditorWidth(Math.min(editorWidth + 5, 80));
            }
          }}
        >
          {/* Visual indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full" />
        </div>
        
        {/* Canvas Panel */}
        <div
          className="flex-1 overflow-hidden"
          style={{ width: `${100 - editorWidth}%` }}
        >
          <LayoutCanvas matchIds={search.isOpen ? search.matches.map(b => b.id) : []} activeMatchId={search.isOpen ? search.activeMatchId : null} />
        </div>
      </div>
      
      {/* PDF Error Dialog */}
      <Dialog open={!!pdfError} onOpenChange={(open) => !open && clearError()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              PDF Export Failed
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="text-sm">
                We encountered an error while generating your PDF:
              </p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {pdfError}
              </p>
              <div className="text-sm space-y-2">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Check that all blocks have valid data</li>
                  <li>Try reducing the number of blocks</li>
                  <li>Ensure your browser allows downloads</li>
                  <li>Try refreshing the page and exporting again</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={clearError}>
              Close
            </Button>
            <Button onClick={() => { clearError(); exportPDF(); }}>
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
