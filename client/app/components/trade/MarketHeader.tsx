"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DbzCard } from "@/app/lib/types";
import { getAllCards } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { formatUSD } from "@/app/lib/format";
import { PriceChange } from "@/app/components/ui/PriceChange";
import { RarityBadge } from "@/app/components/ui/RarityBadge";
import { seeded24hRange } from "@/app/lib/mock";

export function MarketHeader({ card }: { card: DbzCard }) {
  const price = usePerpsStore((s) => s.markPrice(card));
  const change = usePerpsStore((s) => s.change24h(card));
  const { high, low } = seeded24hRange(card, price);

  const allCards = getAllCards();
  const currentIndex = allCards.findIndex((c) => c.slug === card.slug);
  const prevCard = allCards[(currentIndex - 1 + allCards.length) % allCards.length];
  const nextCard = allCards[(currentIndex + 1) % allCards.length];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-border bg-surface p-4 pr-16 relative">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <RarityBadge rarity={card.rarity} />
          <span className="truncate text-xs text-muted">
            {card.set} &middot; {card.number}
          </span>
        </div>
        <h1 className="truncate font-display text-xl tracking-wide text-white sm:text-2xl">
          {card.name}
        </h1>
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted">Mark Price</span>
        <span className="font-mono text-2xl font-bold text-white">{formatUSD(price)}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted">24h Change</span>
        <PriceChange value={change} className="text-base" showIcon />
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted">24h High</span>
        <span className="font-mono text-sm text-zinc-200">{formatUSD(high)}</span>
      </div>

      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted">24h Low</span>
        <span className="font-mono text-sm text-zinc-200">{formatUSD(low)}</span>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <Link
          href={`/trade/${prevCard.slug}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ChevronLeft size={18} />
        </Link>
        <Link
          href={`/trade/${nextCard.slug}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
        >
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}
