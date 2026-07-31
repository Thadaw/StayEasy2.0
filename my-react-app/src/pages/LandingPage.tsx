import { Navbar } from "../components/Navbar";
import { HeroSection } from "../components/HeroSection";
import { Footer } from "../components/Footer";
import { PropertyTypesSection } from "../components/landing/PropertyTypesSection";
import { NearbySection } from "../components/landing/NearbySection";
import { CitySection } from "../components/landing/CitySection";
import { PopularDestinations } from "../components/landing/PopularDestinations";
import { TrustBadgesSection } from "../components/landing/TrustBadgesSection";
import { TestimonialSection } from "../components/landing/TestimonialSection";
import { NewsletterSection } from "../components/landing/NewsletterSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <PropertyTypesSection />
      <NearbySection />
      <CitySection city="kathmandu" />
      <CitySection city="pokhara" />
      <PopularDestinations />
      <TrustBadgesSection />
      <TestimonialSection />
      <NewsletterSection />
      <Footer />

      <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
