"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  X,
  PenLine,
  ArrowLeft,
  Send,
  ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// ══════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════

interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface Review {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  productId: string;
  product: ReviewProduct | null;
}

interface ReviewStats {
  average: number;
  total: number;
  byRating: Record<number, number>;
}

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

/** Mini-card del producto comprado */
function ProductMiniCard({ product }: { product: ReviewProduct }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group/product flex items-center gap-3 h-24 w-full max-w-xs rounded-lg border border-th-border/10 bg-theme-surface/50 overflow-hidden transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="h-full w-20 flex-shrink-0 flex items-center justify-center bg-th-border/10">
        <span className="text-th-secondary/40 text-xs font-bold">JR</span>
      </div>

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

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — /reviews
// ══════════════════════════════════════════════════════════════

export default function ReviewsPage() {
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(0);

  // Data state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch reviews + stats cuando cambia el filtro
  useEffect(() => {
    const params = activeFilter ? `?status=APPROVED&stars=${activeFilter}` : '?status=APPROVED';
    Promise.all([
      fetch(`${API_BASE}/api/v1/reviews${params}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/reviews/stats`).then((r) => r.json()),
    ])
      .then(([reviewsData, statsData]) => {
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setStats(statsData);
      })
      .catch(() => {});
  }, [activeFilter]);

  // Abrir form + fetch productos para el selector
  const handleOpenForm = () => {
    setShowForm(true);
    setSubmitted(false);
    if (products.length === 0) {
      fetch(`${API_BASE}/api/v1/products?limit=200`)
        .then((r) => r.json())
        .then((data) => {
          const list = data?.items ?? data;
          setProducts(
            Array.isArray(list)
              ? list.map((p: any) => ({ id: p.id, name: p.name }))
              : []
          );
        })
        .catch(() => {});
    }
  };

  // Enviar reseña
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formName || !formRating) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/v1/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formProductId,
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      setSubmitted(true);
      setFormName('');
      setFormComment('');
      setFormProductId('');
      setFormRating(0);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  // Ordenamiento inteligente: foto → 5★ → texto largo
  const filteredReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (a.image && !b.image) return -1;
      if (!a.image && b.image) return 1;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.comment.length - a.comment.length;
    });
  }, [reviews]);

  const maxRatingCount = stats
    ? Math.max(...Object.values(stats.byRating), 1)
    : 1;

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
            <Stars rating={Math.round(stats?.average ?? 0)} size={22} />
            <span className="text-2xl font-bold text-th-primary tabular-nums">
              {stats?.average ?? '—'}
            </span>
            <span className="text-th-secondary/40">|</span>
            <span className="text-th-secondary text-sm">
              {stats?.total ?? 0} reseñas verificadas
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
                  const count = stats?.byRating[star] ?? 0;
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
                onClick={handleOpenForm}
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
                : `Mostrando ${stats?.total ?? 0} reseñas`}
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
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          Verificado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={review.rating} size={13} />
                        <span className="text-xs text-th-secondary">
                          {new Date(review.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comentario */}
                  <p className="mt-4 text-th-primary/90 text-sm leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Foto del cliente (si tiene) */}
                  {review.image && (
                    <div className="mt-4">
                      <button
                        onClick={() => setLightboxImg(review.image!)}
                        className="relative w-full h-48 rounded-lg overflow-hidden border border-th-border/10 cursor-zoom-in group/photo"
                        aria-label="Expandir foto del cliente"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={review.image}
                          alt={`Foto de ${review.name}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/10 transition-colors" />
                      </button>
                    </div>
                  )}

                  {/* Mini-card del producto */}
                  {review.product && (
                    <div className="mt-4 pt-4 border-t border-th-border/5">
                      <ProductMiniCard product={review.product} />
                    </div>
                  )}
                </article>
              ))}
            </div>

            {filteredReviews.length === 0 && stats !== null && (
              <div className="text-center py-16">
                <Star
                  size={48}
                  className="text-th-secondary/20 mx-auto mb-3"
                />
                <p className="text-th-secondary">
                  {activeFilter
                    ? `No hay reseñas con ${activeFilter} estrella${activeFilter !== 1 ? "s" : ""}.`
                    : 'Aún no hay reseñas.'}
                </p>
                {activeFilter && (
                  <button
                    onClick={() => setActiveFilter(null)}
                    className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors"
                  >
                    Ver todas las reseñas
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══ FLOATING CTA — Mobile ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-40">
        <button
          onClick={handleOpenForm}
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

            {submitted ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-4">✅</p>
                <h3 className="text-xl font-bold text-th-primary mb-2">
                  ¡Gracias!
                </h3>
                <p className="text-sm text-th-secondary">
                  Tu reseña fue enviada y será publicada tras ser revisada.
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  className="mt-6 text-sm text-accent hover:opacity-70 transition-opacity underline underline-offset-4"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-heading uppercase italic text-th-primary tracking-tight mb-1">
                  Escribe tu reseña
                </h2>
                <p className="text-sm text-th-secondary mb-6">
                  Tu opinión será revisada por un administrador antes de publicarse.
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Selector de producto */}
                  <div>
                    <label className="block text-sm font-medium text-th-primary mb-1.5">
                      Producto comprado *
                    </label>
                    <select
                      required
                      value={formProductId}
                      onChange={(e) => setFormProductId(e.target.value)}
                      className="w-full bg-theme-surface border border-th-border/20 rounded-lg px-4 py-2.5 text-sm text-th-primary focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all appearance-none"
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-th-primary mb-1.5">
                      Tu nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
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
                      required
                      rows={4}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Cuéntanos sobre tu experiencia con el producto..."
                      className="w-full bg-theme-surface border border-th-border/20 rounded-lg px-4 py-2.5 text-sm text-th-primary placeholder:text-th-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                    />
                  </div>

                  {/* Enviar */}
                  <button
                    type="submit"
                    disabled={submitting || !formRating}
                    className="w-full flex items-center justify-center gap-2 bg-accent-cta text-accent-cta-text font-bold text-sm uppercase tracking-wide py-3.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send size={16} />
                    {submitting ? 'Enviando...' : 'Enviar Reseña'}
                  </button>

                  <p className="text-[11px] text-th-secondary/60 text-center">
                    Al enviar, aceptas que tu reseña sea publicada con tu nombre.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ LIGHTBOX — Foto expandida ═══ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-2xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg}
              alt="Foto del cliente"
              className="w-full rounded-xl shadow-2xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg(null);
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
