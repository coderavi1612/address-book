import { describe, it, expect, beforeEach } from 'vitest';
import { useBlockStore } from './blockStore';
import { AddressBlock } from '@/types/block';

describe('BlockStore', () => {
  beforeEach(() => {
    useBlockStore.setState({
      blocks: [],
      selectedBlockId: null,
      currentPage: 1,
      zoomLevel: 1,
    });
  });

  const createMockBlock = (overrides?: Partial<AddressBlock>): AddressBlock => ({
    id: 'test-id-1',
    names: ['John Doe'],
    address: '123 Main St',
    mobile: '555-1234',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user-1',
    ...overrides,
  });

  describe('addBlock', () => {
    it('should add a block to the store', () => {
      const block = createMockBlock();
      useBlockStore.getState().addBlock(block);
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(1);
      expect(state.blocks[0]).toEqual(block);
    });

    it('should add multiple blocks', () => {
      const block1 = createMockBlock({ id: 'block-1' });
      const block2 = createMockBlock({ id: 'block-2' });
      
      useBlockStore.getState().addBlock(block1);
      useBlockStore.getState().addBlock(block2);
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(2);
      expect(state.blocks[0].id).toBe('block-1');
      expect(state.blocks[1].id).toBe('block-2');
    });
  });

  describe('updateBlock', () => {
    it('should update a block by id', () => {
      const block = createMockBlock({ id: 'block-1', names: ['John Doe'] });
      useBlockStore.setState({ blocks: [block] });
      
      useBlockStore.getState().updateBlock('block-1', { names: ['Jane Smith'] });
      
      const state = useBlockStore.getState();
      expect(state.blocks[0].names).toEqual(['Jane Smith']);
    });

    it('should update multiple properties', () => {
      const block = createMockBlock({ id: 'block-1', x: 0, y: 0 });
      useBlockStore.setState({ blocks: [block] });
      
      useBlockStore.getState().updateBlock('block-1', { x: 2, y: 3, width: 2 });
      
      const state = useBlockStore.getState();
      expect(state.blocks[0].x).toBe(2);
      expect(state.blocks[0].y).toBe(3);
      expect(state.blocks[0].width).toBe(2);
    });

    it('should not update other blocks', () => {
      const block1 = createMockBlock({ id: 'block-1', names: ['John'] });
      const block2 = createMockBlock({ id: 'block-2', names: ['Jane'] });
      useBlockStore.setState({ blocks: [block1, block2] });
      
      useBlockStore.getState().updateBlock('block-1', { names: ['Updated'] });
      
      const state = useBlockStore.getState();
      expect(state.blocks[0].names).toEqual(['Updated']);
      expect(state.blocks[1].names).toEqual(['Jane']);
    });
  });

  describe('deleteBlock', () => {
    it('should delete a block by id', () => {
      const block = createMockBlock({ id: 'block-1' });
      useBlockStore.setState({ blocks: [block] });
      
      useBlockStore.getState().deleteBlock('block-1');
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(0);
    });

    it('should delete only the specified block', () => {
      const block1 = createMockBlock({ id: 'block-1' });
      const block2 = createMockBlock({ id: 'block-2' });
      useBlockStore.setState({ blocks: [block1, block2] });
      
      useBlockStore.getState().deleteBlock('block-1');
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(1);
      expect(state.blocks[0].id).toBe('block-2');
    });

    it('should clear selectedBlockId if deleted block was selected', () => {
      const block = createMockBlock({ id: 'block-1' });
      useBlockStore.setState({ blocks: [block], selectedBlockId: 'block-1' });
      
      useBlockStore.getState().deleteBlock('block-1');
      
      const state = useBlockStore.getState();
      expect(state.selectedBlockId).toBeNull();
    });

    it('should not clear selectedBlockId if different block was deleted', () => {
      const block1 = createMockBlock({ id: 'block-1' });
      const block2 = createMockBlock({ id: 'block-2' });
      useBlockStore.setState({ blocks: [block1, block2], selectedBlockId: 'block-2' });
      
      useBlockStore.getState().deleteBlock('block-1');
      
      const state = useBlockStore.getState();
      expect(state.selectedBlockId).toBe('block-2');
    });
  });

  describe('selectBlock', () => {
    it('should set selectedBlockId', () => {
      useBlockStore.getState().selectBlock('block-1');
      
      const state = useBlockStore.getState();
      expect(state.selectedBlockId).toBe('block-1');
    });

    it('should clear selection when passed null', () => {
      useBlockStore.setState({ selectedBlockId: 'block-1' });
      
      useBlockStore.getState().selectBlock(null);
      
      const state = useBlockStore.getState();
      expect(state.selectedBlockId).toBeNull();
    });

    it('should update selection to different block', () => {
      useBlockStore.setState({ selectedBlockId: 'block-1' });
      
      useBlockStore.getState().selectBlock('block-2');
      
      const state = useBlockStore.getState();
      expect(state.selectedBlockId).toBe('block-2');
    });
  });

  describe('setCurrentPage', () => {
    it('should update current page', () => {
      useBlockStore.getState().setCurrentPage(3);
      
      const state = useBlockStore.getState();
      expect(state.currentPage).toBe(3);
    });
  });

  describe('setZoomLevel', () => {
    it('should update zoom level', () => {
      useBlockStore.getState().setZoomLevel(1.5);
      
      const state = useBlockStore.getState();
      expect(state.zoomLevel).toBe(1.5);
    });
  });

  describe('setBlocks', () => {
    it('should replace all blocks', () => {
      const block1 = createMockBlock({ id: 'block-1' });
      const block2 = createMockBlock({ id: 'block-2' });
      
      useBlockStore.getState().setBlocks([block1, block2]);
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(2);
      expect(state.blocks[0].id).toBe('block-1');
      expect(state.blocks[1].id).toBe('block-2');
    });

    it('should clear blocks when passed empty array', () => {
      const block = createMockBlock();
      useBlockStore.setState({ blocks: [block] });
      
      useBlockStore.getState().setBlocks([]);
      
      const state = useBlockStore.getState();
      expect(state.blocks).toHaveLength(0);
    });
  });
});
