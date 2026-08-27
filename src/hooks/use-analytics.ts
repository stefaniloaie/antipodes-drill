import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initAnalytics, trackPageView } from "@/lib/analytics";

/** Boots gtag.js once and sends a page_view on every SPA route change. */
export function useAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${pathname}${search ?? ""}`);
  }, [pathname, search]);
}
