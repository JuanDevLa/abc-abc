import type { Metadata } from "next";
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductCarousel from '../components/ProductCarousel';
import FootballSlider from '../components/FootballSlider';
import TrendingSection from '../components/TrendingSection';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: { absolute: "Jerseys Raw | Tienda Deportiva de Jerseys en México" },
  description: "Jerseys auténticos de fútbol para hombre y mujer. Premier League, La Liga, Champions League y más. Envíos a toda México.",
  openGraph: {
    title: "Jerseys Raw | Tienda Deportiva de Jerseys en México",
    description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más. Envíos a toda México.",
    url: "https://jerseysraw.com/",
  },
  alternates: { canonical: "https://jerseysraw.com/" },
};

// Divisor de sección reutilizable
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-6 px-6 py-4 container mx-auto">
    <div className="flex-grow border-t-2 border-[#F8C37C] opacity-50" />
    <span className="text-[#F8C37C] italic uppercase text-[10px] sm:text-sm md:text-base font-bold tracking-[0.15em] sm:tracking-[0.3em] whitespace-nowrap px-2 sm:px-6">
      {label}
    </span>
    <div className="flex-grow border-t-2 border-[#F8C37C] opacity-50" />
  </div>
);

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-theme-bg text-th-primary transition-colors duration-300 overflow-x-hidden">
      <Navbar />
      <Hero />

      <div className="-mt-2">
        <SectionDivider label="Novedades" />
      </div>
      <TrendingSection />

      <SectionDivider label="Los más vendidos" />
      <ProductCarousel />

      <SectionDivider label="Clubes de Leyenda" />
      <FootballSlider />

      <SectionDivider label="Suscríbete a Nuestro Catálogo" />
      <Newsletter />

      <Footer />
    </main>
  );
}