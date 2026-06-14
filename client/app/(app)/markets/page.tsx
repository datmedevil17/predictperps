import { Suspense } from "react";
import type { Metadata } from "next";
import { MarketsView } from "./MarketsView";

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Browse every Dragon Ball Super TCG card market and go long or short with leverage.",
};

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-center text-muted">Loading markets...</div>}>
      <MarketsView />
    </Suspense>
  );
}
