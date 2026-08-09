import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/app-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/lib/use-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MauzoChap — POS & Business Management" },
      {
        name: "description",
        content:
          "Modern POS and business management for shops, pharmacies and restaurants in Tanzania.",
      },
      // Open Graph (Social Sharing)
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mauzochap.vercel.app/" },
      { property: "og:site_name", content: "MauzoChap" },
      { property: "og:title", content: "MauzoChap — POS & Business Management" },
      { property: "og:description", content: "Modern POS and business management for shops, pharmacies and restaurants in Tanzania." },
      { property: "og:image", content: "https://mauzochap.vercel.app/logo.png" },
      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MauzoChap — POS & Business Management" },
      { name: "twitter:description", content: "Modern POS and business management for shops, pharmacies and restaurants in Tanzania." },
      { name: "twitter:image", content: "https://mauzochap.vercel.app/logo.png" },
      // PWA / iOS meta tags
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "MauzoChap" },
      { name: "theme-color", content: "#0f172a" },
      { name: "application-name", content: "MauzoChap" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/logo.png" },
      // PWA manifest
      { rel: "manifest", href: "/manifest.json" },
      // iOS touch icon
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Register PWA service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] Registered:", reg.scope))
        .catch((err) => console.error("[SW] Registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
