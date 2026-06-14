import { Hero } from "@/app/components/landing/Hero";
import { TickerBar } from "@/app/components/landing/TickerBar";
import { StatsBar } from "@/app/components/landing/StatsBar";
import { FeaturedGrid } from "@/app/components/landing/FeaturedGrid";
import { PrivacyArchitecture } from "@/app/components/landing/PrivacyArchitecture";
import { HowItWorks } from "@/app/components/landing/HowItWorks";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <TickerBar />
      <Hero />
      <StatsBar />
      <PrivacyArchitecture />
      <FeaturedGrid />
      <HowItWorks />
    </div>
  );
}
