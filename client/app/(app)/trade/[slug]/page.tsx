import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCardBySlug } from "@/app/lib/cards";
import { TradeView } from "@/app/components/trade/TradeView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    return {};
  }

  const title = `${card.name} Perpetual`;
  const description = `Go long or short on ${card.name} (${card.character}, ${card.rarity}) with leverage on Limit Break.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: card.image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [card.image],
    },
  };
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    notFound();
  }

  return <TradeView card={card} />;
}
