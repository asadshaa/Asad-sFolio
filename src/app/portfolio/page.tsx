import type { Metadata } from "next";
import { profile } from "@/config/portfolio";
import { PortfolioFallback } from "@/components/portfolio/PortfolioFallback";

export const metadata: Metadata = {
  title: "Classic portfolio",
  description: `${profile.headline} Projects, skills, experience and contact details.`,
};

export default function PortfolioPage() {
  return <PortfolioFallback />;
}
