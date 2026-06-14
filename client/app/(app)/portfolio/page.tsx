import type { Metadata } from "next";
import { PortfolioView } from "./PortfolioView";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track your open positions, P&L, and trade history.",
};

export default function PortfolioPage() {
  return <PortfolioView />;
}
