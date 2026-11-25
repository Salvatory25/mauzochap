import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/use-auth";
import { AppShell } from "@/components/AppShell";
import { SuperAdminDashboard } from "@/routes/_authenticated/super-admin";
import { SettingsPage } from "@/routes/_authenticated/settings";
import { Receipt } from "@/components/Receipt";
import { SupportActivityLogsTab } from "@/components/super-admin/SupportActivityLogsTab";
import {
  isSupportMigrationMissingError,
  isSupportSessionActive,
  type SupportSession,
} from "@/lib/support-session";
import { getBusinessLogo, saveBusinessLogo } from "@/lib/business-logo";
import { setLang } from "@/lib/i18n";

const mockNavigate = vi.fn();
let mockPathname = "/dashboard";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  Link: ({ children, to, onClick, className }: any) => (
    <a href={typeof to === "string" ? to : "#"} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock("html2canvas", () => ({
  default: vi.fn(),
}));

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: any) => mockOnAuthStateChange(cb),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: (table: string) => mockFrom(table),
    rpc: (fn: string, args?: any) => mockRpc(fn, args),
  },
}));

function createQueryWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function AuthConsumerHarness() {
  const {
    user,
    roles,
    business,
    branchId,
    loading,
    isSuperAdmin,
    isSupportMode,
    supportSession,
    startSupportSession,
    endSupportSession,
    switchBranch,
  } = useAuth();

  const [errorMsg, setErrorMsg] = React.useState("");

  if (loading) return <div data-testid="auth-loading">Loading...</div>;

  return (
    <div>
      <div data-testid="auth-email">{user?.email || "none"}</div>
      <div data-testid="auth-roles">{roles.join(",")}</div>
      <div data-testid="auth-super">{isSuperAdmin ? "yes" : "no"}</div>
      <div data-testid="auth-support-mode">{isSupportMode ? "yes" : "no"}</div>
      <div data-testid="auth-biz-id">{business?.id || "none"}</div>
      <div data-testid="auth-biz-name">{business?.business_name || "none"}</div>
      <div data-testid="auth-branch-id">{branchId || "none"}</div>
      <div data-testid="auth-session-id">{supportSession?.session_id || "none"}</div>
      {errorMsg && <div data-testid="auth-error">{errorMsg}</div>}
      <button
        type="button"
        onClick={() => {
          startSupportSession("biz-customer-1", "Assisting POS inventory", 60).catch((e) =>
            setErrorMsg(e.message),
          );
        }}
      >
        Trigger Start Support
      </button>
      <button
        type="button"
        onClick={() => {
          void endSupportSession();
        }}
      >
        Trigger End Support
      </button>
      <button
        type="button"
        onClick={() => {
          void switchBranch("branch-customer-2");
        }}
      >
        Trigger Switch Branch
      </button>
    </div>
  );
}

