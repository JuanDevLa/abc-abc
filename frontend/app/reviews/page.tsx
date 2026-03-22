"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Camera,
  X,
  PenLine,
  ArrowLeft,
  Send,
  ImagePlus,
  ChevronRight,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TIPOS — Usar cuando se conecte al API
// ══════════════════════════════════════════════════════════════

interface ReviewProduct {
  name: string;
  imageUrl: string;
  slug: string;
  teamColors: string[]; // Solo para mockup (placeholder de imagen)
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  hasPhoto: boolean;
  verified: boolean;
  createdAt: string;
  product: ReviewProduct;
}

interface ReviewStats {
  average: number;
  total: number;
  byRating: Record<number, number>;
}

// ══════════════════════════════════════════════════════════════
// MOCK DATA — Reemplazar con llamadas al API
// ══════════════════════════════════════════════════════════════

const MOCK_STATS: ReviewStats = {
  average: 4.8,
  total: 127,
  byRating: { 5: 89, 4: 24, 3: 8, 2: 4, 1: 2 },
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Carlos Mendoza",
    rating: 5,
    comment:
      "La mejor jersey que he comprado en mi vida. La calidad del material es increíble — se siente como las originales que usaban los jugadores. Los detalles del escudo y los patrocinadores están perfectamente bordados. Llegó en 3 días a CDMX con empaque premium. 100% recomendado.",
    hasPhoto: true,
    verified: true,
    createdAt: "15 Ene 2024",
    product: {
      name: "Manchester United 2008 Champions League Final",
      imageUrl: "",
      slug: "prod_1",
      teamColors: ["#DA291C", "#000000"],
    },
  },
  {
    id: "r2",
    name: "Ana García López",
    rating: 5,
    comment:
      "Hermosa jersey del Barça. Mi novio quedó encantado con el regalo de cumpleaños. El bordado del escudo es espectacular y la tela es súper cómoda para usar todo el día.",
    hasPhoto: false,
    verified: true,
    createdAt: "10 Ene 2024",
    product: {
      name: "FC Barcelona 2024/25 Home Kit",
      imageUrl: "",
      slug: "prod_2",
      teamColors: ["#A50044", "#004D98"],
    },
  },
  {
    id: "r3",
    name: "Roberto Sánchez",
    rating: 4,
    comment:
      "Muy buena calidad. El único detalle es que tardó un día más de lo esperado, pero la jersey está increíble. El azul es exacto al de la temporada.",
    hasPhoto: true,
    verified: true,
    createdAt: "8 Ene 2024",
    product: {
      name: "Real Madrid 2023/24 Away Kit",
      imageUrl: "",
      slug: "prod_3",
      teamColors: ["#00529F", "#FEBE10"],
    },
  },
  {
    id: "r4",
    name: "María Fernanda López",
    rating: 5,
    comment:
      "¡Increíble! La jersey del Milan es hermosísima. Calidad premium en cada detalle. Volveré a comprar sin duda alguna.",
    hasPhoto: false,
    verified: true,
    createdAt: "5 Ene 2024",
    product: {
      name: "AC Milan 2024/25 Home",
      imageUrl: "",
      slug: "prod_4",
      teamColors: ["#FB090B", "#000000"],
    },
  },
  {
    id: "r5",
    name: "Diego Torres",
    rating: 3,
    comment:
      "La jersey está bien pero esperaba mejor acabado en las costuras laterales. El diseño es bonito.",
    hasPhoto: false,
    verified: true,
    createdAt: "2 Ene 2024",
    product: {
      name: "Juventus 2024/25 Third Kit",
      imageUrl: "",
      slug: "prod_5",
      teamColors: ["#000000", "#D4AF37"],
    },
  },
  {
    id: "r6",
    name: "Fernando Ruiz Hernández",
    rating: 5,
    comment:
      "Pedí la de Messi #10 y llegó perfecta. Los números y el nombre están excelentemente estampados, no se van a despegar ni en 100 lavadas. Se nota que es calidad premium. Mi nueva jersey favorita para ir al estadio.",
    hasPhoto: true,
    verified: true,
    createdAt: "1 Ene 2024",
    product: {
      name: "Inter Miami 2024 Messi #10",
      imageUrl: "",
      slug: "prod_6",
      teamColors: ["#F7B5CD", "#231F20"],
    },
  },
];

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════

