'use client';

import { useBlockStore } from '@/store/blockStore';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { createBlock } from '@/app/actions/blocks';
import { toast } from 'sonner';
import { memo } from 'react';

/**
 * PageNavigator component displays page thumbnails with click-to-scroll functionality
 * Requirements: 8.2, 8.3, 8.4, 8.6
 */
export const PageNavigator = memo(function PageNavigator() {
  const blocks = useBlockStore((state) => state.blocks);
  const currentPage = useBlockStore((state) => state.currentPage);
  const setCurrentPage = useBlockStore((state) => state.setCurrentPage);
  const addBlock = useBlockStore((state) => state.addBlock);
  
  // Calculate number of pages
  const maxPage = blocks.length > 0 
    ? Math.max(...blocks.map(b => b.page_number))
    : 1;
  const pages = Array.from({ length: maxPage }, (_, i) => i + 1);
  
  // Handle page click - scroll to page
  const handlePageClick = (pageNum: number) => {
    setCurrentPage(pageNum);
    
    // Scroll to the page in the canvas
    const pageElement = document.querySelector(`[data-page="${pageNum}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Handle Add Page button - creates a new empty page
  const handleAddPage = async () => {
    try {
      const newPageNumber = maxPage + 1;
      
      // Create a new block on the new page at position (0, 0)
      const newBlock = await createBlock({
        names: ['New Contact'],
        address: '',
        mobile: '',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: newPageNumber,
      });
      
      addBlock(newBlock);
      setCurrentPage(newPageNumber);
      
      // Scroll to the new page
      setTimeout(() => {
        const pageElement = document.querySelector(`[data-page="${newPageNumber}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      toast.success('New page added');
    } catch (error) {
      console.error('Failed to add page:', error);
      toast.error('Failed to add page');
    }
  };
  
  return (
    <div className="w-48 bg-white border-r border-gray-200 p-4 overflow-y-auto" role="navigation" aria-label="Page navigation">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Pages</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddPage}
          title="Add Page"
          aria-label="Add new page"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3" role="list">
        {pages.map((pageNum) => {
          const pageBlocks = blocks.filter(b => b.page_number === pageNum);
          const isActive = pageNum === currentPage;
          
          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              className={`
                w-full p-2 rounded border-2 transition-all
                ${isActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
              role="listitem"
              aria-label={`Page ${pageNum}, ${pageBlocks.length} ${pageBlocks.length === 1 ? 'block' : 'blocks'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Thumbnail preview */}
              <div className="aspect-[1/1.414] bg-gray-50 border border-gray-200 rounded mb-2 relative overflow-hidden" aria-hidden="true">
                {/* Simplified thumbnail showing block positions */}
                {pageBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="absolute bg-blue-200 border border-blue-300"
                    style={{
                      left: `${(block.x / 3) * 100}%`,
                      top: `${(block.y / 3) * 100}%`,
                      width: `${(block.width / 3) * 100}%`,
                      height: `${(block.height / 3) * 100}%`,
                    }}
                  />
                ))}
              </div>
              
              {/* Page number */}
              <div className="text-xs font-medium text-gray-700">
                Page {pageNum}
              </div>
              
              {/* Block count */}
              <div className="text-xs text-gray-500">
                {pageBlocks.length} {pageBlocks.length === 1 ? 'block' : 'blocks'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
