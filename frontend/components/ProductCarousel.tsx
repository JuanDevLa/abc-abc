"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PRODUCTS = [
  {
    id: 1,
    name: "Real Madrid",
    slug: "real-madrid",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772776717/rmd_cajheg.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772953195/madrid_leze8u.svg",
  },
  {
    id: 2,
    name: "Barcelona",
    slug: "barcelona",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772775430/retro5_k5nzhi.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772952544/bcn_gbhic4.svg",
  },
  {
    id: 3,
    name: "Brasil",
    slug: "brasil",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772829913/brasil_1_mfavfr.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772951343/1994_ROMARIO_GOLDEN_BALL_pjkimw.webp",
  },
  {
    id: 4,
    name: "AC Milan",
    slug: "ac-milan",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772779469/m%C3%A9xico_2_u2pmt9.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772952133/bbd58a36917a06123fa95b206cff36d4_ab9pom.png",
  },
  {
    id: 5,
    name: "América",
    slug: "america",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772778752/m%C3%A9xico_1_kppyb8.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772952759/bcn_1_u10ny8.svg",
  },
  {
    id: 6,
    name: "México",
    slug: "mexico",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772777957/m%C3%A9xico_bub2fh.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772953175/mex_qonlyg.svg",
  },
  {
    id: 7,
    name: "Japón",
    slug: "japon",
    img: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772777717/rmd1_vtqes9.png",
    imgHover: "https://res.cloudinary.com/dcwyl56kj/image/upload/v1772953337/japon_h9lrho.svg",
  }
];

const INFINITE_PRODUCTS = [...PRODUCTS, ...PRODUCTS, ...PRODUCTS];

const ProductCarousel = () => {
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
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 336; // card + gap-4
      container.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth'
      });
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
            className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-3 z-10 p-2.5 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white backdrop-blur-sm shadow-sm transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón DERECHO */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-3 z-10 p-2.5 rounded-full bg-white/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white backdrop-blur-sm shadow-sm transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* LISTA */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide flex-nowrap px-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {INFINITE_PRODUCTS.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="w-64 md:w-[calc(29%-11px)] lg:w-[calc(21%-12px)] flex-shrink-0 snap-start group flex flex-col h-[380px] md:h-[430px] lg:h-[490px]"
              >
                {/* NOMBRE — arriba, impactante */}
                <div className="pb-3 text-center">
                  <h3 className="text-3xl md:text-4xl uppercase tracking-[0.1em] italic bg-gradient-to-r from-[#f8c889] via-[#fbc57d] to-[#e8a84a] bg-clip-text text-transparent leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
                    {product.name}
                  </h3>
                </div>

                {/* IMAGEN — ocupa el espacio disponible */}
                <Link href={`/teams/${product.slug}`} className="block relative flex-1 min-h-0 overflow-hidden cursor-pointer rounded-lg">
                  <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 320px, (max-width: 1024px) 33vw, 25vw"
                    className={`object-cover transition-all duration-500 rounded-lg ${product.imgHover ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                  />
                  {product.imgHover && (
                    <Image
                      src={product.imgHover}
                      alt={`${product.name} - vista alternativa`}
                      fill
                      sizes="(max-width: 768px) 320px, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                    />
                  )}
                </Link>

                {/* BOTÓN al fondo con pequeño espacio */}
                <div className="pt-2 pb-3 text-center">
                  <Link
                    href={`/teams/${product.slug}`}
                    className="inline-flex items-center justify-center px-14 py-2 lg:py-2.5 bg-gradient-to-b from-[#f8c889] via-[#fbc57d] to-[#fec375] text-black rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;