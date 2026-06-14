"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllCards } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { CardTile } from "@/app/components/ui/CardTile";

type Mode = "value" | "gainers" | "losers";

const MODES: { key: Mode; label: string }[] = [
  { key: "value", label: "Highest Value" },
  { key: "gainers", label: "Top Gainers" },
  { key: "losers", label: "Top Losers" },
];

export function FeaturedGrid() {
  const [mode, setMode] = useState<Mode>("value");
  const cards = getAllCards();
  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);

  const items = useMemo(() => {
    const getPrice = (slug: string, fallback: number) => livePrices[slug] ?? fallback;
    const getChange = (slug: string, fallback: number) => {
      const price = livePrices[slug] ?? fallback;
      const base = baselinePrices[slug] ?? fallback;
      return base === 0 ? 0 : ((price - base) / base) * 100;
    };

    const sorted = [...cards];
    switch (mode) {
      case "value":
        sorted.sort((a, b) => getPrice(b.slug, b.price) - getPrice(a.slug, a.price));
        break;
      case "gainers":
        sorted.sort((a, b) => getChange(b.slug, b.price) - getChange(a.slug, a.price));
        break;
      case "losers":
        sorted.sort((a, b) => getChange(a.slug, a.price) - getChange(b.slug, b.price));
        break;
    }
    return sorted.slice(0, 12);
  }, [cards, mode, livePrices, baselinePrices]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
          Trending <span className="text-accent">Markets</span>
        </h2>
        <div className="flex items-center gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === m.key
                  ? "bg-accent text-black"
                  : "border border-border bg-surface text-muted hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-bold uppercase tracking-wide text-zinc-200 transition-colors hover:border-accent/50 hover:text-white"
        >
          View All Markets <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
