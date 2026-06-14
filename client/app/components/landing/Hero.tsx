"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { getAllCards, getCardBySlug } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD } from "@/app/lib/format";
import { CardImage } from "@/app/components/ui/CardImage";
import { PriceChange } from "@/app/components/ui/PriceChange";
import { RarityBadge } from "@/app/components/ui/RarityBadge";

const HERO_SLUG = "ultra-instinct-son-goku-state-of-the-gods-gdr-1362856";

export function Hero() {
  const cards = getAllCards();
  const heroCard = getCardBySlug(HERO_SLUG);
  const mounted = useMounted();
  
  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);

  if (!heroCard) return null;

  const topCards = [...cards]
    .sort((a, b) => b.price - a.price)
    .filter((c) => c.slug !== HERO_SLUG)
    .slice(0, 2);
    
  const displayCards = [topCards[1], topCards[0], heroCard]; // [Back, Middle, Front]

  const getPrice = (c: typeof cards[0]) => livePrices[c.slug] ?? c.price;
  const getChange = (c: typeof cards[0]) => {
    const live = livePrices[c.slug] ?? c.price;
    const base = baselinePrices[c.slug] ?? c.price;
    return base === 0 ? 0 : ((live - base) / base) * 100;
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:gap-16 lg:py-28">
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Zap size={12} /> Limit Break Perpetuals &middot; Up to 50x Leverage
          </span>
          <h1 className="font-display text-4xl leading-tight tracking-wide text-white text-glow sm:text-5xl lg:text-6xl">
            Trade <span className="text-accent">Ultra Instinct Goku</span> Perpetuals
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Go long or short on real Dragon Ball Super card prices. Powered by live TCG
            market data, simulated with leverage, P&amp;L, and liquidation &mdash; no wallet,
            no risk.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/trade/${heroCard.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-accent-2"
            >
              Start Trading <ArrowRight size={16} />
            </Link>
            <Link
              href="/markets"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-bold uppercase tracking-wide text-zinc-200 transition-colors hover:border-accent/50 hover:text-white"
            >
              Browse All Cards
            </Link>
          </div>
        </div>

        <div className="relative flex w-full max-w-sm items-center justify-center lg:max-w-md h-[400px] sm:h-[480px]">
          <div className="absolute h-72 w-72 rounded-full bg-accent/25 blur-[90px] animate-pulse-glow sm:h-96 sm:w-96" />
          
          {displayCards.map((c, i) => {
            const isFront = i === 2;
            const price = getPrice(c);
            const change = getChange(c);
            
            let transforms = "";
            let zIndex = "";
            
            if (i === 0) {
              transforms = "-rotate-12 -translate-x-16 sm:-translate-x-24 -translate-y-8 scale-90 opacity-40 hover:opacity-100 hover:rotate-0 hover:z-40 hover:-translate-y-16 hover:scale-100";
              zIndex = "z-10";
            } else if (i === 1) {
              transforms = "rotate-12 translate-x-16 sm:translate-x-24 -translate-y-4 scale-95 opacity-70 hover:opacity-100 hover:rotate-0 hover:z-40 hover:-translate-y-16 hover:scale-100";
              zIndex = "z-20";
            } else {
              transforms = "rotate-0 translate-y-0 scale-100 opacity-100 hover:-translate-y-4 hover:scale-105";
              zIndex = "z-30";
            }

            return (
              <Link
                key={c.id}
                href={`/trade/${c.slug}`}
                className={`group absolute flex w-full max-w-[240px] sm:max-w-[280px] flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm transition-all duration-500 ease-out shadow-2xl ${transforms} ${zIndex}`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black">
                  <CardImage
                    src={c.image}
                    alt={c.name}
                    sizes="280px"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    priority={isFront}
                  />
                  <div className="absolute left-2 top-2">
                    <RarityBadge rarity={c.rarity} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{c.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-white">
                      {formatUSD(price)}
                    </span>
                    <PriceChange value={mounted ? change : 0} showIcon className="text-sm" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
