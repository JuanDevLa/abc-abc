"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import Link from "next/link";

const TEAMS_DATA = [
  { id: 101, team: "Real Madrid", slug: "real-madrid", description: "Los Reyes de Europa", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736184/15503_ragdgo.jpg", color: "bg-white text-black" },
  { id: 102, team: "FC Barcelona", slug: "fc-barcelona", description: "Més que un club", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736564/fc-barcelona-logo-3d-texture-desktop-wallpaper-preview_oewisc.jpg", color: "bg-[#004d98] text-white" },
  { id: 103, team: "Manchester City", slug: "manchester-city", description: "Blue Moon Rising", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736632/0_The-Manchester-City-Club-Badge_zkki0q.jpg", color: "bg-[#DA291C] text-white" },
  { id: 105, team: "Selección Mexicana", slug: "seleccion-mexicana", description: "Orgullo Azteca", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736697/ADIDAS-seleccion-jersey-2022_kevlh0.jpg", color: "bg-[#006847] text-white" },
  { id: 106, team: "Selección Brasileña", slug: "brasil", description: "Virgu Macaco", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736750/paulo-brazil-august-20-2022-600nw-2203975889_hdnzon.jpg", color: "bg-[#FFDC02] text-black" },
  { id: 107, team: "Deportivo Guadalajara", slug: "chivas", description: "Chivas Rayadas", img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772736870/Jersey_20Chivas_202024-25_20Local_20para_20hombre_ldgcfe.webp", color: "bg-[#E31D2B] text-white" },
];

const INFINITE_TEAMS = [...TEAMS_DATA, ...TEAMS_DATA, ...TEAMS_DATA];

const FootballSlider = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const oneSetWidth = scrollRef.current.scrollWidth / 3;
      scrollRef.current.scrollLeft = oneSetWidth;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const oneSetWidth = container.scrollWidth / 3;
      if (container.scrollLeft >= oneSetWidth * 2) container.scrollLeft -= oneSetWidth;
      else if (container.scrollLeft <= 50) container.scrollLeft += oneSetWidth;
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstCard = container.firstElementChild as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 616; // card + gap-4
      container.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-4 bg-theme-bg text-th-primary overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-6">

        {/* Ver Todo alineado a la derecha */}
        <div className="flex justify-end mb-6">
          <Link
            href="/catalog"
            className="text-xs font-bold uppercase tracking-widest text-th-secondary hover:text-accent transition-colors border-b border-th-border/20 hover:border-accent pb-0.5"
          >
            Ver Todo →
          </Link>
        </div>

        {/* CARRUSEL con botones flotantes laterales */}
        <div className="relative">

          {/* Botón IZQUIERDO */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 p-2.5 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white backdrop-blur-sm shadow-sm transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Botón DERECHO */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 p-2.5 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white backdrop-blur-sm shadow-sm transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
          >
            {INFINITE_TEAMS.map((item, index) => (
              <Link
                href={`/teams/${item.slug}`}
                key={`${item.id}-${index}`}
                className="min-w-[85vw] md:min-w-[600px] h-[400px] md:h-[500px] snap-start group relative overflow-hidden cursor-pointer rounded-sm block"
              >
                <Image src={item.img} alt={item.team} fill sizes="(max-width: 768px) 85vw, 600px" className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                  <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 tracking-wider ${item.color}`}>Oficial</span>
                    <Star className="w-4 h-4 text-accent fill-current" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-heading uppercase leading-none mb-2 text-white">{item.team}</h3>
                  <p className="text-gray-300 font-medium text-lg tracking-wide mb-6">{item.description}</p>
                  <span className="inline-flex items-center justify-center px-14 py-2.5 bg-gradient-to-b from-[#f8c889] via-[#fbc57d] to-[#fec375] text-black rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
                    Comprar
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Botón Ver todos */}
        <div className="mt-8 text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-b from-[#f8c889] via-[#fbc57d] to-[#fec375] text-black rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Ver todos los equipos
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FootballSlider;