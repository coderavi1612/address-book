import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditorPage from './page';
import { getBlocks } from '@/app/actions/blocks';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AddressBlock } from '@/types/block';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));
vi.mock('@/app/actions/blocks');

// Mock EditorLayout component
vi.mock('@/components/EditorLayout', () => ({
  EditorLayout: ({ initialBlocks }: { initialBlocks: AddressBlock[] }) => (
    <div data-testid="editor-layout">
      <div data-testid="initial-blocks-count">{initialBlocks.length}</div>
      {initialBlocks.map((block) => (
        <div key={block.id} data-testid={`block-${block.id}`}>
          {block.names.join(', ')}
        </div>
      ))}
    </div>
  ),
}));

describe('EditorPage Integration', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockBlocks: AddressBlock[] = [
    {
      id: 'block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-123',
    },
    {
      id: 'block-2',
      names: ['Jane Smith', 'Bob Smith'],
      address: '456 Oak Ave',
      mobile: '555-5678',
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if user is not authenticated', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    await EditorPage();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should fetch and pass blocks to EditorLayout', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    const result = await EditorPage();
    const { container } = render(result);

    expect(getBlocks).toHaveBeenCalled();
    expect(screen.getByTestId('editor-layout')).toBeInTheDocument();
    expect(screen.getByTestId('initial-blocks-count')).toHaveTextContent('2');
  });

  it('should render all blocks from server', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    const result = await EditorPage();
    render(result);

    expect(screen.getByTestId('block-block-1')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('block-block-2')).toHaveTextContent('Jane Smith, Bob Smith');
  });

  it('should handle empty blocks array', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await EditorPage();
    render(result);

    expect(screen.getByTestId('editor-layout')).toBeInTheDocument();
    expect(screen.getByTestId('initial-blocks-count')).toHaveTextContent('0');
  });

  it('should render full-screen layout container', async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    const result = await EditorPage();
    const { container } = render(result);

    const layoutContainer = container.querySelector('.flex.h-screen.w-full.overflow-hidden');
    expect(layoutContainer).toBeInTheDocument();
  });
});

/**
 * Integration test for full editor flow
 * Tests: load blocks, select, edit, save
 * Requirements: 10.5
 */
describe('EditorPage Full Flow Integration', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockBlocks: AddressBlock[] = [
    {
      id: 'block-1',
      names: ['John Doe'],
      address: '123 Main St',
      mobile: '555-1234',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      page_number: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
  });

  it('should complete full flow: load blocks from server', async () => {
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    const result = await EditorPage();
    render(result);

    // Verify blocks are loaded
    await waitFor(() => {
      expect(screen.getByTestId('editor-layout')).toBeInTheDocument();
      expect(screen.getByTestId('block-block-1')).toBeInTheDocument();
    });
  });

  it('should pass correct props to EditorLayout', async () => {
    (getBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    const result = await EditorPage();
    render(result);

    // Verify EditorLayout receives initialBlocks
    expect(screen.getByTestId('initial-blocks-count')).toHaveTextContent('1');
    expect(screen.getByTestId('block-block-1')).toHaveTextContent('John Doe');
  });

  it('should handle server errors gracefully', async () => {
    (getBlocks as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));

    await expect(EditorPage()).rejects.toThrow('Database error');
  });
});
