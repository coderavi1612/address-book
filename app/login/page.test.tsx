import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/client');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockSignInWithPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/editor');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should display error message on failed login', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    mockSignInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in to your account/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('should have link to signup page', () => {
    render(<LoginPage />);

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
