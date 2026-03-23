import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useBlockStore } from './blockStore';
import { AddressBlock } from '@/types/block';

describe('Feature: address-book-pdf-builder - BlockStore Property Tests', () => {
  beforeEach(() => {
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
    });
  });

  const addressBlockArbitrary = fc.record({
    id: fc.uuid(),
    names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
    address: fc.string({ maxLength: 500 }),
    mobile: fc.string({ maxLength: 20 }),
    x: fc.integer({ min: 0, max: 2 }),
    y: fc.integer({ min: 0, max: 2 }),
    width: fc.integer({ min: 1, max: 3 }),
    height: fc.integer({ min: 1, max: 3 }),
    page_number: fc.integer({ min: 1, max: 10 }),
    created_at: fc.constant(new Date().toISOString()),
    updated_at: fc.constant(new Date().toISOString()),
    user_id: fc.uuid(),
  }) as fc.Arbitrary<AddressBlock>;

  /**
   * Property: addBlock always increases block count by 1
   */
  it('Property: addBlock increases block count by 1', () => {
    fc.assert(
      fc.property(
        fc.array(addressBlockArbitrary, { minLength: 0, maxLength: 5 }),
        addressBlockArbitrary,
        (existing, newBlock) => {
          useBlockStore.setState({ blocks: existing });
          useBlockStore.getState().addBlock(newBlock);
          expect(useBlockStore.getState().blocks.length).toBe(existing.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: deleteBlock always decreases block count by 1 when block exists
   */
  it('Property: deleteBlock decreases block count by 1', () => {
    fc.assert(
      fc.property(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        (blocks, idx) => {
          const target = blocks[idx % blocks.length];
          useBlockStore.setState({ blocks });
          useBlockStore.getState().deleteBlock(target.id);
          expect(useBlockStore.getState().blocks.length).toBe(blocks.length - 1);
          expect(useBlockStore.getState().blocks.find(b => b.id === target.id)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: updateBlock preserves block count
   */
  it('Property: updateBlock preserves block count', () => {
    fc.assert(
      fc.property(
        fc.array(addressBlockArbitrary, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 4 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (blocks, idx, newAddress) => {
          const target = blocks[idx % blocks.length];
          useBlockStore.setState({ blocks });
          useBlockStore.getState().updateBlock(target.id, { address: newAddress });
          expect(useBlockStore.getState().blocks.length).toBe(blocks.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
