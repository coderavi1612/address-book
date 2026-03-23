import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Mock Supabase
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect unauthenticated users from /editor to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest(new URL('http://localhost:3000/editor'));
    const response = await middleware(request);

    expect(response.status).toBe(307); // Redirect status
    expect(response.headers.get('location')).toContain('/login');
  });

  it('should allow authenticated users to access /editor', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
    });

    const request = new NextRequest(new URL('http://localhost:3000/editor'));
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('should redirect authenticated users from /login to /editor', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
    });

    const request = new NextRequest(new URL('http://localhost:3000/login'));
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/editor');
  });

  it('should redirect authenticated users from /signup to /editor', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
    });

    const request = new NextRequest(new URL('http://localhost:3000/signup'));
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/editor');
  });

  it('should allow unauthenticated users to access /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest(new URL('http://localhost:3000/login'));
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('should allow unauthenticated users to access /signup', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest(new URL('http://localhost:3000/signup'));
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
