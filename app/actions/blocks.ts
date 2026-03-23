'use server';

import { createClient } from '@/lib/supabase/server';
import { createBlockSchema, updateBlockSchema, CreateBlockInput, UpdateBlockInput } from '@/schemas/block';
import { revalidatePath } from 'next/cache';
import { AddressBlock } from '@/types/block';

/**
 * Fetch all blocks for the authenticated user
 * Ordered by page_number, y, x for consistent layout rendering
 * Requirements: 1.3, 18.2
 */
export async function getBlocks(): Promise<AddressBlock[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data, error } = await supabase
    .from('address_blocks')
    .select('*')
    .eq('user_id', user.id)
    .order('page_number', { ascending: true })
    .order('y', { ascending: true })
    .order('x', { ascending: true });
  
  if (error) throw error;
  return data as AddressBlock[];
}

/**
 * Create a new block for the authenticated user
 * Validates input with Zod schema and persists to database
 * Requirements: 7.1, 7.2, 7.5
 */
export async function createBlock(input: CreateBlockInput): Promise<AddressBlock> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const validated = createBlockSchema.parse(input);
  
  const { data, error } = await supabase
    .from('address_blocks')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  
  revalidatePath('/editor');
  return data as AddressBlock;
}

/**
 * Update an existing block for the authenticated user
 * Filters by user_id to ensure data isolation
 * Requirements: 2.6, 11.1
 */
export async function updateBlock(id: string, input: UpdateBlockInput): Promise<AddressBlock> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const validated = updateBlockSchema.parse(input);
  
  const { data, error } = await supabase
    .from('address_blocks')
    .update(validated)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  
  revalidatePath('/editor');
  return data as AddressBlock;
}

/**
 * Delete a block for the authenticated user
 * Filters by user_id to ensure data isolation
 * Requirements: 3.6
 */
export async function deleteBlock(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { error } = await supabase
    .from('address_blocks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) throw error;
  
  revalidatePath('/editor');
}

/**
 * Duplicate an existing block with offset position
 * Creates a copy with x+1, y+1 offset
 * Requirements: 7.3, 7.4
 */
export async function duplicateBlock(id: string): Promise<AddressBlock> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Fetch original block
  const { data: original, error: fetchError } = await supabase
    .from('address_blocks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Create duplicate with offset position
  const { data, error } = await supabase
    .from('address_blocks')
    .insert({
      names: original.names,
      address: original.address,
      mobile: original.mobile,
      x: original.x + 1,
      y: original.y + 1,
      width: original.width,
      height: original.height,
      page_number: original.page_number,
      user_id: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  revalidatePath('/editor');
  return data as AddressBlock;
}
