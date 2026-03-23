import { create } from 'zustand';
import { AddressBlock, BlockStore } from '@/types/block';
import { PageOrientation } from '@/lib/gridConfig';

const COLS = 3;
const ROWS = 3;

/**
 * Pack blocks starting from pageNum, cascading overflow to subsequent pages.
 * - The resized block (if provided) is always placed first on its page.
 * - Other blocks fill around it in reading order.
 * - Blocks that don't fit spill to the next page (cascade).
 * - Page numbers are compacted at the end (no gaps).
 */
function reflowFromPage(blocks: AddressBlock[], startPage: number, resizedBlockId?: string): AddressBlock[] {
  const maxPage = Math.max(...blocks.map(b => b.page_number), startPage);
  let working = [...blocks];

  for (let page = startPage; page <= maxPage + 1; page++) {
    const pageBlocks = working.filter(b => b.page_number === page);
    if (pageBlocks.length === 0) continue;

    const otherBlocks = working.filter(b => b.page_number !== page);

    // Resized block goes first on its page so others flow around it
    const resized = resizedBlockId ? pageBlocks.find(b => b.id === resizedBlockId) : undefined;
    const rest = pageBlocks
      .filter(b => b.id !== resizedBlockId)
      .sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
    const sorted = resized ? [resized, ...rest] : rest;

    // Grid occupancy map for this page
    const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    const mark = (x: number, y: number, w: number, h: number) => {
      for (let row = y; row < y + h; row++)
        for (let col = x; col < x + w; col++)
          if (row < ROWS && col < COLS) grid[row][col] = true;
    };

    const fits = (x: number, y: number, w: number, h: number): boolean => {
      if (x + w > COLS || y + h > ROWS) return false;
      for (let row = y; row < y + h; row++)
        for (let col = x; col < x + w; col++)
          if (grid[row][col]) return false;
      return true;
    };

    const placed: AddressBlock[] = [];
    const overflow: AddressBlock[] = [];

    for (const block of sorted) {
      const w = Math.min(block.width, COLS);
      const h = Math.min(block.height, ROWS);
      let found = false;

      // For the resized block, try its current position first before scanning
      const candidates: Array<[number, number]> = [];
      if (block.id === resizedBlockId) {
        candidates.push([block.x, block.y]);
      }
      // Then scan top-left to bottom-right
      for (let row = 0; row < ROWS; row++)
        for (let col = 0; col < COLS; col++)
          if (!candidates.some(([cx, cy]) => cx === col && cy === row))
            candidates.push([col, row]);

      for (const [col, row] of candidates) {
        if (fits(col, row, w, h)) {
          mark(col, row, w, h);
          placed.push({ ...block, x: col, y: row, width: w, height: h, page_number: page });
          found = true;
          break;
        }
      }

      if (!found) {
        overflow.push({ ...block, x: 0, y: 0, width: w, height: h, page_number: page + 1 });
      }
    }

    working = [...otherBlocks, ...placed, ...overflow];
  }

  // Compact page numbers (remove gaps)
  const usedPages = [...new Set(working.map(b => b.page_number))].sort((a, b) => a - b);
  const pageRemap: Record<number, number> = {};
  usedPages.forEach((p, i) => { pageRemap[p] = i + 1; });

  return working.map(b => ({ ...b, page_number: pageRemap[b.page_number] }));
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  selectedBlockIds: [],
  currentPage: 1,
  zoomLevel: 1,
  pageOrientation: 'landscape',
  
  setBlocks: (blocks) => set({ blocks }),
  
  addBlock: (block) => {
    set((state) => ({ 
      blocks: [...state.blocks, block],
      selectedBlockId: block.id,
      selectedBlockIds: [block.id],
    }));
  },
  
  updateBlock: (id, updates) => {
    set((state) => {
      const updatedBlocks = state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
      const isDimensionChange = updates.width !== undefined || updates.height !== undefined;
      const finalBlocks = isDimensionChange
        ? reflowFromPage(updatedBlocks, updatedBlocks.find(b => b.id === id)?.page_number ?? 1, id)
        : updatedBlocks;
      return { blocks: finalBlocks };
    });
  },
  
  deleteBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      selectedBlockIds: state.selectedBlockIds.filter((bid) => bid !== id),
    }));
  },
  
  deleteBlocks: (ids) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => !ids.includes(b.id)),
      selectedBlockId: ids.includes(state.selectedBlockId || '') ? null : state.selectedBlockId,
      selectedBlockIds: state.selectedBlockIds.filter((bid) => !ids.includes(bid)),
    }));
  },
  
  selectBlock: (id) => set({ 
    selectedBlockId: id,
    selectedBlockIds: id ? [id] : []
  }),
  
  selectBlocks: (ids) => set({
    selectedBlockIds: ids,
    selectedBlockId: ids.length === 1 ? ids[0] : null
  }),
  
  toggleBlockSelection: (id) => set((state) => {
    const isSelected = state.selectedBlockIds.includes(id);
    const newSelectedIds = isSelected
      ? state.selectedBlockIds.filter((bid) => bid !== id)
      : [...state.selectedBlockIds, id];
    
    return {
      selectedBlockIds: newSelectedIds,
      selectedBlockId: newSelectedIds.length === 1 ? newSelectedIds[0] : null
    };
  }),
  
  clearSelection: () => set({
    selectedBlockId: null,
    selectedBlockIds: []
  }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setZoomLevel: (level) => set({ zoomLevel: level }),

  reflowBlocks: (pageNum: number, resizedBlockId?: string) => {
    const state = get();
    const reflowed = reflowFromPage(state.blocks, pageNum, resizedBlockId);
    set({ blocks: reflowed });
    return reflowed;
  },
  
  setPageOrientation: (orientation: PageOrientation) => {
    const state = get();
    // Constrain all blocks to fit within the new grid (3x3), then reflow from page 1
    const MAX_X = 2;
    const MAX_Y = 2;
    const constrained = state.blocks.map(block => {
      const newX = Math.min(block.x, MAX_X);
      const newY = Math.min(block.y, MAX_Y);
      const newWidth = Math.min(block.width, MAX_X - newX + 1);
      const newHeight = Math.min(block.height, MAX_Y - newY + 1);
      return { ...block, x: newX, y: newY, width: newWidth, height: newHeight };
    });
    const reflowed = reflowFromPage(constrained, 1);
    set({ pageOrientation: orientation, blocks: reflowed });
  },
}));
