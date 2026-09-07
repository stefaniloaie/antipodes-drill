import { useEffect, useState, type ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode | (() => ReactNode);
  fallback?: ReactNode;
}

/**
 * Ensures children are only rendered on the client after hydration,
 * preventing server-side rendering execution of browser-only code (like Leaflet).
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{typeof children === "function" ? (children as () => ReactNode)() : children}</>;
}

export default ClientOnly;
