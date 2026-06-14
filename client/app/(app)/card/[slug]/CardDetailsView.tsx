"use client";

import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import type { DbzCard } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { formatUSD } from "@/app/lib/format";
import { CardImage } from "@/app/components/ui/CardImage";
import { PriceChange } from "@/app/components/ui/PriceChange";

export function CardDetailsView({ card }: { card: DbzCard }) {
  const price = usePerpsStore((s) => s.livePrices[card.slug] ?? card.price);
  const change24h = usePerpsStore((s) => s.change24h(card));
  
  // Mock data for the UI
  const change30d = change24h * 1.5; // just mock
  const priceRangeLow = price * 0.85;
  const priceRangeHigh = price * 1.15;
  const meanPrice = price * 0.95;
  const listings = Math.floor(Math.random() * 200) + 50;

  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-16">
        {/* Left: Card Image */}
        <div className="relative w-full max-w-md shrink-0 drop-shadow-2xl">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black">
            <CardImage
              src={card.image}
              alt={card.name}
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-white/10 bg-[#141517] p-6 shadow-2xl">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-white">
                {card.name} - {card.number}
              </h1>
              <Star className="mt-1 shrink-0 text-yellow-400" size={20} fill="currentColor" />
            </div>
            <p className="text-sm text-zinc-400">
              {card.set} &middot; {card.rarity}
            </p>
          </div>

          <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Market Price</span>
              <span className="font-mono text-2xl font-bold text-white">
                {formatUSD(price)}
              </span>
            </div>
            <div className="flex items-center gap-12">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  24H CHANGE
                </span>
                <PriceChange value={change24h} className="text-sm font-bold" showIcon />
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  30D CHANGE
                </span>
                <PriceChange value={change30d} className="text-sm font-bold" showIcon />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                Price Range
              </span>
              <span className="font-mono text-sm text-zinc-200">
                {formatUSD(priceRangeLow)} - {formatUSD(priceRangeHigh)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase">Mean Price</span>
              <span className="font-mono text-sm text-zinc-200">{formatUSD(meanPrice)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase">Listings</span>
              <span className="font-mono text-sm text-zinc-200">{listings}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Link
              href={`/trade/${card.slug}`}
              className="flex w-full items-center justify-center rounded-xl bg-[#FCD535] py-3.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Trade
            </Link>
            <a
              href="#"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A2B2F] py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-600">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              Buy on TCGplayer
              <ExternalLink size={14} className="text-zinc-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
