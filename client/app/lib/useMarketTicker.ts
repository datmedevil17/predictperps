"use client";

import { useEffect } from "react";
import { usePerpsStore } from "./store";

/** Polls the server-side price feed and syncs live prices into the store. */
export function useMarketTicker(intervalMs = 2500) {
  const setPrices = usePerpsStore((s) => s.setPrices);

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPrices(data.prices, data.baseline);
      } catch {
        // server unreachable; keep last known prices and retry next tick
      }
    };

    fetchPrices();
    const id = setInterval(fetchPrices, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [setPrices, intervalMs]);
}
