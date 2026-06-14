import cardsData from "./data/dbz-cards.json";
import type { DbzCard } from "./types";

export const DBZ_CARDS: DbzCard[] = cardsData as DbzCard[];

export function getAllCards(): DbzCard[] {
  return DBZ_CARDS;
}

export function getCardBySlug(slug: string): DbzCard | undefined {
  return DBZ_CARDS.find((c) => c.slug === slug);
}

export function getCharacters(): string[] {
  const set = new Set(DBZ_CARDS.map((c) => c.character));
  return Array.from(set).sort();
}

export function getRarities(): string[] {
  const set = new Set(DBZ_CARDS.map((c) => c.rarity));
  return Array.from(set);
}

interface RarityStyle {
  label: string;
  className: string;
}

export const RARITY_STYLES: Record<string, RarityStyle> = {
  "God Rare": {
    label: "God Rare",
    className: "bg-gradient-to-r from-accent-2 to-accent text-black",
  },
  "Secret Rare": {
    label: "Secret Rare",
    className: "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white",
  },
  "Special Leader Rare": {
    label: "Leader Rare",
    className: "bg-gradient-to-r from-sky-400 to-blue-500 text-white",
  },
  "Special Rare": {
    label: "Special Rare",
    className: "bg-gradient-to-r from-cyan-400 to-teal-500 text-black",
  },
  "Concept Rare": {
    label: "Concept Rare",
    className: "bg-gradient-to-r from-pink-400 to-rose-500 text-white",
  },
  "Iconic Attack Rare": {
    label: "Iconic Attack",
    className: "bg-gradient-to-r from-amber-400 to-orange-500 text-black",
  },
  "Duo Power Rare": {
    label: "Duo Power",
    className: "bg-gradient-to-r from-indigo-400 to-purple-500 text-white",
  },
  "Dragon Ball Rare": {
    label: "Dragon Ball Rare",
    className: "bg-gradient-to-r from-orange-400 to-amber-500 text-black",
  },
  "Expansion Rare": {
    label: "Expansion Rare",
    className: "bg-zinc-300 text-black",
  },
  "Super Rare": {
    label: "Super Rare",
    className: "bg-gradient-to-r from-emerald-400 to-green-500 text-black",
  },
  Rare: {
    label: "Rare",
    className: "bg-blue-500/90 text-white",
  },
  Uncommon: {
    label: "Uncommon",
    className: "bg-zinc-500 text-white",
  },
  Common: {
    label: "Common",
    className: "bg-zinc-700 text-zinc-200",
  },
};

export function rarityStyle(rarity: string): RarityStyle {
  return (
    RARITY_STYLES[rarity] ?? { label: rarity, className: "bg-zinc-700 text-zinc-200" }
  );
}
