import { useEffect, useRef, useState, useCallback } from 'react';
import { updateBlock } from '@/app/actions/blocks';
import { AddressBlock } from '@/types/block';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Google Docs-style autosave:
 * - Does NOT save on every keystroke
 * - Waits until user stops typing for `delay` ms (default 2s)
 * - Shows "Saving..." only when actually writing to DB
 * - Shows "Saved" briefly after success, then goes idle
 */
export function useAutosave(block: AddressBlock | null, delay: number = 2000) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const savedTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Track what was last persisted to DB
  const persistedRef = useRef<{ names: string[]; address: string; mobile: string } | null>(null);
  // Track the block id to reset persisted ref on block switch
  const blockIdRef = useRef<string | null>(null);

  // Call this whenever form content changes — schedules a save after idle period
  const scheduleAutosave = useCallback((current: AddressBlock) => {
    const content = { names: current.names, address: current.address, mobile: current.mobile };

    // Nothing changed from last persisted state — skip
    if (persistedRef.current && JSON.stringify(persistedRef.current) === JSON.stringify(content)) {
      return;
    }

    // Clear any pending save
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    // Schedule save after user stops typing
    timerRef.current = setTimeout(async () => {
      const filteredNames = content.names.filter(n => n.trim() !== '');
      if (filteredNames.length === 0) return;

      setStatus('saving');
      try {
        await updateBlock(current.id, {
          names: filteredNames,
          address: content.address,
          mobile: content.mobile,
        });
        persistedRef.current = content;
        setStatus('saved');
        savedTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
        savedTimerRef.current = setTimeout(() => setStatus('idle'), 3000);
      }
    }, delay);
  }, [delay]);

  useEffect(() => {
    if (!block) return;

    // Reset persisted ref when switching to a different block
    if (blockIdRef.current !== block.id) {
      blockIdRef.current = block.id;
      persistedRef.current = { names: block.names, address: block.address, mobile: block.mobile };
      setStatus('idle');
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      return;
    }

    scheduleAutosave(block);
  }, [block, scheduleAutosave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { status };
}
