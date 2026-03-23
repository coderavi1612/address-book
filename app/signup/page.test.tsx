import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from './page';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/client');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('SignupPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });
  });

  it('should render signup form', () => {
    render(<SignupPage />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your account/i })).toBeInTheDocument();
  });

  it('should handle successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/editor');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should display error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should display error when password is too short', async () => {
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('should display error message on failed signup', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Email already registered' },
    });
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('should show loading state during signup', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create your account/i }));

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('should have link to login page', () => {
    render(<SignupPage />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
