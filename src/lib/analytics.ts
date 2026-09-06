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

export const GA_MEASUREMENT_ID: string | undefined =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as
    | string
    | undefined) ||
  (import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined) ||
  (import.meta.env["GA_MEASUREMENT_ID"] as string | undefined) ||
  "G-DKG4BJJDRR";

let initialized = false;
let lastTrackedPath: string | null = null;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized || !GA_MEASUREMENT_ID) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || gtag;

  // Load gtag.js exactly once, keyed by measurement ID.
  const scriptId = `ga-gtag-${GA_MEASUREMENT_ID}`;
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA_MEASUREMENT_ID,
    )}`;
    document.head.appendChild(script);
  }

  gtag("js", new Date());
  // SPA: disable automatic page_view; we send it manually on route changes.
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  initAnalytics();
  if (!window.gtag) return;
  if (path === lastTrackedPath) return; // avoid duplicate pageviews
  lastTrackedPath = path;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  initAnalytics();
  if (!window.gtag) return;
  window.gtag("event", name, params);
}
