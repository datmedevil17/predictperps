import { notFound } from "next/navigation";
import { getCardBySlug } from "@/app/lib/cards";
import { CardDetailsView } from "./CardDetailsView";

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    notFound();
  }

  return <CardDetailsView card={card} />;
}
