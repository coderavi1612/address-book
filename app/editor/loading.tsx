import { Loader2 } from 'lucide-react';

/**
 * Loading component for editor page
 * Displays a centered spinner while data is being fetched
 * Requirements: 14.5
 */
export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">Loading your address book...</p>
      </div>
    </div>
  );
}