describe("MauzoChap Secure Super Admin Support Access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setLang("en");
    mockPathname = "/dashboard";

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  describe("1. Authentication, Authorization & Session Expiration", () => {
    it("blocks non-Super-Admin users from accessing SuperAdminDashboard and initiating support sessions", async () => {
      const normalOwner = {
        id: "owner-1",
        email: "owner@duka.co.tz",
        user_metadata: {},
      };
      mockGetSession.mockResolvedValue({ data: { session: { user: normalOwner } } });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ role: "admin" }] }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { business_id: "biz-owner-1", branch_id: "br-1" },
            }),
          };
        }
        if (table === "businesses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "biz-owner-1", business_name: "Duka Langu" },
            }),
          };
        }
        if (table === "branches") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: "br-1", name: "Main" }] }),
          };
        }
        return {};
      });

      const Wrapper = createQueryWrapper();
      render(
        <Wrapper>
          <AuthProvider>
            <SuperAdminDashboard />
            <AuthConsumerHarness />
          </AuthProvider>
        </Wrapper>,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("auth-loading")).not.toBeInTheDocument();
      });

      expect(
        screen.getByText(/Unauthorized\. Super Admin access required\./i),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText("Trigger Start Support"));
      await waitFor(() => {
        expect(screen.getByTestId("auth-error")).toHaveTextContent(
          "Unauthorized: Super Admin privileges required.",
        );
      });
      expect(mockRpc).not.toHaveBeenCalledWith(
        "start_super_admin_support_session",
        expect.anything(),
      );
    });

    it("rejects expired or ended support sessions", () => {
      const expiredSession: SupportSession = {
        session_id: "sess-exp",
        super_admin_id: "sa-1",
        super_admin_email: "salvatoryfilbert2@gmail.com",
        target_business_id: "biz-1",
        target_business_name: "Kariakoo Shop",
        target_owner_id: "owner-1",
        active_branch_id: "br-1",
        reason: null,
        started_at: new Date(Date.now() - 7200_000).toISOString(),
        expires_at: new Date(Date.now() - 60_000).toISOString(),
        status: "active",
      };

      expect(isSupportSessionActive(expiredSession)).toBe(false);
      expect(
        isSupportSessionActive({
          ...expiredSession,
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
          status: "ended",
        }),
      ).toBe(false);
      expect(
        isSupportMigrationMissingError({
          code: "PGRST202",
          message: "Could not find the function public.start_super_admin_support_session",
        }),
      ).toBe(true);
    });

    it("preserves Super Admin identity while binding context strictly to target business and ending cleanly", async () => {
      const superAdminUser = {
        id: "sa-uid-001",
        email: "salvatoryfilbert2@gmail.com",
        user_metadata: {},
      };
      mockGetSession.mockResolvedValue({ data: { session: { user: superAdminUser } } });

      const activeSess: SupportSession = {
        session_id: "sess-live-1",
        super_admin_id: "sa-uid-001",
        super_admin_email: "salvatoryfilbert2@gmail.com",
        target_business_id: "biz-customer-1",
        target_business_name: "Mlimani Fresh Mart",
        target_owner_id: "owner-cust-1",
        active_branch_id: "branch-customer-1",
        reason: "Assisting POS inventory",
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
        status: "active",
      };

      let currentServerSession: SupportSession | null = null;
      const profileUpdateSpy = vi.fn();

      mockRpc.mockImplementation(async (fn: string, args?: any) => {
        if (fn === "get_current_super_admin_support_session") {
          return { data: currentServerSession, error: null };
        }
        if (fn === "start_super_admin_support_session") {
          expect(args._target_business_id).toBe("biz-customer-1");
          currentServerSession = activeSess;
          return { data: activeSess, error: null };
        }
        if (fn === "switch_support_session_branch") {
          currentServerSession = {
            ...activeSess,
            active_branch_id: args._branch_id,
          };
          return { data: { success: true, active_branch_id: args._branch_id }, error: null };
        }
        if (fn === "end_super_admin_support_session") {
          currentServerSession = null;
          return { data: { success: true, ended_count: 1 }, error: null };
        }
        return { data: null, error: null };
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ role: "super_admin" }] }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { business_id: "biz-hq", branch_id: "branch-hq", full_name: "Salvatory Filbert" },
            }),
            update: profileUpdateSpy,
          };
        }
        if (table === "businesses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, val: string) => ({
              single: vi.fn().mockResolvedValue({
                data:
                  val === "biz-customer-1"
                    ? {
                        id: "biz-customer-1",
                        business_name: "Mlimani Fresh Mart",
                        owner_name: "Neema Joseph",
                        email: "neema@mlimani.co.tz",
                        phone: "0712000111",
                        package: "kilimanjaro",
                        account_status: "approved",
                      }
                    : {
                        id: "biz-hq",
                        business_name: "MauzoChap HQ",
                        owner_name: "Salvatory Filbert",
                        email: "salvatoryfilbert2@gmail.com",
                      },
              }),
            })),
          };
        }
        if (table === "branches") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((_col: string, val: string) =>
              Promise.resolve({
                data:
                  val === "biz-customer-1"
                    ? [
                        { id: "branch-customer-1", name: "Mwenge Counter" },
                        { id: "branch-customer-2", name: "Posta Counter" },
                      ]
                    : [{ id: "branch-hq", name: "HQ" }],
              }),
            ),
          };
        }
        return {};
      });

      // Mock window.location.reload so branch switch does not reload jsdom
      const origLocation = window.location;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...origLocation, reload: vi.fn(), assign: vi.fn(), pathname: "/dashboard" },
      });

      render(
        <AuthProvider>
          <AuthConsumerHarness />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("auth-loading")).not.toBeInTheDocument();
      });

      // Initially bound to Super Admin's own HQ context
      expect(screen.getByTestId("auth-email")).toHaveTextContent("salvatoryfilbert2@gmail.com");
      expect(screen.getByTestId("auth-super")).toHaveTextContent("yes");
      expect(screen.getByTestId("auth-support-mode")).toHaveTextContent("no");
      expect(screen.getByTestId("auth-biz-name")).toHaveTextContent("MauzoChap HQ");

      // Start support session into customer business
      fireEvent.click(screen.getByText("Trigger Start Support"));

      await waitFor(() => {
        expect(screen.getByTestId("auth-support-mode")).toHaveTextContent("yes");
      });

      // Identity stays Super Admin, while business & branch bind strictly to Mlimani Fresh Mart
      expect(screen.getByTestId("auth-email")).toHaveTextContent("salvatoryfilbert2@gmail.com");
      expect(screen.getByTestId("auth-biz-id")).toHaveTextContent("biz-customer-1");
      expect(screen.getByTestId("auth-biz-name")).toHaveTextContent("Mlimani Fresh Mart");
      expect(screen.getByTestId("auth-branch-id")).toHaveTextContent("branch-customer-1");
      expect(screen.getByTestId("auth-session-id")).toHaveTextContent("sess-live-1");

      // Switching branches updates support session branch via RPC, NEVER Super Admin's profiles row
      fireEvent.click(screen.getByText("Trigger Switch Branch"));
      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith("switch_support_session_branch", {
          _session_id: "sess-live-1",
          _branch_id: "branch-customer-2",
        });
      });
      expect(profileUpdateSpy).not.toHaveBeenCalled();

      // End support session reverts cleanly back to MauzoChap HQ
      fireEvent.click(screen.getByText("Trigger End Support"));
      await waitFor(() => {
        expect(screen.getByTestId("auth-support-mode")).toHaveTextContent("no");
      });
      expect(screen.getByTestId("auth-biz-name")).toHaveTextContent("MauzoChap HQ");

      Object.defineProperty(window, "location", {
        configurable: true,
        value: origLocation,
      });
    });
  });

  describe("2. Support Mode Banner, Customer Navigation & Safeguards", () => {
    it("displays SupportSessionBanner, unlocks full customer sidebar in AppShell, and audits module views", async () => {
      const superAdminUser = {
        id: "sa-uid-001",
        email: "salvatoryfilbert2@gmail.com",
        user_metadata: {},
      };
      mockGetSession.mockResolvedValue({ data: { session: { user: superAdminUser } } });

      const activeSess: SupportSession = {
        session_id: "sess-banner-99",
        super_admin_id: "sa-uid-001",
        super_admin_email: "salvatoryfilbert2@gmail.com",
        target_business_id: "11111111-2222-3333-4444-555555555555",
        target_business_name: "Arusha Hardware & Paint",
        target_owner_id: "owner-arusha",
        active_branch_id: "br-arusha",
        reason: "Configure categories",
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 45 * 60_000).toISOString(),
        status: "active",
      };

      mockRpc.mockImplementation(async (fn: string) => {
        if (fn === "get_current_super_admin_support_session") {
          return { data: activeSess, error: null };
        }
        if (fn === "record_support_audit_event") {
          return { data: { success: true }, error: null };
        }
        return { data: null, error: null };
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ role: "super_admin" }] }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { business_id: "biz-hq", branch_id: "br-hq" } }),
          };
        }
        if (table === "businesses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "11111111-2222-3333-4444-555555555555",
                business_name: "Arusha Hardware & Paint",
                account_status: "suspended", // Even suspended customers can be supported by Super Admin
              },
            }),
          };
        }
        if (table === "branches") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: "br-arusha", name: "Clocktower Shop" }] }),
          };
        }
        if (table === "notifications" || table === "products") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      mockPathname = "/expenses";
      const Wrapper = createQueryWrapper();
      render(
        <Wrapper>
          <AuthProvider>
            <AppShell>
              <div data-testid="customer-expenses-view">Customer Expenses Module</div>
            </AppShell>
          </AuthProvider>
        </Wrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("support-session-banner")).toBeInTheDocument();
      });

      // Support toolbar required indicators
      expect(screen.getByText("Support Mode Active")).toBeInTheDocument();
      expect(screen.getAllByText("Arusha Hardware & Paint").length).toBeGreaterThan(0);
      expect(screen.getByText("ID: 11111111")).toBeInTheDocument();
      expect(screen.getAllByText("Return to Super Admin").length).toBeGreaterThan(0);
      expect(screen.getByText("End Support Session")).toBeInTheDocument();

      // Full customer modules unlocked in sidebar
      expect(screen.getByTestId("customer-expenses-view")).toBeInTheDocument();
      expect(screen.getAllByText("Invoices").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Locations").length).toBeGreaterThan(0);

      // Module view audited
      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith(
          "record_support_audit_event",
          expect.objectContaining({
            _session_id: "sess-banner-99",
            _action: "view_module",
            _module: "expenses",
          }),
        );
      });
    });

    it("prevents SettingsPage and Receipt from leaking or overwriting Super Admin HQ profile during Support Mode", async () => {
      const superAdminUser = {
        id: "sa-uid-001",
        email: "salvatoryfilbert2@gmail.com",
        user_metadata: {},
      };
      mockGetSession.mockResolvedValue({ data: { session: { user: superAdminUser } } });

      const activeSess: SupportSession = {
        session_id: "sess-settings-1",
        super_admin_id: "sa-uid-001",
        super_admin_email: "salvatoryfilbert2@gmail.com",
        target_business_id: "biz-cust-55",
        target_business_name: "Dodoma Pharmacy",
        target_owner_id: "owner-dodoma",
        active_branch_id: "br-dodoma",
        reason: null,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
        status: "active",
      };

      const profileUpdateSpy = vi.fn();

      mockRpc.mockImplementation(async (fn: string) => {
        if (fn === "get_current_super_admin_support_session") {
          return { data: activeSess, error: null };
        }
        if (fn === "support_update_business_settings") {
          return { data: { success: true }, error: null };
        }
        return { data: null, error: null };
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ role: "super_admin" }] }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                business_id: "biz-hq",
                branch_id: "br-hq",
                business_name: "MauzoChap HQ",
                full_name: "Salvatory Filbert",
              },
            }),
            update: profileUpdateSpy,
          };
        }
        if (table === "businesses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "biz-cust-55",
                business_name: "Dodoma Pharmacy",
                owner_name: "Asha Mwinyi",
                email: "asha@dodomapharmacy.co.tz",
                phone: "0755111222",
              },
            }),
          };
        }
        if (table === "branches") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => {
              const chain: any = {
                single: vi.fn().mockResolvedValue({
                  data: { name: "Nyerere Square", location: "Dodoma CBD", business_id: "biz-cust-55" },
                }),
                then: (resolve: any) => resolve({ data: [{ id: "br-dodoma", name: "Nyerere Square" }] }),
              };
              return chain;
            }),
          };
        }
        return {};
      });

      render(
        <AuthProvider>
          <SettingsPage />
          <Receipt
            sale={{
              id: "sale-support-1",
              receipt_number: "RC-SUP-001",
              subtotal: 10000,
              discount: 0,
              tax: 0,
              total: 10000,
              payment_method: "cash",
              amount_paid: 10000,
              notes: null,
              created_at: new Date().toISOString(),
              items: [{ id: "i1", name: "Amoxicillin", qty: 1, price: 10000 }],
              branch_id: "br-dodoma",
              business_id: "biz-cust-55",
              cashier_id: "sa-uid-001", // Sale recorded by Super Admin during Support Mode
              status: "completed",
            }}
            onClose={vi.fn()}
          />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Dodoma Pharmacy")).toBeInTheDocument();
      });

      // Receipt shows customer's store name ("Dodoma Pharmacy"), NOT "MauzoChap HQ"
      expect(screen.getByText("Dodoma Pharmacy")).toBeInTheDocument();
      expect(screen.queryByText("MauzoChap HQ")).not.toBeInTheDocument();

      // Saving settings calls support_update_business_settings RPC, NOT profiles.update
      fireEvent.change(screen.getByDisplayValue("Dodoma Pharmacy"), {
        target: { value: "Dodoma Central Pharmacy" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith("support_update_business_settings", {
          _session_id: "sess-settings-1",
          _business_name: "Dodoma Central Pharmacy",
          _owner_name: "Asha Mwinyi",
          _phone: "0755111222",
        });
      });
      expect(profileUpdateSpy).not.toHaveBeenCalled();
    });

    it("isolates business logos strictly by businessId in localStorage without cross-tenant fallback", async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      await saveBusinessLogo("data:image/png;base64,DEFAULT_HQ_LOGO", null);
      await saveBusinessLogo("data:image/png;base64,SHOP_A_LOGO", "biz-shop-a");

      expect(getBusinessLogo("biz-shop-a")).toBe("data:image/png;base64,SHOP_A_LOGO");
      expect(getBusinessLogo("biz-shop-b")).toBeNull();
    });
  });

  describe("3. Super Admin Support Activity Logs & Confirmation Modal", () => {
    it("renders SupportActivityLogsTab with session details, expandable activities, and filtering", async () => {
      const superAdminUser = {
        id: "sa-uid-001",
        email: "salvatoryfilbert2@gmail.com",
        user_metadata: {},
      };
      mockGetSession.mockResolvedValue({ data: { session: { user: superAdminUser } } });
      mockRpc.mockResolvedValue({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ role: "super_admin" }] }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { business_id: "biz-hq", branch_id: "br-hq" } }),
          };
        }
        if (table === "businesses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "biz-hq", business_name: "MauzoChap HQ" } }),
          };
        }
        if (table === "branches") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === "super_admin_support_sessions") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sess-1",
                  super_admin_id: "sa-uid-001",
                  super_admin_email: "salvatoryfilbert2@gmail.com",
                  target_business_id: "biz-kibo",
                  target_business_name: "Kibo Electronics",
                  target_owner_id: "owner-kibo",
                  active_branch_id: "br-kibo",
                  status: "ended",
                  reason: "Price correction request",
                  started_at: "2026-11-25T10:00:00Z",
                  expires_at: "2026-11-25T11:00:00Z",
                  last_activity_at: "2026-11-25T10:15:00Z",
                  ended_at: "2026-11-25T10:15:00Z",
                },
                {
                  id: "sess-2",
                  super_admin_id: "sa-uid-001",
                  super_admin_email: "salvatoryfilbert2@gmail.com",
                  target_business_id: "biz-zanzibar",
                  target_business_name: "Zanzibar Spice Mart",
                  target_owner_id: "owner-znz",
                  active_branch_id: "br-znz",
                  status: "active",
                  reason: "Stock transfer check",
                  started_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 1800_000).toISOString(),
                  last_activity_at: new Date().toISOString(),
                  ended_at: null,
                },
              ],
              error: null,
            }),
          };
        }
        if (table === "super_admin_support_audit_logs") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "log-1",
                  session_id: "sess-1",
                  super_admin_id: "sa-uid-001",
                  super_admin_email: "salvatoryfilbert2@gmail.com",
                  business_id: "biz-kibo",
                  business_name: "Kibo Electronics",
                  action: "products_update",
                  module: "products",
                  record_id: "prod-991",
                  result: "success",
                  metadata: { name: "Samsung TV 43" },
                  created_at: "2026-11-25T10:05:00Z",
                },
                {
                  id: "log-2",
                  session_id: "sess-2",
                  super_admin_id: "sa-uid-001",
                  super_admin_email: "salvatoryfilbert2@gmail.com",
                  business_id: "biz-zanzibar",
                  business_name: "Zanzibar Spice Mart",
                  action: "sales_insert",
                  module: "sales",
                  record_id: "sale-882",
                  result: "success",
                  metadata: { receipt_number: "RC-778" },
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
          };
        }
        return {};
      });

      const Wrapper = createQueryWrapper();
      render(
        <Wrapper>
          <AuthProvider>
            <SupportActivityLogsTab
              businesses={[
                { id: "biz-kibo", business_name: "Kibo Electronics" },
                { id: "biz-zanzibar", business_name: "Zanzibar Spice Mart" },
              ]}
            />
          </AuthProvider>
        </Wrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("support-session-row-sess-1")).toBeInTheDocument();
      });
      expect(screen.getByTestId("support-session-row-sess-2")).toBeInTheDocument();

      // Filter by status = ended
      fireEvent.change(screen.getByLabelText("Filter by session status"), {
        target: { value: "ended" },
      });
      expect(screen.getByTestId("support-session-row-sess-1")).toBeInTheDocument();
      expect(screen.queryByTestId("support-session-row-sess-2")).not.toBeInTheDocument();

      // Expand activity trail for Kibo Electronics
      fireEvent.click(screen.getByRole("button", { name: /View Activities/i }));
      expect(screen.getByText("Products Update")).toBeInTheDocument();
      expect(screen.getByText(/Samsung TV 43/)).toBeInTheDocument();
    });
  });

  describe("4. Database Migration Safety & Immutability Contract", () => {
    it("verifies additive SQL migration contains zero destructive statements and enforces single-business RLS & append-only audit logs", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261125000000_super_admin_support_access.sql",
      );
      const sql = fs.readFileSync(migrationPath, "utf8");
      const executableSql = sql.replace(/--.*$/gm, "");

      // Zero destructive operations in executable SQL
      expect(executableSql).not.toMatch(/\bDROP\s+TABLE\b/i);
      expect(executableSql).not.toMatch(/\bTRUNCATE\b/i);
      expect(executableSql).not.toMatch(/\bDELETE\s+FROM\b/i);

      // Required tables, unique single-session index, append-only trigger, and RPCs
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.super_admin_support_sessions");
      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.super_admin_support_audit_logs");
      expect(sql).toContain("idx_one_active_support_session_per_super_admin");
      expect(sql).toContain("trg_immutable_support_audit_logs");
      expect(sql).toContain("start_super_admin_support_session");
      expect(sql).toContain("get_current_super_admin_support_session");
      expect(sql).toContain("switch_support_session_branch");
      expect(sql).toContain("end_super_admin_support_session");
      expect(sql).toContain("record_support_audit_event");
      expect(sql).toContain("support_update_business_settings");
      expect(sql).toContain("audit_support_session_mutation");
    });
  });
});
