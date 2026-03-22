"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Star, Plus, Trash2, Loader2, CheckCircle, XCircle, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type StatusFilter = "all" | "pending" | "approved";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formProductId, setFormProductId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    };
    if (productDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [productDropdownOpen]);

  // Cargar reseñas y productos (independientemente)
  useEffect(() => {
    let done = 0;
    const check = () => { done++; if (done >= 2) setLoading(false); };

    api.get("/api/v1/admin/reviews", { auth: true })
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(check);

    api.get("/api/v1/products?limit=200")
      .then((data) => {
        const pList = data?.items ?? data?.products ?? data;
        setProducts(Array.isArray(pList) ? pList : []);
      })
      .catch(() => {})
      .finally(check);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p: any) => p.name?.toLowerCase().includes(q));
  }, [products, productSearch]);

  const selectedProduct = useMemo(
    () => products.find((p: any) => p.id === formProductId),
    [products, formProductId]
  );

  const pendingCount = useMemo(
    () => reviews.filter((r) => !r.verified).length,
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter === "pending") return !r.verified;
      if (statusFilter === "approved") return r.verified;
      return true;
    });
  }, [reviews, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formName) return;
    setSubmitting(true);

    try {
      const newReview = await api.post(
        `/api/v1/products/${formProductId}/reviews`,
        {
          name: formName,
          image: formImage || undefined,
          rating: formRating,
          comment: formComment,
          ...(formDate ? { createdAt: formDate } : {}),
        },
        { auth: true }
      );

      const product = products.find((p: any) => p.id === formProductId);
      setReviews((prev) => [
        { ...newReview, verified: true, product: product ? { id: product.id, name: product.name } : null },
        ...prev,
      ]);

      setFormName("");
      setFormComment("");
      setFormImage("");
      setFormRating(5);
      setFormDate("");
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || "Error al crear reseña");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/api/v1/admin/reviews/${id}/approve`, {}, { auth: true });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verified: true } : r))
      );
    } catch (err: any) {
      alert(err.message || "Error al aprobar");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/api/v1/admin/reviews/${id}/reject`, {}, { auth: true });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verified: false } : r))
      );
    } catch (err: any) {
      alert(err.message || "Error al rechazar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    try {
      await api.delete(`/api/v1/reviews/${id}`, { auth: true });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  if (loading) return <div className="p-10 text-slate-500 text-center">Cargando reseñas...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Admin</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">Reseñas</h1>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-500 text-white text-xs font-bold uppercase px-5 py-3 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Crear Reseña
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2">
        {([
          { key: "all", label: "Todas", count: reviews.length },
          { key: "pending", label: "Pendientes", count: pendingCount },
          { key: "approved", label: "Aprobadas", count: reviews.length - pendingCount },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === key
                ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold uppercase text-slate-500">Nueva Reseña</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Producto</label>
              <button
                type="button"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between focus:border-indigo-400 outline-none"
              >
                <span className={selectedProduct ? "text-slate-800" : "text-slate-400"}>
                  {selectedProduct?.name || "— Seleccionar producto —"}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {productDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-indigo-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400 text-center">Sin resultados</div>
                    ) : (
                      filteredProducts.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setFormProductId(p.id);
                            setProductDropdownOpen(false);
                            setProductSearch("");
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                            formProductId === p.id ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-700"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="María García"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
              />
            </div>
          </div>

          {/* Rating selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-400">Calificación:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || formRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Foto del Cliente (URL, opcional)</label>
            <input
              type="url"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://res.cloudinary.com/.../foto.jpg"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
            />
            {formImage && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Comentario</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              rows={3}
              placeholder="Excelente calidad, el jersey llegó perfecto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Fecha (opcional, para antedatar)</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:border-indigo-400 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-500 text-white font-bold uppercase text-sm px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? "Creando..." : "Crear Reseña"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm px-4 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de reseñas */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">
              {statusFilter === "pending"
                ? "Sin reseñas pendientes"
                : statusFilter === "approved"
                  ? "Sin reseñas aprobadas"
                  : "Sin reseñas"}
            </p>
            <p className="text-xs mt-1">
              {statusFilter === "all"
                ? "Crea reseñas manualmente para tus productos"
                : "Cambia el filtro para ver otras reseñas"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredReviews.map((review: any) => (
              <div key={review.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm flex-shrink-0">
                    {review.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800 text-sm">{review.name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                      {/* Badge de estado */}
                      {review.verified ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                          Aprobada
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs truncate max-w-md">{review.comment || "Sin comentario"}</p>
                    <p className="text-slate-300 text-[10px] mt-0.5">
                      {review.product?.name || "Producto desconocido"} •{" "}
                      {new Date(review.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!review.verified && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      title="Aprobar"
                      className="text-emerald-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {review.verified && (
                    <button
                      onClick={() => handleReject(review.id)}
                      title="Rechazar (ocultar)"
                      className="text-amber-400 hover:text-amber-600 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    title="Eliminar"
                    className="text-rose-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
