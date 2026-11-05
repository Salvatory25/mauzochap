import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/use-auth';

function TestComponent() {
  const { user, roles, branchId, business, loading, isAdmin, isManager, isSuperAdmin } = useAuth();

  if (loading) return <div data-testid="loading">Loading Auth...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <div data-testid="roles">{roles.join(',')}</div>
      <div data-testid="branch-id">{branchId ?? 'None'}</div>
      <div data-testid="business-name">{business ? (business as any).business_name || (business as any).name : 'No Business'}</div>
      <div data-testid="is-admin">{isAdmin ? 'Yes' : 'No'}</div>
      <div data-testid="is-manager">{isManager ? 'Yes' : 'No'}</div>
      <div data-testid="is-super-admin">{isSuperAdmin ? 'Yes' : 'No'}</div>
    </div>
  );
}

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

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it('throws a clear error when useAuth is invoked outside AuthProvider', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    errSpy.mockRestore();
  });

  it('renders loading state initially', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading Auth...');
  });

  it('handles null session (guest user)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
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
    const mockUser = { id: 'user-123', email: 'test@mauzochap.com', user_metadata: {} };
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    mockFrom.mockImplementation((table) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ role: 'admin' }] }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { branch_id: 'branch-1', business_id: 'business-1' },
          }),
        };
      }
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'business-1', business_name: 'Test Business' },
          }),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'branch-1', name: 'Branch Main' }],
          }),
        };
      }
      return {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@mauzochap.com');
    expect(screen.getByTestId('roles')).toHaveTextContent('admin');
    expect(screen.getByTestId('branch-id')).toHaveTextContent('branch-1');
    expect(screen.getByTestId('business-name')).toHaveTextContent('Test Business');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('No');
  });

  it('grants full platform privileges to super_admin role', async () => {
    const mockUser = { id: 'sa-1', email: 'super@mauzochap.co.tz', user_metadata: {} };
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });

    mockFrom.mockImplementation((table) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ role: 'super_admin' }] }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { branch_id: null, business_id: null } }),
        };
      }
      return {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('is-super-admin')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('Yes');
  });

  it('auto-heals invited staff profile and role from user_metadata when database rows are missing', async () => {
    const profileUpdateEq = vi.fn().mockResolvedValue({});
    const roleUpsert = vi.fn().mockResolvedValue({});

    const invitedStaffUser = {
      id: 'staff-99',
      email: 'cashier@duka.co.tz',
      user_metadata: {
        business_id: 'biz-77',
        branch_id: 'branch-77',
        role: 'manager',
      },
    };
    mockGetSession.mockResolvedValue({ data: { session: { user: invitedStaffUser } } });

    mockFrom.mockImplementation((table) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [] }),
          upsert: roleUpsert,
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { branch_id: null, business_id: null } }),
          update: vi.fn().mockReturnValue({ eq: profileUpdateEq }),
        };
      }
      if (table === 'businesses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'biz-77', business_name: 'Kariakoo Mart' },
          }),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ id: 'branch-77', name: 'Counter 1' }] }),
        };
      }
      return {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('roles')).toHaveTextContent('manager');
    expect(screen.getByTestId('branch-id')).toHaveTextContent('branch-77');
    expect(screen.getByTestId('business-name')).toHaveTextContent('Kariakoo Mart');
    expect(screen.getByTestId('is-manager')).toHaveTextContent('Yes');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('No');
    expect(profileUpdateEq).toHaveBeenCalledWith('id', 'staff-99');
    expect(roleUpsert).toHaveBeenCalledWith({ user_id: 'staff-99', role: 'manager' });
  });
});
