import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { setLang } from '@/lib/i18n';

const mockNavigate = vi.fn();
let mockPathname = '/dashboard';
let mockAuthState: any = {};

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, onClick, className }: any) => (
    <a href={typeof to === 'string' ? to : '#'} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock('@/lib/use-auth', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AppShell subscription guards & role navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLang('en');
    mockPathname = '/dashboard';
    mockAuthState = {
      user: { id: 'owner-1', email: 'owner@shop.co.tz', user_metadata: {} },
      roles: ['admin'],
      business: {
        id: 'biz-1',
        business_name: 'Kariakoo Super',
        email: 'owner@shop.co.tz',
        account_status: 'active',
        expiry_date: '2027-12-31T23:59:59Z',
      },
      branchId: 'branch-1',
      availableBranches: [{ id: 'branch-1', name: 'Main Store' }],
      isSuperAdmin: false,
      isAdmin: true,
      isManager: true,
      loading: false,
      switchBranch: vi.fn(),
    };
  });

  it('transitions cleanly from loading state to authenticated workspace without hook order errors', () => {
    mockAuthState.loading = true;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <div data-testid="page-body">Dashboard Content</div>
        </AppShell>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading workspace...')).toBeInTheDocument();

    mockAuthState = { ...mockAuthState, loading: false };
    rerender(
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <div data-testid="page-body">Dashboard Content</div>
        </AppShell>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('page-body')).toBeInTheDocument();
  });

  it('blocks primary business owner when subscription status is pending, suspended, rejected, or expired', () => {
    mockAuthState.business.account_status = 'pending';
    const { unmount: u1 } = renderWithQueryClient(
      <AppShell>
        <div>Secret</div>
      </AppShell>,
    );
    expect(screen.getByText('Subscription Setup & Verification')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    u1();

    mockAuthState.business.account_status = 'suspended';
    const { unmount: u2 } = renderWithQueryClient(
      <AppShell>
        <div>Secret</div>
      </AppShell>,
    );
    expect(screen.getByText('Account Suspended')).toBeInTheDocument();
    u2();

    mockAuthState.business.account_status = 'rejected';
    mockAuthState.business.rejection_reason = 'Invalid M-Pesa reference';
    const { unmount: u3 } = renderWithQueryClient(
      <AppShell>
        <div>Secret</div>
      </AppShell>,
    );
    expect(screen.getByText('Account Rejected')).toBeInTheDocument();
    expect(screen.getByText(/Invalid M-Pesa reference/)).toBeInTheDocument();
    u3();

    mockAuthState.business.account_status = 'active';
    mockAuthState.business.expiry_date = '2020-01-01T00:00:00Z';
    renderWithQueryClient(
      <AppShell>
        <div>Secret</div>
      </AppShell>,
    );
    expect(screen.getByText(/Subscription Expired/i)).toBeInTheDocument();
  });

  it('exempts added staff members (cashier/manager) from pending or expired subscription blockers', () => {
    mockAuthState = {
      ...mockAuthState,
      user: {
        id: 'cashier-1',
        email: 'cashier@shop.co.tz',
        user_metadata: { business_id: 'biz-1', role: 'cashier' },
      },
      roles: ['cashier'],
      isAdmin: false,
      isManager: false,
      business: {
        id: 'biz-1',
        business_name: 'Kariakoo Super',
        email: 'owner@shop.co.tz',
        account_status: 'pending',
        expiry_date: '2020-01-01T00:00:00Z',
      },
    };

    renderWithQueryClient(
      <AppShell>
        <div data-testid="pos-screen">POS Ready</div>
      </AppShell>,
    );

    expect(screen.getByTestId('pos-screen')).toBeInTheDocument();
    expect(screen.queryByText('Subscription Setup & Verification')).not.toBeInTheDocument();
  });

  it('shows proactive renewal banner when active subscription expires within 5 days', () => {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    mockAuthState.business.expiry_date = threeDaysFromNow;

    renderWithQueryClient(
      <AppShell>
        <div>Workspace</div>
      </AppShell>,
    );

    expect(screen.getByText(/Ilani ya Kifurushi:/i)).toBeInTheDocument();
    expect(screen.getByText('Lipia Kifurushi Sasa')).toBeInTheDocument();
  });

  it('restricts sidebar navigation items according to cashier, manager, admin, and super_admin roles', () => {
    // Cashier: should NOT see Expenses, Reports, Users, or Locations
    mockAuthState = {
      ...mockAuthState,
      user: { id: 'c1', email: 'c1@shop.co.tz', user_metadata: { role: 'cashier' } },
      roles: ['cashier'],
      isAdmin: false,
      isManager: false,
    };
    const { unmount: uCashier } = renderWithQueryClient(
      <AppShell>
        <div>Cashier View</div>
      </AppShell>,
    );
    expect(screen.queryByText('Expenses')).not.toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Locations')).not.toBeInTheDocument();
    uCashier();

    // Super Admin: sees Super Admin & SMS & Ujumbe
    mockAuthState = {
      ...mockAuthState,
      roles: ['super_admin'],
      isSuperAdmin: true,
      isAdmin: true,
      isManager: true,
    };
    renderWithQueryClient(
      <AppShell>
        <div>Admin View</div>
      </AppShell>,
    );
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('SMS & Ujumbe')).toBeInTheDocument();
  });
});

