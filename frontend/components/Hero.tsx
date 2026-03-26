"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2830&auto=format&fit=crop",
  "https://res.cloudinary.com/dcwyl56kj/image/upload/v1773433296/photo-1431324155629-1a6deb1dec8d_ee8kql.jpg",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2670&auto=format&fit=crop",
  "https://brand.assets.adidas.com/image/upload/f_auto,q_auto:best,fl_lossy/if_w_gt_1920,w_1920/6506886_FT_FOOTBALL_CLUB_AMERICA_THIRD_NOV_18_ONSITE_HERO_BANNER_D_2880x1280_CELTRA_f410798451.jpg"
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-theme-bg">

      {/* CARRUSEL DE FONDO */}
      <div className="absolute inset-0 w-full h-full">
        {HERO_IMAGES.map((img, index) => (
          <div key={index} className="absolute inset-0 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Slide ${index}`}
              className={`w-full h-full object-cover transition-all duration-1000 ease-in-out
                ${index === currentImage ? "opacity-50 scale-105" : "opacity-0 scale-100"}
              `}
            />
          </div>
        ))}

        {/* Gradientes siempre oscuros — el Hero es cinematográfico e independiente del tema */}
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 z-10" />
      </div>

      {/* CONTENIDO */}
      <div className="relative z-20 text-center max-w-5xl px-4 mt-16 animate-in fade-in zoom-in duration-1000">
        <h2 className="text-accent font-bold tracking-[0.3em] uppercase mb-6 text-xs md:text-sm drop-shadow-md">
          Est. 2025 • Official Gear
        </h2>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading text-white tracking-tight uppercase mb-6 leading-[0.9] drop-shadow-2xl">
          Jerseys <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">Raw</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg">
          La colección definitiva de indumentaria oficial. <br className="hidden md:block" />
          Calidad profesional para quienes viven el juego dentro y fuera de la cancha.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          {/* Botón Primario: Sólido, máximo contraste */}
          <Link
            href="/catalog"
            className="group w-full sm:w-auto px-10 py-4 bg-gradient-to-b from-[#f8c889] via-[#fbc57d] to-[#fec375] text-black font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Ver Catálogo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          {/* Botón Secundario: Noise Background (Aceternity-style) */}
          <Link href="/catalog" className="group relative w-full sm:w-auto px-10 py-4 text-white font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 overflow-hidden rounded-full border border-white/20">
            {/* Animated gradient blobs */}
            <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
              <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] opacity-60">
                <div className="absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,#f8c889_0%,transparent_30%,#fbc57d_50%,transparent_70%,rgba(255,255,255,0.4)_85%,#f8c889_100%)]" />
              </div>
            </div>
            {/* Noise texture overlay */}
            <div className="absolute inset-0 rounded-[inherit] opacity-[0.35]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "64px 64px",
            }} />
            {/* Dark inner fill to let only edges of gradient show through */}
            <div className="absolute inset-[1px] rounded-[inherit] bg-black/80 group-hover:bg-black/70 transition-colors" />
            <span className="relative z-10">Más Vendidos</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;