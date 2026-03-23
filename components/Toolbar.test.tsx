import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/client');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('Toolbar - Logout Functionality', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { signOut: mockSignOut },
    });
  });

  it('should render logout button', () => {
    render(<Toolbar />);
    expect(screen.getByRole('button', { name: /logout from application/i })).toBeInTheDocument();
  });

  it('should call signOut and redirect to login on logout', async () => {
    mockSignOut.mockResolvedValue({});
    const user = userEvent.setup();

    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: /logout from application/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should render all toolbar buttons', () => {
    render(<Toolbar />);

    expect(screen.getByRole('button', { name: /add new address block/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export address book as pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout from application/i })).toBeInTheDocument();
  });

  it('should handle logout errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Logout failed'));
    const user = userEvent.setup();

    render(<Toolbar />);

    await user.click(screen.getByRole('button', { name: /logout from application/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
