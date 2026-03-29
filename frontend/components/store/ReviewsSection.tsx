"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Camera,
  X,
  PenLine,
  Send,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  SlidersHorizontal,
  ArrowDownUp,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { cldUrl } from "@/lib/cloudinary";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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

interface ReviewsSectionProps {
  currentProductId?: string;
  currentProductName?: string;
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "currentColor" : "none"}
          className={i <= rating ? "text-amber-400" : "text-gray-200"}
          strokeWidth={i <= rating ? 0 : 1.5}
        />
      ))}
    </div>
  );
}

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
              size={26}
              fill={active ? "currentColor" : "none"}
              className={active ? "text-amber-400" : "text-gray-300"}
              strokeWidth={active ? 0 : 1.5}
            />
          </button>
        );
      })}
      {(hover || value) > 0 && (
        <span className="ml-1 text-sm text-neutral-400">
          {hover || value}/5
        </span>
      )}
    </div>
  );
}

/**
 * Devuelve un aspect-ratio Tailwind determinista basado en el ID de la reseña.
 * Distribución: ~50% square, ~33% landscape 4:3, ~17% portrait 3:4.
 */
function imgAspect(id: string): string {
  const hex = id.replace(/-/g, "");
  const val = parseInt(hex.slice(0, 6), 16);
  const options = [
    "aspect-square",  // 1:1
    "aspect-[4/3]",   // landscape
    "aspect-square",  // 1:1
    "aspect-[3/4]",   // portrait suave
    "aspect-[4/3]",   // landscape
    "aspect-square",  // 1:1
  ] as const;
  return options[val % options.length];
}

/** Resuelve imagen: publicId de Cloudinary o URL completa */
function resolveImg(raw: string | undefined | null, w = 300): string {
  if (!raw) return "";
  if (raw.startsWith("https://res.cloudinary.com")) {
    // Extrae el publicId de una URL completa (reviews guardadas antes del fix)
    const match = raw.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    const publicId = match ? match[1] : null;
    if (publicId) return cldUrl(publicId, { w, q: "auto" });
  }
  if (raw.startsWith("http")) return raw;
  return cldUrl(raw, { w, q: "auto" });
}

// ══════════════════════════════════════════════════════════════
// RELEVANCIA
// ══════════════════════════════════════════════════════════════

const INITIAL_COUNT = 8;
const LOAD_MORE = 3;

