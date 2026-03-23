export interface AddressBlock {
  id: string;
  names: string[];
  address: string;
  mobile: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page_number: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface GridConfig {
  columns: number;
  rows: number;
  unitWidth: number;
  unitHeight: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
}

export type PageOrientation = 'portrait' | 'landscape';

export interface BlockStore {
  blocks: AddressBlock[];
  selectedBlockId: string | null;
  selectedBlockIds: string[]; // Multi-select support
  currentPage: number;
  zoomLevel: number;
  pageOrientation: PageOrientation;

  // Actions
  setBlocks: (blocks: AddressBlock[]) => void;
  addBlock: (block: AddressBlock) => void;
  updateBlock: (id: string, updates: Partial<AddressBlock>) => void;
  deleteBlock: (id: string) => void;
  deleteBlocks: (ids: string[]) => void; // Bulk delete
  selectBlock: (id: string | null) => void;
  selectBlocks: (ids: string[]) => void; // Multi-select
  toggleBlockSelection: (id: string) => void; // Toggle selection
  clearSelection: () => void; // Clear all selections
  setCurrentPage: (page: number) => void;
  setZoomLevel: (level: number) => void;
  setPageOrientation: (orientation: PageOrientation) => void;
  reflowBlocks: (pageNum: number, resizedBlockId?: string) => AddressBlock[];
}
