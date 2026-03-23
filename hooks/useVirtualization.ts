import { useMemo, useEffect, useState, useRef } from 'react';
import { AddressBlock, GridConfig } from '@/types/block';

interface VirtualizationOptions {
  blocks: AddressBlock[];
  gridConfig: GridConfig;
  containerRef: React.RefObject<HTMLElement | null>;
  visiblePageBuffer?: number;
}

interface VirtualizationResult {
  visibleBlocks: AddressBlock[];
  visiblePages: number[];
}

/**
 * Hook for virtualizing large layouts by filtering visible blocks
 * Only renders blocks on pages that are currently visible in the viewport
 * Includes a buffer of pages above and below for smooth scrolling
 * Requirements: 20.3
 */
export function useVirtualization({
  blocks,
  gridConfig,
  containerRef,
  visiblePageBuffer = 1,
}: VirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  // Track scroll position and container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize container height
    setContainerHeight(container.clientHeight);

    // Handle scroll with requestAnimationFrame for performance
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
      });
    };

    // Handle resize
    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef]);

  // Calculate visible pages and filter blocks
  const { visibleBlocks, visiblePages } = useMemo(() => {
    if (!containerHeight || blocks.length === 0) {
      return { visibleBlocks: blocks, visiblePages: [] };
    }

    // Calculate page height including margin/spacing
    // Each page is gridConfig.pageHeight + spacing between pages
    const pageSpacing = 32; // 8 * 4 (mb-8 in Tailwind = 2rem = 32px)
    const totalPageHeight = gridConfig.pageHeight + pageSpacing;

    // Calculate which pages are visible in the viewport
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    // Find the first and last visible page
    const firstVisiblePage = Math.max(
      1,
      Math.floor(viewportTop / totalPageHeight) + 1
    );
    const lastVisiblePage = Math.ceil(viewportBottom / totalPageHeight);

    // Add buffer pages for smooth scrolling
    const minPage = Math.max(1, firstVisiblePage - visiblePageBuffer);
    const maxPage = lastVisiblePage + visiblePageBuffer;

    // Generate array of visible page numbers
    const pages: number[] = [];
    for (let i = minPage; i <= maxPage; i++) {
      pages.push(i);
    }

    // Filter blocks to only those on visible pages
    const filtered = blocks.filter(
      (block) => block.page_number >= minPage && block.page_number <= maxPage
    );

    return {
      visibleBlocks: filtered,
      visiblePages: pages,
    };
  }, [blocks, scrollTop, containerHeight, gridConfig.pageHeight, visiblePageBuffer]);

  return { visibleBlocks, visiblePages };
}
