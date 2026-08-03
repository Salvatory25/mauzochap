import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 1000, // 10 seconds cache validity
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
        refetchOnWindowFocus: false, // Prevent refetching when user switches tabs
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Preload when hovering or focusing a link
    defaultPreloadStaleTime: 10 * 1000, // Preload cache valid for 10s
  });

  return router;
};
