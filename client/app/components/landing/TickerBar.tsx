"use client";

import Link from "next/link";
import { getAllCards } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD } from "@/app/lib/format";
import { PriceChange } from "@/app/components/ui/PriceChange";

export function TickerBar() {
  const cards = getAllCards();
  const mounted = useMounted();
  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);

  const items = [...cards].sort((a, b) => b.price - a.price).slice(0, 24);

  const renderRow = (key: string) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" key={key} aria-hidden={key !== "a"}>
      {items.map((c) => {
        const price = livePrices[c.slug] ?? c.price;
        const base = baselinePrices[c.slug] ?? c.price;
        const change = mounted && base !== 0 ? ((price - base) / base) * 100 : 0;
        return (
          <Link
            key={`${key}-${c.id}`}
            href={`/trade/${c.slug}`}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <span className="font-semibold text-zinc-200">{c.name.split(",")[0]}</span>
            <span className="font-mono text-zinc-400">{formatUSD(price)}</span>
            <PriceChange value={change} />
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="overflow-hidden border-b border-border bg-surface/60 py-2.5">
      <div className="flex w-max animate-marquee">
        {renderRow("a")}
        {renderRow("b")}
      </div>
    </div>
  );
}
