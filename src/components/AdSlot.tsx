import { useEffect, useRef } from "react";

/**
 * Google AdSense publisher ID.
 * Override with VITE_ADSENSE_CLIENT in your env if you ever need to switch accounts.
 */
export const ADSENSE_CLIENT: string =
  (import.meta.env["VITE_ADSENSE_CLIENT"] as string | undefined) ?? "ca-pub-6603115789312953";

let scriptInjected = false;

function ensureAdSenseScript() {
  if (scriptInjected || !ADSENSE_CLIENT || typeof document === "undefined") return;
  scriptInjected = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}

type AdSlotProps = {
  /** AdSense ad unit ID (data-ad-slot) */
  slot?: string;
  format?: string;
  className?: string;
  label?: string;
  minHeight?: number;
};

export default function AdSlot({
  slot,
  format = "auto",
  className = "",
  label = "Advertisement",
  minHeight = 110,
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const active = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!active || pushed.current) return;
    ensureAdSenseScript();
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* ad blocker or script blocked — placeholder stays */
    }
  }, [active]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-dashed border-border bg-card/60 ${className}`}
      style={{ minHeight }}
      aria-label={label}
    >
      <p className="mono-label px-3 pt-2 text-[10px] tracking-widest text-muted-foreground/70">
        {label}
      </p>
      {active ? (
        <ins
          ref={ref}
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div
          className="flex items-center justify-center px-3 pb-3 text-xs text-muted-foreground/60"
          style={{ minHeight: minHeight - 30 }}
        >
          Ad slot reserved
        </div>
      )}
    </div>
  );
}
