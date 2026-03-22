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

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? "currentColor" : "none"}
          className={i <= rating ? "text-amber-500" : "text-gray-300"}
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
              size={28}
              fill={active ? "currentColor" : "none"}
              className={active ? "text-amber-500" : "text-gray-300"}
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

/** Resuelve imagen: publicId de Cloudinary o URL completa */
function resolveImg(raw: string | undefined | null, w = 300): string {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return cldUrl(raw, { w, q: "auto" });
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
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest" | "photo">("recent");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [formProductId, setFormProductId] = useState(
    currentProductId || ""
  );
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [formImage, setFormImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Fetch reviews + stats
  useEffect(() => {
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

  // Fetch products when form opens
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

  // Submit review
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

  const maxRatingCount = stats
    ? Math.max(...Object.values(stats.byRating), 1)
    : 1;

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    switch (sortBy) {
      case "highest":
        return copy.sort((a, b) => b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
      case "lowest":
        return copy.sort((a, b) => a.rating - b.rating || +new Date(b.createdAt) - +new Date(a.createdAt));
      case "photo":
        return copy.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0) || +new Date(b.createdAt) - +new Date(a.createdAt));
      default: // recent
        return copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [reviews, sortBy]);

  if (loading) return null;
  if (!stats || stats.total === 0) return null;

  return (
    <section className="mt-16 mb-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">

      {/* ═══ HEADER BAR ═══ */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Stars rating={Math.round(stats.average)} size={20} />
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-1.5 text-th-primary hover:opacity-70 transition-opacity"
          >
            <span className="text-base font-medium">
              {stats.total.toLocaleString()} Reseñas
            </span>
            <ChevronDown size={16} className={`transition-transform ${showFilterPanel ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-800 transition-colors"
          >
            Escribe una reseña
          </button>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2.5 rounded-full border transition-colors ${
              showFilterPanel || activeFilter || sortBy !== "recent"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* ═══ FILTER PANEL (collapsible) ═══ */}
      {showFilterPanel && (
        <div className="mb-8 p-5 bg-neutral-50 rounded-2xl border border-neutral-200/60 space-y-5">
          {/* Filtro por estrellas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Filtrar por estrellas
              </span>
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  <X size={12} /> Quitar filtro
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.byRating[star] || 0;
                const isActive = activeFilter === star;
                return (
                  <button
                    key={star}
                    onClick={() => setActiveFilter(isActive ? null : star)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    <span>{star}</span>
                    <Star size={12} fill="currentColor" className={isActive ? "text-amber-400" : "text-amber-500"} strokeWidth={0} />
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ArrowDownUp size={13} className="text-neutral-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Ordenar por
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "recent", label: "Más recientes" },
                { key: "highest", label: "Más altas" },
                { key: "lowest", label: "Más bajas" },
                { key: "photo", label: "Con foto" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    sortBy === key
                      ? "bg-neutral-900 text-white"
                      : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MASONRY GRID ═══ */}
      {sortedReviews.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {sortedReviews.map((review) => (
            <article
              key={review.id}
              className="break-inside-avoid mb-4 bg-white rounded-2xl border border-neutral-200/60 overflow-hidden hover:shadow-lg hover:shadow-neutral-200/50 transition-shadow duration-300"
            >
              {/* Foto del cliente — prominente arriba */}
              {review.image && (
                <button
                  onClick={() => setLightboxImg(review.image)}
                  className="w-full relative cursor-zoom-in group/photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImg(review.image, 600)}
                    alt={`Foto de ${review.name}`}
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/10 transition-colors" />
                </button>
              )}

              {/* Contenido */}
              <div className="p-4">
                {/* Nombre + Verificada */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-neutral-900 text-sm">
                    {review.name}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle size={14} fill="currentColor" className="text-emerald-500" strokeWidth={0} />
                    <span className="text-xs font-medium text-emerald-600">Verificada</span>
                  </span>
                </div>

                {/* Fecha */}
                <p className="text-xs text-neutral-400 mb-2">
                  {new Date(review.createdAt).toLocaleDateString("es-MX")}
                </p>

                {/* Estrellas */}
                <div className="mb-2">
                  <Stars rating={review.rating} size={14} />
                </div>

                {/* Comentario */}
                {review.comment && (
                  <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                    {review.comment}
                  </p>
                )}

                {/* Mini-card del producto */}
                {review.product && (
                  <Link
                    href={`/product/${review.product.id}`}
                    className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors group/prod"
                  >
                    {review.product.imageUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-neutral-200/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImg(review.product.imageUrl, 80)}
                          alt={review.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-neutral-400 text-xs font-bold">JR</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-neutral-700 group-hover/prod:text-neutral-900 transition-colors line-clamp-2 leading-tight">
                      {review.product.name}
                    </span>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Star size={40} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-500">
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

      {/* ═══ FLOATING CTA — Mobile ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-40">
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-2 bg-neutral-900 text-white font-medium text-sm py-3 px-7 rounded-full shadow-2xl hover:bg-neutral-800 transition-colors"
        >
          <PenLine size={15} />
          Escribe una reseña
        </button>
      </div>

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
                    <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                      Producto comprado *
                    </label>
                    <select
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
                    <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                      Tu nombre *
                    </label>
                    <input
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
                    <label className="block text-sm font-medium text-neutral-800 mb-1.5">
                      Tu opinión *
                    </label>
                    <textarea
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
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formImage}
                          alt="Tu foto"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImage("")}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <CldUploadWidget
                        uploadPreset={
                          process.env
                            .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
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
                          const url = result?.info?.secure_url;
                          if (url) setFormImage(url);
                        }}
                      >
                        {({ open }: { open: () => void }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors"
                          >
                            <Camera
                              size={24}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImg(lightboxImg, 1200)}
              alt="Foto del cliente"
              className="w-full rounded-xl shadow-2xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg(null);
              }}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
