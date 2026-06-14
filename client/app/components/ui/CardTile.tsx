"use client";

import Link from "next/link";
import type { DbzCard } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { formatUSD } from "@/app/lib/format";
import { RarityBadge } from "./RarityBadge";
import { PriceChange } from "./PriceChange";
import { CardImage } from "./CardImage";

export function CardTile({ card }: { card: DbzCard }) {
  const price = usePerpsStore((s) => s.livePrices[card.slug] ?? card.price);
  const change = usePerpsStore((s) => s.change24h(card));

  return (
    <Link
      href={`/card/${card.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_8px_30px_rgba(255,106,26,0.12)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        <CardImage
          src={card.image}
          alt={card.name}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
          <RarityBadge rarity={card.rarity} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-100" title={card.name}>
          {card.name}
        </p>
        <p className="truncate text-xs text-muted">{card.set}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-mono text-sm font-bold text-white">
            {formatUSD(price)}
          </span>
          <PriceChange value={change} />
        </div>
      </div>
    </Link>
  );
}
