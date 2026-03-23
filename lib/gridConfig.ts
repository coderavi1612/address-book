import { GridConfig } from '@/types/block';

export type PageOrientation = 'portrait' | 'landscape';

export function calculateGridConfig(orientation: PageOrientation = 'portrait'): GridConfig {
  // A4 dimensions in points (1 point = 1/72 inch)
  const A4_WIDTH_PORTRAIT = 595.28;
  const A4_HEIGHT_PORTRAIT = 841.89;
  
  // Swap dimensions for landscape
  const pageWidth = orientation === 'portrait' ? A4_WIDTH_PORTRAIT : A4_HEIGHT_PORTRAIT;
  const pageHeight = orientation === 'portrait' ? A4_HEIGHT_PORTRAIT : A4_WIDTH_PORTRAIT;
  
  // Margins in points (20mm = ~56.69 points)
  const MARGIN = 56.69;
  
  // Usable area
  const usableWidth = pageWidth - (MARGIN * 2);
  const usableHeight = pageHeight - (MARGIN * 2);
  
  // Default grid
  const COLUMNS = 3;
  const ROWS = 3;
  
  // Calculate unit dimensions
  const unitWidth = usableWidth / COLUMNS;
  const unitHeight = usableHeight / ROWS;
  
  return {
    columns: COLUMNS,
    rows: ROWS,
    unitWidth,
    unitHeight,
    pageWidth,
    pageHeight,
    margin: MARGIN,
  };
}
