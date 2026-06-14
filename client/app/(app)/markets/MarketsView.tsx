"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAllCards, getCharacters, getRarities } from "@/app/lib/cards";
import { CardTile } from "@/app/components/ui/CardTile";
import { usePerpsStore } from "@/app/lib/store";
import { formatUSD } from "@/app/lib/format";

const SORT_OPTIONS = [
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "change-desc", label: "Top Gainers" },
  { value: "change-asc", label: "Top Losers" },
  { value: "name", label: "Name (A-Z)" },
];

export function MarketsView() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [character, setCharacter] = useState("All");
  const [rarity, setRarity] = useState("All");
  const [sort, setSort] = useState("price-desc");

  const cards = getAllCards();
  const characters = useMemo(() => ["All", ...getCharacters()], []);
  const rarities = useMemo(() => ["All", ...getRarities()], []);

  const livePrices = usePerpsStore((s) => s.livePrices);
  const baselinePrices = usePerpsStore((s) => s.baselinePrices);

  const filtered = useMemo(() => {
    const getPrice = (c: (typeof cards)[number]) => livePrices[c.slug] ?? c.price;
    const getChange = (c: (typeof cards)[number]) => {
      const live = livePrices[c.slug] ?? c.price;
      const base = baselinePrices[c.slug] ?? c.price;
      return base === 0 ? 0 : ((live - base) / base) * 100;
    };

    let list = cards.filter((c) => {
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (character !== "All" && c.character !== character) return false;
      if (rarity !== "All" && c.rarity !== rarity) return false;
      return true;
    });

    list = [...list];
    switch (sort) {
      case "price-desc":
        list.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case "price-asc":
        list.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case "change-desc":
        list.sort((a, b) => getChange(b) - getChange(a));
        break;
      case "change-asc":
        list.sort((a, b) => getChange(a) - getChange(b));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [cards, query, character, rarity, sort, livePrices, baselinePrices]);

  const totalMarketCap = useMemo(
    () => cards.reduce((sum, c) => sum + (livePrices[c.slug] ?? c.price), 0),
    [cards, livePrices]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">
            Browse All <span className="text-accent">Cards</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {cards.length} markets &middot; Dragon Ball Super: Masters &middot; combined
            reference value {formatUSD(totalMarketCap, { compact: true })}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by card name..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-100 placeholder:text-muted focus:border-accent/60 focus:outline-none sm:max-w-xs"
        />
        <select
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-accent/60 focus:outline-none"
        >
          {characters.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Characters" : c}
            </option>
          ))}
        </select>
        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-accent/60 focus:outline-none"
        >
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All Rarities" : r}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-100 focus:border-accent/60 focus:outline-none sm:ml-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center text-muted">
          No cards match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
