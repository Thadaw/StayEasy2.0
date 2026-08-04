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
    <div className="min-h-screen bg-background font-jakarta">
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

    </div>
  );
}
