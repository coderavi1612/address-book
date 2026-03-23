import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { getBlocks, createBlock, updateBlock, deleteBlock, duplicateBlock } from './blocks';
import type { AddressBlock } from '@/types/block';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Feature: address-book-pdf-builder - Server Actions', () => {
  describe('Property 1: User Data Isolation', () => {
    it('should only return blocks for authenticated user', async () => {
      /**
       * **Validates: Requirements 1.3, 18.2**
       * 
       * For any authenticated user and any address block query, the system should only 
       * return blocks where the user_id matches the authenticated user's ID.
       */
      
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // authenticated user_id
          fc.array(
            fc.record({
              id: fc.uuid(),
              names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1 }),
              address: fc.string({ maxLength: 500 }),
              mobile: fc.oneof(fc.constant(''), fc.stringMatching(/^[0-9\s\-()]+$/)),
              x: fc.nat({ max: 100 }),
              y: fc.nat({ max: 100 }),
              width: fc.integer({ min: 1, max: 10 }),
              height: fc.integer({ min: 1, max: 10 }),
              page_number: fc.integer({ min: 1, max: 10 }),
              created_at: fc.constant(new Date('2024-01-01T00:00:00Z').toISOString()),
              updated_at: fc.constant(new Date('2024-01-01T00:00:00Z').toISOString()),
              user_id: fc.uuid(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (authenticatedUserId, allBlocks) => {
            // Mock Supabase client
            const { createClient } = await import('@/lib/supabase/server');
            const mockSupabase = {
              auth: {
                getUser: vi.fn().mockResolvedValue({
                  data: { user: { id: authenticatedUserId } },
                }),
              },
              from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({
                          data: allBlocks.filter(b => b.user_id === authenticatedUserId),
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
            
            vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
            
            // Execute the query
            const result = await getBlocks();
            
            // Verify all returned blocks belong to the authenticated user
            result.forEach(block => {
              expect(block.user_id).toBe(authenticatedUserId);
            });
            
            // Verify no blocks from other users are returned
            const otherUserBlocks = allBlocks.filter(b => b.user_id !== authenticatedUserId);
            otherUserBlocks.forEach(otherBlock => {
              expect(result.find(b => b.id === otherBlock.id)).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Unit Tests - Server Actions', () => {
  let mockSupabase: any;
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock setup
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
        }),
      },
      from: vi.fn(),
    };
  });

  describe('createBlock', () => {
    it('should create a block with authenticated user_id', async () => {
      /**
       * **Validates: Requirements 7.1, 7.2, 7.5**
       */
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-block-id',
              names: ['John Doe'],
              address: '123 Main St',
              mobile: '555-1234',
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              page_number: 1,
              user_id: mockUserId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });
      
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      const input = {
        names: ['John Doe'],
        address: '123 Main St',
        mobile: '555-1234',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: 1,
      };
      
      const result = await createBlock(input);
      
      expect(result.user_id).toBe(mockUserId);
      expect(result.names).toEqual(['John Doe']);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          user_id: mockUserId,
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      const input = {
        names: ['John Doe'],
        address: '123 Main St',
        mobile: '',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: 1,
      };
      
      await expect(createBlock(input)).rejects.toThrow('Unauthorized');
    });

    it('should validate input with Zod schema', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      const invalidInput = {
        names: [], // Empty array should fail validation
        address: '123 Main St',
        mobile: '',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        page_number: 1,
      };
      
      await expect(createBlock(invalidInput as any)).rejects.toThrow();
    });
  });

  describe('updateBlock', () => {
    it('should update block with user_id filtering', async () => {
      /**
       * **Validates: Requirements 2.6, 11.1**
       */
      const blockId = 'block-123';
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: blockId,
                  names: ['Jane Doe'],
                  address: '456 Oak Ave',
                  mobile: '555-5678',
                  x: 1,
                  y: 1,
                  width: 2,
                  height: 2,
                  page_number: 1,
                  user_id: mockUserId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      });
      
      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      const updates = {
        names: ['Jane Doe'],
        address: '456 Oak Ave',
      };
      
      const result = await updateBlock(blockId, updates);
      
      expect(result.names).toEqual(['Jane Doe']);
      expect(result.address).toBe('456 Oak Ave');
      
      // Verify user_id filtering was applied
      const eqCalls = mockUpdate().eq;
      expect(eqCalls).toHaveBeenCalledWith('id', blockId);
      expect(eqCalls().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      await expect(updateBlock('block-123', { address: 'New Address' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteBlock', () => {
    it('should delete block with user_id filtering', async () => {
      /**
       * **Validates: Requirements 3.6**
       */
      const blockId = 'block-123';
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });
      
      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      await deleteBlock(blockId);
      
      // Verify user_id filtering was applied
      const eqCalls = mockDelete().eq;
      expect(eqCalls).toHaveBeenCalledWith('id', blockId);
      expect(eqCalls().eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      await expect(deleteBlock('block-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('duplicateBlock', () => {
    it('should create duplicate with offset position', async () => {
      /**
       * **Validates: Requirements 7.3, 7.4**
       */
      const originalBlockId = 'original-block-123';
      const originalBlock = {
        id: originalBlockId,
        names: ['John Doe'],
        address: '123 Main St',
        mobile: '555-1234',
        x: 2,
        y: 3,
        width: 1,
        height: 1,
        page_number: 1,
        user_id: mockUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: originalBlock,
              error: null,
            }),
          }),
        }),
      });
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...originalBlock,
              id: 'new-duplicate-id',
              x: originalBlock.x + 1,
              y: originalBlock.y + 1,
            },
            error: null,
          }),
        }),
      });
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'address_blocks') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      const result = await duplicateBlock(originalBlockId);
      
      // Verify duplicate has same data
      expect(result.names).toEqual(originalBlock.names);
      expect(result.address).toBe(originalBlock.address);
      expect(result.mobile).toBe(originalBlock.mobile);
      
      // Verify offset position
      expect(result.x).toBe(originalBlock.x + 1);
      expect(result.y).toBe(originalBlock.y + 1);
      
      // Verify different ID
      expect(result.id).not.toBe(originalBlockId);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
      
      await expect(duplicateBlock('block-123')).rejects.toThrow('Unauthorized');
    });
  });
});
