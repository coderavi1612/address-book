import { useEffect } from 'react';
import { useBlockStore } from '@/store/blockStore';
import { deleteBlock as deleteBlockAction, duplicateBlock as duplicateBlockAction } from '@/app/actions/blocks';

/**
 * Hook for handling keyboard shortcuts
 * Implements shortcuts for delete, duplicate, and deselect
 * Requirements: 13.1, 13.2, 13.5
 */
export function useKeyboardShortcuts() {
  const selectedBlockId = useBlockStore((state) => state.selectedBlockId);
  const selectedBlockIds = useBlockStore((state) => state.selectedBlockIds);
  const deleteBlocks = useBlockStore((state) => state.deleteBlocks);
  const addBlock = useBlockStore((state) => state.addBlock);
  const selectBlock = useBlockStore((state) => state.selectBlock);
  
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Delete: Delete/Backspace key (Requirement 13.1)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockIds.length > 0) {
        e.preventDefault();
        const idsToDelete = [...selectedBlockIds];
        deleteBlocks(idsToDelete);
        idsToDelete.forEach(id => {
          deleteBlockAction(id).catch(err => console.error('Failed to delete block:', err));
        });
        return;
      }
      
      // Duplicate: Ctrl/Cmd+D (Requirement 13.2)
      if (isMod && e.key === 'd' && selectedBlockId) {
        e.preventDefault();
        try {
          const newBlock = await duplicateBlockAction(selectedBlockId);
          addBlock(newBlock);
        } catch (error) {
          console.error('Failed to duplicate block:', error);
        }
        return;
      }
      
      // Deselect: Escape (Requirement 13.5)
      if (e.key === 'Escape') {
        e.preventDefault();
        selectBlock(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, selectedBlockIds, deleteBlocks, addBlock, selectBlock]);
}
