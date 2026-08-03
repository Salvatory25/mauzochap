import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/use-auth';

// Create a component that consumes the hook to assert state
function TestComponent() {
  const { user, roles, loading, isAdmin, isManager, isSuperAdmin } = useAuth();
  
  if (loading) return <div data-testid="loading">Loading Auth...</div>;
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="roles">{roles.join(',')}</div>
      <div data-testid="is-admin">{isAdmin ? 'Yes' : 'No'}</div>
      <div data-testid="is-manager">{isManager ? 'Yes' : 'No'}</div>
      <div data-testid="is-super-admin">{isSuperAdmin ? 'Yes' : 'No'}</div>
    </div>
  );
}

// Mock Supabase client
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getSession: () => mockGetSession(),
        onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
      },
      from: (table: string) => mockFrom(table),
    },
  };
});

describe('AuthProvider & useAuth Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementation for auth subscription
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it('renders loading state initially', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {})); // Never resolves to keep loading state
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Auth...');
  });

  it('handles null session (guest user)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('No');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('No');
    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('No');
  });

  it('successfully loads logged-in user profile, roles, and business properties', async () => {
    const mockUser = { id: 'user-123', email: 'test@mauzochap.com' };
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    // Mock supabase.from queries chain
    // user_roles query
    const rolesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ role: 'admin' }] }),
    };

    // profiles query
    const profilesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { branch_id: 'branch-1', business_id: 'business-1' },
      }),
    };

    // businesses query
    const businessesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'business-1', name: 'Test Business' },
      }),
    };

    // branches query
    const branchesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'branch-1', name: 'Branch Main' }],
      }),
    };

    mockFrom.mockImplementation((table) => {
      if (table === 'user_roles') return rolesChain;
      if (table === 'profiles') return profilesChain;
      if (table === 'businesses') return businessesChain;
      if (table === 'branches') return branchesChain;
      return {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@mauzochap.com');
    expect(screen.getByTestId('roles')).toHaveTextContent('admin');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('No');
  });
});
