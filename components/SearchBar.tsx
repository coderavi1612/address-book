'use client';

import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/useSearch';

interface SearchBarProps {
  searchHook: ReturnType<typeof useSearch>;
}

export function SearchBar({ searchHook }: SearchBarProps) {
  const { query, setQuery, isOpen, close, matches, activeIndex, next, prev, handleKeyDown, inputRef } = searchHook;

  if (!isOpen) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-lg"
      role="search"
      aria-label="Search contacts"
    >
      <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search contacts..."
        className="w-48 text-sm outline-none bg-transparent placeholder:text-gray-400"
        aria-label="Search query"
        aria-live="polite"
      />
      {query && (
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {matches.length === 0 ? 'No results' : `${activeIndex + 1} / ${matches.length}`}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={prev}
          disabled={matches.length === 0}
          aria-label="Previous match"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={next}
          disabled={matches.length === 0}
          aria-label="Next match"
          title="Next (Enter)"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={close}
          aria-label="Close search"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