/** Puntuación de relevancia: foto buena + comentario escrito + 5 estrellas */
function relevanceScore(r: Review): number {
  let score = 0;
  // Rating: 5 estrellas = 5pts, 4 estrellas = 3pts, 3 estrellas = 1pt, menos = 0
  if (r.rating === 5) score += 5;
  else if (r.rating === 4) score += 3;
  else if (r.rating === 3) score += 1;
  // Tiene foto: +4
  if (r.image) score += 4;
  // Calidad del comentario por longitud
  const len = (r.comment || "").trim().length;
  if (len >= 150) score += 3;
  else if (len >= 80) score += 2;
  else if (len >= 30) score += 1;
  return score;
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════

export default function ReviewsSection({
  currentProductId,
  currentProductName,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "recent" | "highest" | "lowest" | "photo">("relevance");
  const [showStarsDropdown, setShowStarsDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [formProductId, setFormProductId] = useState(currentProductId || "");
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [formImage, setFormImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // ── Fetch reviews + stats ──
  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
    const params = activeFilter ? `?stars=${activeFilter}` : "";
    Promise.all([
      fetch(`${API_BASE}/api/v1/reviews${params}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/reviews/stats`).then((r) => r.json()),
    ])
      .then(([reviewsData, statsData]) => {
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFilter]);

  // ── Fetch products when form opens ──
  const handleOpenForm = () => {
    setShowForm(true);
    setSubmitted(false);
    if (products.length === 0) {
      fetch(`${API_BASE}/api/v1/products?limit=200`)
        .then((r) => r.json())
        .then((data) => {
          const list = data?.items ?? data;
          setProducts(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  };

  // ── Submit review ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formName || !formRating) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formProductId,
          name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          image: formImage || undefined,
        }),
      });
      setSubmitted(true);
      setFormName("");
      setFormComment("");
      setFormImage("");
      setFormRating(0);
    } catch {
      alert("Error al enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedReviews = useMemo(() => {
    setVisibleCount(INITIAL_COUNT);
    const copy = [...reviews];
    switch (sortBy) {
      case "relevance":
        return copy.sort((a, b) => relevanceScore(b) - relevanceScore(a));
      case "highest":
        return copy.sort(
          (a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt)
        );
      case "lowest":
        return copy.sort(
          (a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt)
        );
      case "photo":
        return copy.sort(
          (a, b) =>
            (b.image ? 1 : 0) - (a.image ? 1 : 0) ||
            +new Date(b.createdAt) - +new Date(a.createdAt)
        );
      default:
        return copy.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        );
    }
  }, [reviews, sortBy]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;

  if (loading) return null;
  if (!stats || !stats.total) return null;

  return (
    <section className="mt-16 mb-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">

      {/* Overlay para cerrar dropdowns al hacer click fuera */}
      {(showStarsDropdown || showSortDropdown) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowStarsDropdown(false); setShowSortDropdown(false); }} />
      )}

      {/* ═══ HEADER BAR ═══ */}
      <div className="flex items-center justify-between mb-6">

        {/* Left: estrellas + dropdown de filtro por estrellas */}
        <div className="flex items-center gap-3">
          <Stars rating={Math.round(stats.average)} size={18} />
          <div className="relative">
            <button
              onClick={() => { setShowStarsDropdown(v => !v); setShowSortDropdown(false); }}
              className="flex items-center gap-1 group"
            >
              <span className="text-sm font-semibold text-neutral-800 group-hover:underline underline-offset-2 transition-all flex items-center gap-1">
                {stats.total.toLocaleString()} Reseñas
                {activeFilter && <span className="ml-1 text-amber-500 flex items-center gap-0.5">· {activeFilter}<Star size={12} fill="currentColor" /></span>}
              </span>
              <ChevronDown size={14} className={`text-neutral-500 transition-transform ${showStarsDropdown ? "rotate-180" : ""}`} />
            </button>

            {showStarsDropdown && (
              <div className="absolute left-0 top-full mt-2 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Filtrar por estrellas</span>
                  {activeFilter && (
                    <button onClick={() => { setActiveFilter(null); setShowStarsDropdown(false); }} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                      <X size={11} /> Quitar
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.byRating[star] || 0;
                    const isActive = activeFilter === star;
                    return (
                      <button
                        key={star}
                        onClick={() => { setActiveFilter(isActive ? null : star); setShowStarsDropdown(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? "bg-neutral-900 text-white" : "hover:bg-neutral-50 text-neutral-700"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={10} fill={i <= star ? "currentColor" : "none"} className={i <= star ? "text-amber-400" : "text-neutral-300"} strokeWidth={i <= star ? 0 : 1.5} />
                          ))}
                        </div>
                        <span className="opacity-60">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: escribe reseña + dropdown ordenar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-300 hover:border-neutral-500 rounded-full px-3 py-2 sm:px-4 transition-colors"
          >
            <PenLine size={14} />
            <span className="hidden sm:inline">Escribe una reseña</span>
          </button>

          <div className="relative">
            <button
              onClick={() => { setShowSortDropdown(v => !v); setShowStarsDropdown(false); }}
              className={`p-2 rounded-full border transition-colors ${showSortDropdown || sortBy !== "relevance" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-500 hover:border-neutral-400"}`}
              aria-label="Ordenar reseñas"
            >
              <SlidersHorizontal size={15} />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 min-w-[180px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowDownUp size={11} className="text-neutral-400" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ordenar por</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {([
                    { key: "relevance", label: "Relevancia" },
                    { key: "recent",    label: "Más recientes" },
                    { key: "highest",   label: "Más altas" },
                    { key: "lowest",    label: "Más bajas" },
                    { key: "photo",     label: "Con foto" },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortDropdown(false); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${sortBy === key ? "bg-neutral-900 text-white" : "hover:bg-neutral-50 text-neutral-700"}`}
                    >
                      {label}
                      {sortBy === key && <span className="text-[10px] opacity-60">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MASONRY GRID — Social Feed Style ═══ */}
      {sortedReviews.length > 0 ? (
        <div className="columns-2 lg:columns-3 xl:columns-4 gap-3">
          {visibleReviews.map((review) => (
            <article
              key={review.id}
              className="break-inside-avoid mb-3 bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* ── Foto del cliente — altura natural (el efecto "desordenado") ── */}
              {review.image && (
                <button
                  onClick={() => setLightboxImg(review.image)}
                  className="w-full block cursor-zoom-in group/photo"
                  aria-label={`Ver foto de ${review.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImg(review.image, 600)}
                    alt={`Foto de ${review.name}`}
                    className={`w-full object-cover group-hover/photo:brightness-95 transition-all duration-300 ${imgAspect(review.id)}`}
                  />
                </button>
              )}

              {/* ── Contenido ── */}
              <div className="px-3.5 py-3">
                {/* Nombre + verificado + fecha en la misma fila */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-neutral-900 leading-tight">
                        {review.name}
                      </span>
                      <CheckCircle
                        size={13}
                        fill="currentColor"
                        className="text-emerald-500 flex-shrink-0"
                        strokeWidth={0}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Stars rating={review.rating} size={12} />
                </div>

                {/* Comentario */}
                {review.comment && (
                  <p className="text-[13px] text-neutral-700 leading-relaxed mb-2.5">
                    {review.comment}
                  </p>
                )}

                {/* Mini-tag de producto */}
                {review.product && (
                  <Link
                    href={`/product/${review.product.id}`}
                    className="flex items-center gap-2 group/prod"
                  >
                    {review.product.imageUrl ? (
                      <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 border border-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImg(review.product.imageUrl, 60)}
                          alt={review.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-neutral-400 text-[9px] font-bold">
                          JR
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] text-neutral-400 group-hover/prod:text-neutral-700 transition-colors line-clamp-1 leading-tight">
                      {review.product.name}
                    </span>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* ═══ VER MÁS ═══ */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => setVisibleCount(v => v + LOAD_MORE)}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
          >
            Ver más reseñas
          </button>
        </div>
      )}

      {sortedReviews.length === 0 && (
        <div className="text-center py-16">
          <Star size={36} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">
            No hay reseñas
            {activeFilter
              ? ` con ${activeFilter} estrella${activeFilter !== 1 ? "s" : ""}`
              : ""}
            .
          </p>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="mt-2 text-sm text-neutral-900 underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Ver todas
            </button>
          )}
        </div>
      )}


      {/* ═══ MODAL: Formulario ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle
                  size={48}
                  className="text-emerald-500 mx-auto mb-4"
                />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  ¡Gracias!
                </h3>
                <p className="text-sm text-neutral-500">
                  Tu reseña será revisada y publicada pronto.
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  className="mt-6 text-sm text-neutral-900 underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                  Escribe tu reseña
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Tu opinión será revisada antes de publicarse.
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Producto */}
                  <div>
                    <label
                      htmlFor="review-product"
                      className="block text-sm font-medium text-neutral-800 mb-1.5"
                    >
                      Producto comprado *
                    </label>
                    <select
                      id="review-product"
                      required
                      value={formProductId}
                      onChange={(e) => setFormProductId(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
                    >
                      <option value="">Seleccionar producto...</option>
                      {currentProductId && currentProductName && (
                        <option value={currentProductId}>
                          {currentProductName} (este producto)
                        </option>
                      )}
                      {products
                        .filter((p) => p.id !== currentProductId)
                        .map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label
                      htmlFor="review-name"
                      className="block text-sm font-medium text-neutral-800 mb-1.5"
                    >
                      Tu nombre *
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ej: Carlos M."
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all"
                    />
                  </div>

                  {/* Calificación */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-2">
                      Calificación *
                    </label>
                    <InteractiveStars
                      value={formRating}
                      onChange={setFormRating}
                    />
                  </div>

                  {/* Comentario */}
                  <div>
                    <label
                      htmlFor="review-comment"
                      className="block text-sm font-medium text-neutral-800 mb-1.5"
                    >
                      Tu opinión *
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={4}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Cuéntanos sobre tu experiencia con el producto..."
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all resize-none"
                    />
                  </div>

                  {/* Foto — Cloudinary */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                      Foto (opcional)
                    </label>
                    {formImage ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImg(formImage, 600)}
                          alt="Tu foto"
                          className="w-full h-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImage("")}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                          aria-label="Quitar foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <CldUploadWidget
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
                          "jerseys_raw_products"
                        }
                        options={{
                          folder: "jerseys-raw/reviews",
                          maxFiles: 1,
                          sources: ["local", "camera"],
                          resourceType: "image",
                          clientAllowedFormats: [
                            "jpg",
                            "jpeg",
                            "png",
                            "webp",
                          ],
                          maxFileSize: 5000000,
                        }}
                        onSuccess={(result: any) => {
                          const publicId = result?.info?.public_id;
                          if (publicId) setFormImage(publicId);
                        }}
                      >
                        {({ open }: { open: () => void }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors"
                          >
                            <Camera
                              size={22}
                              className="text-neutral-400 flex-shrink-0"
                            />
                            <div className="text-left">
                              <p className="text-sm text-neutral-700">
                                Sube una foto de tu jersey
                              </p>
                              <p className="text-xs text-neutral-400">
                                JPG, PNG — máx 5MB
                              </p>
                            </div>
                          </button>
                        )}
                      </CldUploadWidget>
                    )}
                  </div>

                  {/* Enviar */}
                  <button
                    type="submit"
                    disabled={submitting || !formRating}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white font-medium text-sm py-3.5 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {submitting ? "Enviando..." : "Enviar Reseña"}
                  </button>

                  <p className="text-[11px] text-neutral-400 text-center">
                    Al enviar, aceptas que tu reseña sea publicada con tu
                    nombre.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl w-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImg(lightboxImg, 1200)}
              alt="Foto del cliente"
              className="max-h-[90vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg(null);
              }}
              className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
              aria-label="Cerrar foto"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
