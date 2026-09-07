/**
 * Google Analytics 4 (gtag.js) integration.
 *
 * Measurement ID resolution order:
 *   1. VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY (GA connector)
 *   2. VITE_GA_MEASUREMENT_ID / GA_MEASUREMENT_ID env vars
 *   3. Hard-coded production fallback "G-DKG4BJJDRR"
 *
 * The gtag.js script is injected once; page views are sent manually for the
 * SPA (initial load + every TanStack Router navigation), with dedupe so the
 * same path is never reported twice in a row.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID: string =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined) ||
  (import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined) ||
  (import.meta.env["GA_MEASUREMENT_ID"] as string | undefined) ||
  "G-DKG4BJJDRR";

let isFirstPageLoad = true;
let lastTrackedPath: string | null = null;

export function initAnalytics() {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;

  // The initial page load is recorded automatically by the head gtag('config', ...) snippet.
  if (isFirstPageLoad) {
    isFirstPageLoad = false;
    lastTrackedPath = path;
    return;
  }

  if (path === lastTrackedPath) return; // avoid duplicate pageviews
  lastTrackedPath = path;

  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: title ?? document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}
