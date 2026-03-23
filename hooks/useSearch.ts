import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useBlockStore } from '@/store/blockStore';
import { AddressBlock } from '@/types/block';

function blockMatchesQuery(block: AddressBlock, query: string): boolean {
  const q = query.toLowerCase();
  return (
    block.names.some(n => n.toLowerCase().includes(q)) ||
    block.address.toLowerCase().includes(q) ||
    block.mobile.toLowerCase().includes(q)
  );
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blocks = useBlockStore(s => s.blocks);
  const selectBlock = useBlockStore(s => s.selectBlock);
  const setCurrentPage = useBlockStore(s => s.setCurrentPage);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return blocks.filter(b => blockMatchesQuery(b, query));
  }, [blocks, query]);

  // Reset active index when matches change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active match into view and select it
  useEffect(() => {
    if (matches.length === 0) return;
    const active = matches[activeIndex];
    if (!active) return;
    selectBlock(active.id);
    setCurrentPage(active.page_number);
    // Scroll the block element into view
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${active.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, [activeIndex, matches, selectBlock, setCurrentPage]);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const next = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIndex(i => (i + 1) % matches.length);
  }, [matches.length]);

  const prev = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIndex(i => (i - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Enter') { e.shiftKey ? prev() : next(); return; }
    if (e.key === 'F3') { e.preventDefault(); e.shiftKey ? prev() : next(); }
  }, [close, next, prev]);

  // Global Ctrl/Cmd+F to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        isOpen ? inputRef.current?.focus() : open();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, open]);

  return {
    query, setQuery,
    isOpen, open, close,
    matches,
    activeIndex,
    activeMatchId: matches[activeIndex]?.id ?? null,
    next, prev,
    handleKeyDown,
    inputRef,
  };
}
