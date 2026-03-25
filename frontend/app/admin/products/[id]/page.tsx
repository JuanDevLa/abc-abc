"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, Loader2, Plus, Trash2, Package, Zap, Truck, Palette, Star } from "lucide-react";
import Link from "next/link";
import ImageUploadWidget from "@/components/admin/ImageUploadWidget";
import { api } from "@/lib/api";

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "2XL"];
const AVAILABLE_COLORS = ["Rojo", "Azul", "Blanco", "Negro", "Amarillo"];

interface VariantRow {
  size: string;
  color: string;
  sleeve: string;
  isPlayerVersion: boolean;
  hasLeaguePatch: boolean;
  hasChampionsPatch: boolean;
  stock: number;
  priceCents: number;
  compareAtPriceCents: number;
  isDropshippable: boolean;
  allowsNameNumber: boolean;
  customizationPrice: number;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    price: "",
    compareAtPrice: "",
    imageUrl: "",
    images: [] as string[],
    description: "",
    brand: "",
    gender: "HOMBRE",
    categoryId: "",
    globalAllowsNameNumber: true,
    earnPoints: true,
    redeemMaxQty: "" as string,
  });

  const [variants, setVariants] = useState<VariantRow[]>([]);

  // 1. CARGAR DATOS
  useEffect(() => {
    api.get(`/api/v1/products/${params.id}`)
      .then((data) => {
        setFormData({
          name: data.name || "",
          slug: data.slug || "",
          price: data.price ? data.price.toString() : "",
          compareAtPrice: data.compareAtPrice ? data.compareAtPrice.toString() : "",
          imageUrl: data.imageUrl || "",
          images: data.images?.length > 0
            ? data.images.map((img: any) => img.url)
            : data.imageUrl ? [data.imageUrl] : [],
          description: data.description || "",
          brand: data.brand || "",
          gender: data.gender || "HOMBRE",
          categoryId: data.categoryId || "",
          globalAllowsNameNumber: data.variants?.length > 0
            ? data.variants.every((v: any) => v.allowsNameNumber)
            : true,
          earnPoints: data.earnPoints ?? true,
          redeemMaxQty: data.redeemMaxQty != null ? String(data.redeemMaxQty) : "",
        });

        // Cargar variantes existentes
        if (data.variants && data.variants.length > 0) {
          setVariants(data.variants.map((v: any) => ({
            size: v.size || "M",
            color: v.color || "",
            sleeve: v.sleeve || "SHORT",
            isPlayerVersion: v.isPlayerVersion ?? false,
            hasLeaguePatch: v.hasLeaguePatch ?? false,
            hasChampionsPatch: v.hasChampionsPatch ?? false,
            stock: v.stock || 0,
            priceCents: v.priceCents || 0,
            compareAtPriceCents: v.compareAtPriceCents || 0,
            isDropshippable: v.isDropshippable ?? true,
            allowsNameNumber: v.allowsNameNumber ?? true,
            customizationPrice: v.customizationPrice || 19900,
          })));
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  // VARIANTES HANDLERS
  const addVariant = () => {
    setVariants([...variants, {
      size: "M",
      color: "",
      sleeve: "SHORT",
      isPlayerVersion: false,
      hasLeaguePatch: false,
      hasChampionsPatch: false,
      stock: 0,
      priceCents: parseFloat(formData.price || "0") * 100,
      compareAtPriceCents: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) * 100 : 0,
      isDropshippable: true,
      allowsNameNumber: formData.globalAllowsNameNumber,
      customizationPrice: 19900,
    }]);
  };

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: any) => {
    const updated = [...variants];
    (updated[idx] as any)[field] = value;
    setVariants(updated);
  };

  // 2. ACTUALIZAR (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        images: formData.images,
        earnPoints: formData.earnPoints,
        redeemMaxQty: formData.redeemMaxQty === "" ? null : parseInt(formData.redeemMaxQty as string),
      };

      // Precios globales en centavos (lo que el usuario escribió en las cajas de cabecera)
      const globalPriceCents = Math.round(parseFloat(formData.price) * 100);
      const globalCompareAtCents = formData.compareAtPrice
        ? Math.round(parseFloat(formData.compareAtPrice) * 100)
        : null;

      // Incluir variantes si existen
      if (variants.length > 0) {
        payload.variants = variants.map(v => ({
          size: v.size,
          color: v.color || undefined,
          sleeve: v.sleeve || 'SHORT',
          isPlayerVersion: v.isPlayerVersion,
          hasLeaguePatch: v.hasLeaguePatch,
          hasChampionsPatch: v.hasChampionsPatch,
          stock: v.stock,
          // Siempre sincronizar precio con el valor global de cabecera
          priceCents: globalPriceCents,
          compareAtPriceCents: globalCompareAtCents ?? (v.compareAtPriceCents || undefined),
          isDropshippable: v.isDropshippable,
          allowsNameNumber: formData.globalAllowsNameNumber ? v.allowsNameNumber : false,
          customizationPrice: v.customizationPrice,
        }));
      }

      const res = await api.put(`/api/v1/products/${params.id}`, payload, { auth: true });
      // api.put already throws on !ok

      // Revalidate the cache on the server (admin + public product pages)
      await fetch(
        `/api/revalidate?path=/admin/products&path=/product/${params.id}&path=/product/${formData.slug}`,
        { method: 'POST' }
      ).catch(() => {});

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-slate-500 text-center">Cargando producto...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Editar</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Editar Producto</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-mono">ID: {params.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA */}
        <div className="md:col-span-2 space-y-6">

          {/* Bloque 1: Info Básica */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Slug</label>
              <input type="text" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-mono text-sm focus:border-indigo-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descripción</label>
              <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none resize-none transition-all" />
            </div>
          </div>

          {/* Bloque 2: Precios */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Precio Final</label>
              <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Precio Antes</label>
              <input type="number" step="0.01" value={formData.compareAtPrice} onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none transition-all" />
            </div>
          </div>

          {/* Bloque 3: Detalles */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Marca</label>
              <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Género</label>
              <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none appearance-none transition-all">
                <option value="HOMBRE">Hombre</option>
                <option value="MUJER">Mujer</option>
                <option value="NINO">Niño</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">ID Categoría</label>
              <input type="text" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono text-xs focus:border-indigo-400 outline-none transition-all" />
            </div>
          </div>

          {/* ========== BLOQUE 4: JERSEY PERSONALIZABLE ========== */}
          <div className="bg-white border border-indigo-100 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-700 font-bold text-sm uppercase tracking-wider">Jersey Personalizable</h3>
                <p className="text-slate-400 text-xs mt-1">Controla si este producto permite personalización (nombre y número)</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, globalAllowsNameNumber: !formData.globalAllowsNameNumber })}
                className={`relative w-14 h-7 rounded-full transition-colors ${formData.globalAllowsNameNumber ? 'bg-indigo-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${formData.globalAllowsNameNumber ? 'translate-x-7' : ''}`} />
              </button>
            </div>
            {!formData.globalAllowsNameNumber && (
              <p className="text-rose-500 text-xs mt-3 bg-rose-50 p-2 rounded-lg">⚠️ La personalización estará deshabilitada para todas las variantes de este producto.</p>
            )}
          </div>

          {/* ========== BLOQUE: RECOMPENSAS ========== */}
          <div className="bg-white border border-amber-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-amber-600 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" /> Recompensas
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Acumula puntos al comprar</p>
                <p className="text-xs text-slate-400">¿Esta compra genera puntos de recompensa?</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, earnPoints: !formData.earnPoints })}
                className={`relative w-14 h-7 rounded-full transition-colors ${formData.earnPoints ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${formData.earnPoints ? 'translate-x-7' : ''}`} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Máx. unidades canjeables con puntos</label>
              <input
                type="number"
                min={0}
                value={formData.redeemMaxQty}
                onChange={(e) => setFormData({ ...formData, redeemMaxQty: e.target.value })}
                placeholder="Vacío = sin límite | 0 = no canjeable | 1 = máx 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-sm focus:border-amber-400 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">Vacío = ilimitado (jerseys). 1 = máx 1 con puntos (llaveros, balones).</p>
            </div>
          </div>

          {/* ========== BLOQUE 5: VARIANTES DEL PRODUCTO ========== */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Variantes del Producto</h3>
                <p className="text-slate-400 text-xs mt-1">Stock, envío y personalización por talla</p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 bg-indigo-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm">No hay variantes configuradas</p>
                <p className="text-xs mt-1">Agrega variantes para controlar stock y envío por talla</p>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Talla</label>
                        <select value={v.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none">
                          {AVAILABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Versión</label>
                        <select value={v.isPlayerVersion ? 'player' : 'fan'} onChange={e => updateVariant(idx, 'isPlayerVersion', e.target.value === 'player')} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none">
                          <option value="fan">Fan</option>
                          <option value="player">Player</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Corte</label>
                        <select value={v.sleeve} onChange={e => updateVariant(idx, 'sleeve', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none">
                          <option value="SHORT">Manga Corta</option>
                          <option value="LONG">Manga Larga</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Stock Local</label>
                        <input type="number" min="0" value={v.stock} onChange={e => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none" />
                      </div>
                    </div>

                    {/* Fila 2: Parches, Color, Precio, Precio Antes */}
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Parches</label>
                        <select
                          value={v.hasLeaguePatch ? 'league' : v.hasChampionsPatch ? 'champions' : 'none'}
                          onChange={e => {
                            const val = e.target.value;
                            updateVariant(idx, 'hasLeaguePatch', val === 'league');
                            updateVariant(idx, 'hasChampionsPatch', val === 'champions');
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none"
                        >
                          <option value="none">Sin Parches</option>
                          <option value="league">Liga</option>
                          <option value="champions">Champions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Color</label>
                        <select value={v.color} onChange={e => updateVariant(idx, 'color', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none">
                          <option value="">— Ninguno —</option>
                          {AVAILABLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Precio ($)</label>
                        <input type="number" step="0.01" min="0" value={v.priceCents / 100} onChange={e => updateVariant(idx, 'priceCents', Math.round(parseFloat(e.target.value) * 100) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Precio Antes ($)</label>
                        <input type="number" step="0.01" min="0" value={(v.compareAtPriceCents || 0) / 100} onChange={e => updateVariant(idx, 'compareAtPriceCents', Math.round(parseFloat(e.target.value) * 100) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 text-sm focus:border-indigo-400 outline-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={v.isDropshippable}
                            onChange={e => updateVariant(idx, 'isDropshippable', e.target.checked)}
                            className="w-4 h-4 rounded accent-indigo-500"
                          />
                          <span>Dropshipping</span>
                        </label>
                        {formData.globalAllowsNameNumber && (
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={v.allowsNameNumber}
                              onChange={e => updateVariant(idx, 'allowsNameNumber', e.target.checked)}
                              className="w-4 h-4 rounded accent-indigo-500"
                            />
                            <span>Personalizable</span>
                          </label>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors"
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

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          {/* ---- IMAGEN DEL PRODUCTO (Cloudinary) ---- */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Foto del Jersey</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sube una nueva foto para reemplazar la actual.</p>
            </div>
            <ImageUploadWidget
              images={formData.images}
              onChange={(newImages) => {
                setFormData(prev => ({ ...prev, images: newImages, imageUrl: newImages[0] || "" }));
              }}
            />
          </div>

          {/* Resumen de Variantes */}
          {variants.length > 0 && (
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Resumen</h4>
              <div className="text-xs text-slate-500 space-y-2">
                <p className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-slate-400" /> <strong className="text-slate-700">{variants.length}</strong> variantes</p>
                <p className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-emerald-500" /> <strong className="text-emerald-500">{variants.filter(v => v.stock > 0).length}</strong> con stock</p>
                <p className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-slate-400" /> <strong className="text-slate-700">{variants.filter(v => v.stock === 0 && v.isDropshippable).length}</strong> dropshipping</p>
                <p className="flex items-center gap-2"><Palette className="w-3.5 h-3.5 text-indigo-500" /> <strong className="text-indigo-500">{formData.globalAllowsNameNumber ? 'Sí' : 'No'}</strong> personalizable</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="w-full bg-indigo-500 text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Guardando..." : "Actualizar Cambios"}
          </button>

          {error && <p className="text-rose-500 text-xs text-center bg-rose-50 p-3 rounded-xl">{error}</p>}
        </div>
      </form>
    </div>
  );
}