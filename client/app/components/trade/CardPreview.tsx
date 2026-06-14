import type { DbzCard } from "@/app/lib/types";
import { CardImage } from "@/app/components/ui/CardImage";
import { RarityBadge } from "@/app/components/ui/RarityBadge";

export function CardPreview({ card }: { card: DbzCard }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-lg bg-black">
        <CardImage
          src={card.image}
          alt={card.name}
          sizes="220px"
          className="object-contain p-2"
          priority
        />
      </div>
      <div className="mt-3 flex flex-col gap-1.5 text-center">
        <p className="text-sm font-semibold text-zinc-100">{card.name}</p>
        <div className="flex items-center justify-center gap-2">
          <RarityBadge rarity={card.rarity} />
          <span className="text-xs text-muted">{card.printing}</span>
        </div>
        <p className="text-xs text-muted">{card.character}</p>
      </div>
    </div>
  );
}
