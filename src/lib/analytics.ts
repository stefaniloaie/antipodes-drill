/**
 * Google Analytics 4 (gtag.js) integration.
 *
 * The measurement ID is supplied via the GA_MEASUREMENT_ID env var
 * (e.g. "G-XXXXXXXXXX"). When it is absent, every function here is a no-op,
 * so the app keeps working without analytics configured.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID: string | undefined =
  (import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined) ||
  (import.meta.env["GA_MEASUREMENT_ID"] as string | undefined) ||
  "G-DKG4BJJDRR";

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized || !GA_MEASUREMENT_ID) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;

  gtag("js", new Date());
  // SPA: page views are sent manually on route change.
  gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
