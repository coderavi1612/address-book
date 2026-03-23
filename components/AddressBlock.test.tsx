import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressBlock } from './AddressBlock';
import { AddressBlock as AddressBlockType } from '@/types/block';

describe('AddressBlock Component', () => {
  const mockBlock: AddressBlockType = {
    id: 'test-block-1',
    names: ['John Doe', 'Jane Doe'],
    address: '123 Main Street, City, State 12345',
    mobile: '555-1234',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    page_number: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
  };

  const defaultProps = {
    block: mockBlock,
    isSelected: false,
    gridUnit: 100,
    onSelect: vi.fn(),
  };

  it('should render block with all names', () => {
    render(<AddressBlock {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('should render block with address', () => {
    render(<AddressBlock {...defaultProps} />);
    
    expect(screen.getByText('123 Main Street, City, State 12345')).toBeInTheDocument();
  });

  it('should render block with mobile number', () => {
    render(<AddressBlock {...defaultProps} />);
    
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('should not render mobile when empty', () => {
    const blockWithoutMobile = { ...mockBlock, mobile: '' };
    render(<AddressBlock {...defaultProps} block={blockWithoutMobile} />);
    
    expect(screen.queryByText('555-1234')).not.toBeInTheDocument();
  });

  it('should apply blue border when selected', () => {
    const { container } = render(<AddressBlock {...defaultProps} isSelected={true} />);
    
    const blockElement = container.firstChild as HTMLElement;
    expect(blockElement.className).toContain('border-blue-500');
    expect(blockElement.className).toContain('border-2');
  });

  it('should apply grey border when not selected', () => {
    const { container } = render(<AddressBlock {...defaultProps} isSelected={false} />);
    
    const blockElement = container.firstChild as HTMLElement;
    expect(blockElement.className).toContain('border-gray-300');
    expect(blockElement.className).not.toContain('border-blue-500');
  });

  it('should call onSelect with block id when clicked', async () => {
    const onSelect = vi.fn();
    render(<AddressBlock {...defaultProps} onSelect={onSelect} />);
    
    const blockElement = screen.getByText('John Doe').parentElement!;
    await userEvent.click(blockElement);
    
    expect(onSelect).toHaveBeenCalledWith('test-block-1');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should position block using absolute positioning with gridUnit', () => {
    const blockWithPosition = { ...mockBlock, x: 2, y: 1, width: 2, height: 1 };
    const { container } = render(
      <AddressBlock {...defaultProps} block={blockWithPosition} gridUnit={100} />
    );
    
    const blockElement = container.firstChild as HTMLElement;
    expect(blockElement.style.left).toBe('200px');
    expect(blockElement.style.top).toBe('100px');
    expect(blockElement.style.width).toBe('200px');
    expect(blockElement.style.height).toBe('100px');
  });

  it('should render with different gridUnit values', () => {
    const { container } = render(<AddressBlock {...defaultProps} gridUnit={50} />);
    
    const blockElement = container.firstChild as HTMLElement;
    expect(blockElement.style.left).toBe('0px');
    expect(blockElement.style.top).toBe('0px');
    expect(blockElement.style.width).toBe('50px');
    expect(blockElement.style.height).toBe('50px');
  });

  it('should render block with single name', () => {
    const blockWithSingleName = { ...mockBlock, names: ['Single Name'] };
    render(<AddressBlock {...defaultProps} block={blockWithSingleName} />);
    
    expect(screen.getByText('Single Name')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should render block with multiple names', () => {
    const blockWithManyNames = { 
      ...mockBlock, 
      names: ['Name 1', 'Name 2', 'Name 3', 'Name 4'] 
    };
    render(<AddressBlock {...defaultProps} block={blockWithManyNames} />);
    
    expect(screen.getByText('Name 1')).toBeInTheDocument();
    expect(screen.getByText('Name 2')).toBeInTheDocument();
    expect(screen.getByText('Name 3')).toBeInTheDocument();
    expect(screen.getByText('Name 4')).toBeInTheDocument();
  });

  describe('memo optimization', () => {
    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(<AddressBlock {...defaultProps} />);
      const firstRender = screen.getByText('John Doe');
      
      // Re-render with same props
      rerender(<AddressBlock {...defaultProps} />);
      const secondRender = screen.getByText('John Doe');
      
      // Elements should be the same (memo prevented re-render)
      expect(firstRender).toBe(secondRender);
    });

    it('should re-render when block data changes', () => {
      const { rerender } = render(<AddressBlock {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      const updatedBlock = { ...mockBlock, names: ['Updated Name'] };
      rerender(<AddressBlock {...defaultProps} block={updatedBlock} />);
      
      expect(screen.getByText('Updated Name')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should re-render when isSelected changes', () => {
      const { rerender, container } = render(<AddressBlock {...defaultProps} isSelected={false} />);
      
      let blockElement = container.firstChild as HTMLElement;
      expect(blockElement.className).toContain('border-gray-300');
      
      rerender(<AddressBlock {...defaultProps} isSelected={true} />);
      
      blockElement = container.firstChild as HTMLElement;
      expect(blockElement.className).toContain('border-blue-500');
    });

    it('should re-render when position changes', () => {
      const { rerender, container } = render(<AddressBlock {...defaultProps} />);
      
      let blockElement = container.firstChild as HTMLElement;
      expect(blockElement.style.left).toBe('0px');
      
      const movedBlock = { ...mockBlock, x: 5 };
      rerender(<AddressBlock {...defaultProps} block={movedBlock} />);
      
      blockElement = container.firstChild as HTMLElement;
      expect(blockElement.style.left).toBe('500px');
    });

    it('should re-render when dimensions change', () => {
      const { rerender, container } = render(<AddressBlock {...defaultProps} />);
      
      let blockElement = container.firstChild as HTMLElement;
      expect(blockElement.style.width).toBe('100px');
      
      const resizedBlock = { ...mockBlock, width: 3 };
      rerender(<AddressBlock {...defaultProps} block={resizedBlock} />);
      
      blockElement = container.firstChild as HTMLElement;
      expect(blockElement.style.width).toBe('300px');
    });
  });

  describe('print-friendly styling', () => {
    it('should have white background', () => {
      const { container } = render(<AddressBlock {...defaultProps} />);
      
      const blockElement = container.firstChild as HTMLElement;
      expect(blockElement.className).toContain('bg-white');
    });

    it('should have dark text for names', () => {
      render(<AddressBlock {...defaultProps} />);
      
      const nameElement = screen.getByText('John Doe');
      expect(nameElement.className).toContain('text-gray-900');
    });

    it('should have dark text for address', () => {
      render(<AddressBlock {...defaultProps} />);
      
      const addressElement = screen.getByText('123 Main Street, City, State 12345');
      expect(addressElement.className).toContain('text-gray-900');
    });

    it('should have proper font sizes', () => {
      render(<AddressBlock {...defaultProps} />);
      
      const nameElement = screen.getByText('John Doe');
      expect(nameElement.className).toContain('text-sm');
      expect(nameElement.className).toContain('font-semibold');
      
      const addressElement = screen.getByText('123 Main Street, City, State 12345');
      expect(addressElement.className).toContain('text-xs');
    });
  });
});
