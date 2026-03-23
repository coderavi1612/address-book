import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getBlocks } from '@/app/actions/blocks';
import { EditorLayout } from '@/components/EditorLayout';

/**
 * Editor page - React Server Component
 * Fetches blocks from database and passes to client component
 * Requirements: 10.5
 */
export default async function EditorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch blocks for the authenticated user
  const blocks = await getBlocks();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <EditorLayout initialBlocks={blocks} />
    </div>
  );
}
