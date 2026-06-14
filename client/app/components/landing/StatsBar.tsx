"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getAllCards } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD } from "@/app/lib/format";
import { seededMarketStats } from "@/app/lib/mock";
import { MAX_LEVERAGE } from "@/app/lib/trading";
import { PriceChange } from "@/app/components/ui/PriceChange";

export function StatsBar() {
  const cards = getAllCards();
  const mounted = useMounted();
  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);

  const totalVolume = useMemo(
    () => cards.reduce((sum, c) => sum + seededMarketStats(c).totalVolume, 0),
    [cards]
  );

  const totalMarketCap = useMemo(
    () => cards.reduce((sum, c) => sum + (livePrices[c.slug] ?? c.price), 0),
    [cards, livePrices]
  );

  const biggestMover = useMemo(() => {
    let best = cards[0];
    let bestChange = -Infinity;
    for (const c of cards) {
      const price = livePrices[c.slug] ?? c.price;
      const base = baselinePrices[c.slug] ?? c.price;
      const change = base === 0 ? 0 : ((price - base) / base) * 100;
      if (Math.abs(change) > Math.abs(bestChange) || bestChange === -Infinity) {
        bestChange = change;
        best = c;
      }
    }
    return { card: best, change: bestChange };
  }, [cards, livePrices, baselinePrices]);

  const stats = [
    { label: "Live Markets", value: `${cards.length}` },
    { label: "Max Leverage", value: `${MAX_LEVERAGE}x` },
    { label: "24h Volume", value: formatUSD(totalVolume, { compact: true }) },
    { label: "Combined Reference Value", value: formatUSD(totalMarketCap, { compact: true }) },
  ];

  return (
    <section className="border-b border-border bg-surface/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-none border-x border-border bg-border sm:grid-cols-4 sm:border-x-0 sm:px-6">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 bg-background px-4 py-5 sm:bg-transparent sm:px-6">
            <span className="text-[11px] uppercase tracking-wider text-muted">{s.label}</span>
            <span className="font-display text-2xl tracking-wide text-white sm:text-3xl">
              {s.value}
            </span>
          </div>
        ))}
        <Link
          href={`/trade/${biggestMover.card.slug}`}
          className="col-span-2 flex flex-col gap-1 bg-background px-4 py-5 transition-colors hover:bg-surface-2 sm:col-span-4 sm:bg-transparent sm:px-6"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted">
            Biggest 24h Mover
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl tracking-wide text-white sm:text-2xl">
              {biggestMover.card.name}
            </span>
            <PriceChange value={mounted ? biggestMover.change : 0} showIcon className="text-base" />
          </div>
        </Link>
      </div>
    </section>
  );
}
