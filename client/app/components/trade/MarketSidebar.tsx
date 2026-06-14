"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAllCards, getCardBySlug } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD } from "@/app/lib/format";
import { PriceChange } from "@/app/components/ui/PriceChange";
import { CardImage } from "@/app/components/ui/CardImage";

export function MarketSidebar({ activeSlug }: { activeSlug: string }) {
  const [tab, setTab] = useState<"markets" | "positions">("markets");
  const cards = getAllCards();
  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);
  const positions = usePerpsStore((s) => s.positions);
  const mounted = useMounted();

  const topMarkets = useMemo(
    () => [...cards].sort((a, b) => b.price - a.price).slice(0, 25),
    [cards]
  );

  const getChange = (slug: string, fallbackPrice: number) => {
    const live = livePrices[slug] ?? fallbackPrice;
    const base = baselinePrices[slug] ?? fallbackPrice;
    return base === 0 ? 0 : ((live - base) / base) * 100;
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface/60 lg:w-72">
      <div className="flex border-b border-border text-sm font-medium">
        <button
          onClick={() => setTab("markets")}
          className={`flex-1 px-4 py-3 transition-colors ${
            tab === "markets" ? "border-b-2 border-accent text-white" : "text-muted hover:text-zinc-200"
          }`}
        >
          Top Markets
        </button>
        <button
          onClick={() => setTab("positions")}
          className={`flex-1 px-4 py-3 transition-colors ${
            tab === "positions" ? "border-b-2 border-accent text-white" : "text-muted hover:text-zinc-200"
          }`}
        >
          My Positions{mounted && positions.length > 0 ? ` (${positions.length})` : ""}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "markets" ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted border-b border-white/5">
              <span>Market</span>
              <span>Price</span>
            </div>
            {topMarkets.map((c) => {
              const price = livePrices[c.slug] ?? c.price;
              const change = getChange(c.slug, c.price);
              const active = c.slug === activeSlug;
              return (
                <Link
                  key={c.id}
                  href={`/trade/${c.slug}`}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors hover:bg-surface-2 ${
                    active ? "border-l-accent bg-surface-2" : "border-l-transparent"
                  }`}
                >
                  <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded bg-black drop-shadow-sm">
                    <CardImage src={c.image} alt={c.name} sizes="40px" className="object-contain" />
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col">
                    <span className="block truncate text-[13px] font-semibold text-zinc-100">
                      {c.name.split(",")[0]}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{c.number}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="block font-mono text-sm font-bold text-zinc-100">
                      {formatUSD(price)}
                    </span>
                    <PriceChange value={change} className="text-[11px] font-medium" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            {!mounted || positions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                {mounted ? "No open positions yet." : "Loading..."}
              </div>
            ) : (
              positions.map((p) => {
                const card = getCardBySlug(p.cardSlug);
                if (!card) return null;
                const price = livePrices[p.cardSlug] ?? card.price;
                const active = p.cardSlug === activeSlug;
                return (
                  <Link
                    key={p.id}
                    href={`/trade/${p.cardSlug}`}
                    className={`flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors hover:bg-surface-2 ${
                      active ? "border-l-accent bg-surface-2" : "border-l-transparent"
                    }`}
                  >
                    <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded bg-black drop-shadow-sm">
                      <CardImage src={card.image} alt={card.name} sizes="40px" className="object-contain" />
                    </div>
                    <div className="flex flex-1 min-w-0 flex-col">
                      <span className="block truncate text-[13px] font-semibold text-zinc-100">
                        {card.name.split(",")[0]}
                      </span>
                      <span className="block truncate text-[11px] text-muted">Size {formatUSD(p.size)}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          p.side === "long"
                            ? "bg-long/15 text-long"
                            : "bg-short/15 text-short"
                        }`}
                      >
                        {p.side} {p.leverage}x
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-zinc-300">
                        {formatUSD(price)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
