import { rarityStyle } from "@/app/lib/cards";

export function RarityBadge({
  rarity,
  className = "",
}: {
  rarity: string;
  className?: string;
}) {
  const style = rarityStyle(rarity);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.className} ${className}`}
    >
      {style.label}
    </span>
  );
}