/** Renderiza estrellas filled/empty */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "currentColor" : "none"}
          className={i <= rating ? "text-accent" : "text-th-secondary/25"}
          strokeWidth={i <= rating ? 0 : 1.5}
        />
      ))}
    </div>
  );
}

/** Estrellas interactivas para el formulario */
function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= (hover || value);
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            className="transition-transform hover:scale-125 focus:outline-none"
            aria-label={`${i} estrella${i !== 1 ? "s" : ""}`}
          >
            <Star
              size={28}
              fill={active ? "currentColor" : "none"}
              className={active ? "text-accent" : "text-th-secondary/25"}
              strokeWidth={active ? 0 : 1.5}
            />
          </button>
        );
      })}
      {(hover || value) > 0 && (
        <span className="ml-2 text-sm text-th-secondary">
          {hover || value}/5
        </span>
      )}
    </div>
  );
}

/** Avatar con inicial del nombre */
function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const gradients = [
    "from-red-500 to-orange-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-yellow-600",
    "from-cyan-500 to-blue-600",
  ];
  const idx = name.charCodeAt(0) % gradients.length;

  return (
    <div
      className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradients[idx]} flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}
    >
      {initial}
    </div>
  );
}

/** Mini-card del producto comprado — rectángulo ~6×12 */
function ProductMiniCard({ product }: { product: ReviewProduct }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group/product flex items-center gap-3 h-24 w-full max-w-xs rounded-lg border border-th-border/10 bg-theme-surface/50 overflow-hidden transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
    >
      {/* Placeholder de imagen del jersey (colores del equipo) */}
      <div
        className="h-full w-20 flex-shrink-0 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.teamColors[0]}, ${product.teamColors[1] || product.teamColors[0]})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/50 text-2xl font-heading tracking-tighter">
            JR
          </span>
        </div>
      </div>

      {/* Nombre del producto */}
      <div className="flex-1 pr-3 min-w-0">
        <p className="text-[11px] text-th-secondary uppercase tracking-wider mb-0.5">
          Producto comprado
        </p>
        <p className="text-sm text-th-primary font-medium leading-tight line-clamp-2 group-hover/product:text-accent transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-th-secondary">
          <span className="text-[11px]">Ver producto</span>
          <ChevronRight
            size={12}
            className="group-hover/product:translate-x-0.5 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}

/** Placeholder visual de foto del cliente */
function CustomerPhoto({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-48 rounded-lg overflow-hidden border border-th-border/10 group/photo cursor-zoom-in"
      aria-label="Expandir foto del cliente"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-theme-surface to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Camera size={32} className="text-accent/40 mx-auto mb-1" />
          <span className="text-xs text-th-secondary">
            Foto del cliente
          </span>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/photo:opacity-100">
        <span className="text-white text-xs bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
          Click para expandir
        </span>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — /reviews
// ══════════════════════════════════════════════════════════════

export default function ReviewsPage() {
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [formRating, setFormRating] = useState(0);

  // Filtrar + ordenamiento inteligente (foto → 5★ → texto largo)
  const filteredReviews = useMemo(() => {
    const base = activeFilter
      ? MOCK_REVIEWS.filter((r) => r.rating === activeFilter)
      : MOCK_REVIEWS;

    return [...base].sort((a, b) => {
      if (a.hasPhoto && !b.hasPhoto) return -1;
      if (!a.hasPhoto && b.hasPhoto) return 1;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.comment.length - a.comment.length;
    });
  }, [activeFilter]);

  const maxRatingCount = Math.max(...Object.values(MOCK_STATS.byRating));

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* ═══ HEADER ═══ */}
      <div className="border-b border-th-border/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-th-secondary hover:text-th-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Volver a la tienda
          </Link>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading uppercase italic text-th-primary tracking-tight leading-[0.9]">
            Reseñas de Nuestros
            <br />
            <span className="text-accent">Clientes</span>
          </h1>

          <div className="flex items-center gap-4 mt-6">
            <Stars rating={Math.round(MOCK_STATS.average)} size={22} />
            <span className="text-2xl font-bold text-th-primary tabular-nums">
              {MOCK_STATS.average}
            </span>
            <span className="text-th-secondary/40">|</span>
            <span className="text-th-secondary text-sm">
              {MOCK_STATS.total} reseñas verificadas
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ── SIDEBAR: Filtros por estrellas ── */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              <h2 className="text-xs font-semibold text-th-secondary uppercase tracking-[0.15em]">
                Filtrar por estrellas
              </h2>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = MOCK_STATS.byRating[star] || 0;
                  const pct =
                    maxRatingCount > 0
                      ? (count / maxRatingCount) * 100
                      : 0;
                  const isActive = activeFilter === star;

                  return (
                    <button
                      key={star}
                      onClick={() =>
                        setActiveFilter(isActive ? null : star)
                      }
                      className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-accent/10 ring-1 ring-accent/30"
                          : "hover:bg-theme-surface"
                      }`}
                      aria-label={`Filtrar ${star} estrella${star !== 1 ? "s" : ""} (${count} reseñas)`}
                    >
                      <span className="text-sm font-medium text-th-primary w-3 tabular-nums">
                        {star}
                      </span>
                      <Star
                        size={13}
                        fill="currentColor"
                        className="text-accent flex-shrink-0"
                        strokeWidth={0}
                      />

                      {/* Barra de progreso */}
                      <div className="flex-1 h-2 bg-theme-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent/80 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="text-xs text-th-secondary w-7 text-right tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  <X size={14} />
                  Quitar filtro
                </button>
              )}

              {/* CTA — Desktop */}
              <button
                onClick={() => setShowForm(true)}
                className="hidden lg:flex w-full items-center justify-center gap-2 bg-accent-cta text-accent-cta-text font-bold text-sm uppercase tracking-wide py-3.5 px-6 rounded-full hover:opacity-90 transition-opacity shadow-lg"
              >
                <PenLine size={16} />
                Escribir Reseña
              </button>
            </div>
          </aside>

          {/* ── REVIEW CARDS ── */}
          <main className="flex-1 min-w-0">
            <p className="text-sm text-th-secondary mb-6">
              {activeFilter
                ? `${filteredReviews.length} reseña${filteredReviews.length !== 1 ? "s" : ""} de ${activeFilter} estrella${activeFilter !== 1 ? "s" : ""}`
                : `Mostrando ${MOCK_STATS.total} reseñas`}
            </p>

            <div className="space-y-5">
              {filteredReviews.map((review) => (
                <article
                  key={review.id}
                  className="p-5 sm:p-6 rounded-xl border border-th-border/10 bg-theme-card/50 hover:border-th-border/20 transition-colors"
                >
                  {/* Cabecera: Avatar + Nombre + Estrellas */}
                  <div className="flex items-center gap-3">
                    <Avatar name={review.name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-th-primary text-sm">
                          {review.name}
                        </span>
                        {review.verified && (
                          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={review.rating} size={13} />
                        <span className="text-xs text-th-secondary">
                          {review.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comentario */}
                  <p className="mt-4 text-th-primary/90 text-sm leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Foto del cliente (si tiene) */}
                  {review.hasPhoto && (
                    <div className="mt-4">
                      <CustomerPhoto
                        onClick={() => setLightbox(true)}
                      />
                    </div>
                  )}

                  {/* Mini-card del producto */}
                  <div className="mt-4 pt-4 border-t border-th-border/5">
                    <ProductMiniCard product={review.product} />
                  </div>
                </article>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-16">
                <Star
                  size={48}
                  className="text-th-secondary/20 mx-auto mb-3"
                />
                <p className="text-th-secondary">
                  No hay reseñas con {activeFilter} estrella
                  {activeFilter !== 1 ? "s" : ""}.
                </p>
                <button
                  onClick={() => setActiveFilter(null)}
                  className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  Ver todas las reseñas
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══ FLOATING CTA — Mobile ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-40">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent-cta text-accent-cta-text font-bold text-sm uppercase tracking-wide py-3.5 px-8 rounded-full shadow-2xl hover:opacity-90 transition-opacity"
        >
          <PenLine size={16} />
          Escribir Reseña
        </button>
      </div>

      {/* ═══ MODAL: Formulario de Reseña ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />

          {/* Contenido */}
          <div className="relative w-full max-w-lg bg-theme-card border border-th-border/20 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-th-secondary hover:text-th-primary transition-colors"
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>

            <h2 className="text-3xl font-heading uppercase italic text-th-primary tracking-tight mb-1">
              Escribe tu reseña
            </h2>
            <p className="text-sm text-th-secondary mb-6">
              Tu opinión será revisada por un administrador antes de
              publicarse.
            </p>

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: POST /api/v1/reviews
                setShowForm(false);
              }}
            >
              {/* Selector de producto */}
              <div>
                <label className="block text-sm font-medium text-th-primary mb-1.5">
                  Producto comprado *
                </label>
                <select className="w-full bg-theme-surface border border-th-border/20 rounded-lg px-4 py-2.5 text-sm text-th-primary focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all appearance-none">
                  <option value="">Seleccionar producto...</option>
                  <option>Manchester United 2008 Champions League</option>
                  <option>FC Barcelona 2024/25 Home Kit</option>
                  <option>Real Madrid 2023/24 Away Kit</option>
                  <option>AC Milan 2024/25 Home</option>
                  <option>Inter Miami 2024 Messi #10</option>
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-th-primary mb-1.5">
                  Tu nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos M."
                  className="w-full bg-theme-surface border border-th-border/20 rounded-lg px-4 py-2.5 text-sm text-th-primary placeholder:text-th-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>

              {/* Calificación */}
              <div>
                <label className="block text-sm font-medium text-th-primary mb-2">
                  Calificación *
                </label>
                <InteractiveStars
                  value={formRating}
                  onChange={setFormRating}
                />
              </div>

              {/* Comentario */}
              <div>
                <label className="block text-sm font-medium text-th-primary mb-1.5">
                  Tu opinión *
                </label>
                <textarea
                  rows={4}
                  placeholder="Cuéntanos sobre tu experiencia con el producto..."
                  className="w-full bg-theme-surface border border-th-border/20 rounded-lg px-4 py-2.5 text-sm text-th-primary placeholder:text-th-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                />
              </div>

              {/* Subir foto */}
              <div>
                <label className="block text-sm font-medium text-th-primary mb-1.5">
                  Foto (opcional)
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-th-border/20 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                  <ImagePlus
                    size={24}
                    className="text-th-secondary flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm text-th-primary">
                      Sube una foto de tu jersey
                    </p>
                    <p className="text-xs text-th-secondary">
                      JPG, PNG — máx 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>

              {/* Enviar */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-accent-cta text-accent-cta-text font-bold text-sm uppercase tracking-wide py-3.5 rounded-full hover:opacity-90 transition-opacity"
              >
                <Send size={16} />
                Enviar Reseña
              </button>

              <p className="text-[11px] text-th-secondary/60 text-center">
                Al enviar, aceptas que tu reseña sea publicada con tu
                nombre.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ═══ LIGHTBOX — Foto expandida ═══ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-2xl w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-accent/15 via-theme-surface to-accent/5 flex items-center justify-center">
            <div className="text-center">
              <Camera size={48} className="text-accent/30 mx-auto mb-2" />
              <span className="text-th-secondary text-sm">
                Foto del cliente (placeholder del mockup)
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(false);
              }}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              aria-label="Cerrar foto"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
