"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Tag, Search, ChevronLeft, ChevronRight, Shield, Plus, Trash2, Check, Star } from "lucide-react";
import Link from "next/link";
import ImageUploadWidget from "@/components/admin/ImageUploadWidget";
import { api } from "@/lib/api";

const GENDER_OPTIONS = [
  { value: "HOMBRE", label: "Hombre" },
  { value: "MUJER",  label: "Mujer" },
  { value: "NINO",   label: "Niño" },
  { value: "UNISEX", label: "Unisex" },
];
const COLOR_OPTIONS = ["Rojo", "Azul", "Blanco", "Negro", "Amarillo", "Verde", "Rosa", "Naranja", "Morado", "Gris"];

interface VariantRow {
  id: string;
  size: string;
  sleeve: string;
  isPlayerVersion: boolean;
  hasLeaguePatch: boolean;
  hasChampionsPatch: boolean;
  stock: number;
  isDropshippable: boolean;
  allowsNameNumber: boolean;
  customizationPrice: number;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  // Reference data
  const [clubs,      setClubs]      = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [seasons,    setSeasons]    = useState<any[]>([]);
  const [tags,       setTags]       = useState<any[]>([]);

  // Club filtering
  const [clubSearch,     setClubSearch]     = useState("");
  const [clubPage,       setClubPage]       = useState(1);
  const [selectedLeague, setSelectedLeague] = useState("");
  const CLUBS_PER_PAGE = 6;

  // Tag filtering
  const [tagSearch, setTagSearch] = useState("");
  const [tagPage,   setTagPage]   = useState(1);
  const TAGS_PER_PAGE = 8;

  // Global selectors
  const [globalGenders, setGlobalGenders] = useState<string[]>(["HOMBRE"]);
  const [globalColors,  setGlobalColors]  = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name:                  "",
    slug:                  "",
    price:                 "",
    compareAtPrice:        "",
    imageUrl:              "",
    images:                [] as string[],
    description:           "",
    brand:                 "",
    categoryId:            "",
    seasonId:              "",
    clubId:                "",
    tagIds:                [] as string[],
    globalAllowsNameNumber: true,
    earnPoints:            true,
    redeemMaxQty:          "" as string,
  });

  const [variants, setVariants] = useState<VariantRow[]>([]);

  // ─── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/api/v1/clubs?limit=200').catch(() => ({ items: [] })),
      api.get('/api/v1/tags').catch(() => []),
      api.get('/api/v1/categories').catch(() => []),
      api.get('/api/v1/seasons').catch(() => []),
      api.get(`/api/v1/products/${params.id}`),
    ]).then(([clubsData, tagsData, catsData, seasonsData, product]) => {
      setClubs(clubsData.items || (Array.isArray(clubsData) ? clubsData : []));
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setSeasons(Array.isArray(seasonsData) ? seasonsData : []);

      setGlobalGenders([product.gender || "HOMBRE"]);
      const variantColors = [...new Set(
        (product.variants || []).map((v: any) => v.color).filter(Boolean)
      )] as string[];
      setGlobalColors(variantColors);

      setFormData({
        name:           product.name || "",
        slug:           product.slug || "",
        price:          product.price ? product.price.toString() : "",
        compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : "",
        imageUrl:       product.imageUrl || "",
        images:         product.images?.length > 0
          ? product.images.map((img: any) => img.url)
          : product.imageUrl ? [product.imageUrl] : [],
        description:    product.description || "",
        brand:          product.brand || "",
        categoryId:     product.categoryId || "",
        seasonId:       product.seasonId || "",
        clubId:         product.clubId || "",
        tagIds:         product.tagIds || [],
        globalAllowsNameNumber: product.variants?.length > 0
          ? product.variants.every((v: any) => v.allowsNameNumber)
          : true,
        earnPoints:   product.earnPoints ?? true,
        redeemMaxQty: product.redeemMaxQty != null ? String(product.redeemMaxQty) : "",
      });

      if (product.variants?.length > 0) {
        setVariants(product.variants.map((v: any) => ({
          id:                 v.id || `${Date.now()}-${Math.random()}`,
          size:               v.size || "M",
          sleeve:             v.sleeve || "SHORT",
          isPlayerVersion:    v.isPlayerVersion ?? false,
          hasLeaguePatch:     v.hasLeaguePatch ?? false,
          hasChampionsPatch:  v.hasChampionsPatch ?? false,
          stock:              v.stock ?? 0,
          isDropshippable:    v.isDropshippable ?? true,
          allowsNameNumber:   v.allowsNameNumber ?? true,
          customizationPrice: v.customizationPrice ? v.customizationPrice / 100 : 50,
        })));
      }

      setPageLoading(false);
    }).catch((err) => {
      setError(err.message);
      setPageLoading(false);
    });
  }, [params.id]);

  // ─── Club/tag memos ───────────────────────────────────────────────────────────
  const leaguesData = useMemo(() => {
    const map = new Map<string, number>();
    clubs.forEach(c => {
      const name = c.league?.name;
      if (name) map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [clubs]);

  const filteredClubs = useMemo(() => clubs.filter(c => {
    const matchSearch  = c.name.toLowerCase().includes(clubSearch.toLowerCase());
    const matchLeague  = selectedLeague ? c.league?.name === selectedLeague : true;
    return matchSearch && matchLeague;
  }), [clubs, clubSearch, selectedLeague]);

  const totalClubPages  = Math.ceil(filteredClubs.length / CLUBS_PER_PAGE);
  const displayedClubs  = filteredClubs.slice((clubPage - 1) * CLUBS_PER_PAGE, clubPage * CLUBS_PER_PAGE);
  useEffect(() => { setClubPage(1); }, [clubSearch, selectedLeague]);

  const filteredTags   = useMemo(() => tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())), [tags, tagSearch]);
  const totalTagPages  = Math.ceil(filteredTags.length / TAGS_PER_PAGE);
  const displayedTags  = filteredTags.slice((tagPage - 1) * TAGS_PER_PAGE, tagPage * TAGS_PER_PAGE);
  useEffect(() => { setTagPage(1); }, [tagSearch]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const toggleGlobal = (arr: string[], val: string, setter: (v: string[]) => void) =>
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const handleAddVariant = () => setVariants([...variants, {
    id:                Date.now().toString(),
    size:              "M",
    sleeve:            "SHORT",
    isPlayerVersion:   false,
    hasLeaguePatch:    false,
    hasChampionsPatch: false,
    stock:             1,
    isDropshippable:   true,
    allowsNameNumber:  formData.globalAllowsNameNumber,
    customizationPrice: 50,
  }]);

  const handleRemoveVariant  = (id: string) => setVariants(variants.filter(v => v.id !== id));
  const handleVariantChange  = (id: string, field: string, value: any) =>
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  const handleTagChange = (tagId: string) =>
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));

  // ─── Submit (PUT) ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const globalPriceCents     = Math.round(parseFloat(formData.price) * 100);
      const globalCompareAtCents = formData.compareAtPrice
        ? Math.round(parseFloat(formData.compareAtPrice) * 100)
        : null;

      const payload: any = {
        ...formData,
        gender:         globalGenders[0] || "HOMBRE",
        price:          parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        images:         formData.images,
        clubId:         formData.clubId || null,
        categoryId:     formData.categoryId || undefined,
        seasonId:       formData.seasonId || undefined,
        earnPoints:     formData.earnPoints,
        redeemMaxQty:   formData.redeemMaxQty === "" ? null : parseInt(formData.redeemMaxQty as string),
      };

      payload.variants = variants.map(v => ({
        size:                v.size,
        color:               globalColors[0] || undefined,
        sleeve:              v.sleeve || "SHORT",
        isPlayerVersion:     v.isPlayerVersion,
        hasLeaguePatch:      v.hasLeaguePatch,
        hasChampionsPatch:   v.hasChampionsPatch,
        stock:               v.stock,
        priceCents:          globalPriceCents,
        compareAtPriceCents: globalCompareAtCents ?? undefined,
        isDropshippable:     v.isDropshippable,
        allowsNameNumber:    formData.globalAllowsNameNumber ? v.allowsNameNumber : false,
        customizationPrice:  formData.globalAllowsNameNumber
          ? Math.round(Number(v.customizationPrice) * 100)
          : 0,
      }));

      await api.put(`/api/v1/products/${params.id}`, payload, { auth: true });

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

  if (pageLoading) return <div className="p-10 text-slate-500 text-center">Cargando producto...</div>;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Editar</p>
          <h1 className="text-3xl font-black uppercase italic text-slate-800">Editar Producto</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-mono">ID: {params.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="md:col-span-2 space-y-6">

          {/* Info básica */}
          <div className="bg-white border border-slate-100 p-6 rounded-xl space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nombre</label>
              <input type="text" required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Slug</label>
              <input type="text" required value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-400 text-sm font-mono focus:border-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Descripción</label>
              <textarea rows={4} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none resize-none" />
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white border border-slate-100 p-6 rounded-xl grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Precio Final</label>
              <input type="number" required step="0.01" value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Precio Antes</label>
              <input type="number" step="0.01" value={formData.compareAtPrice}
                onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none" />
            </div>
          </div>

          {/* Género & Color */}
          <div className="bg-white border border-slate-100 p-6 rounded-xl space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-3">Género</label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map(g => (
                  <button key={g.value} type="button"
                    onClick={() => toggleGlobal(globalGenders, g.value, setGlobalGenders)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase border transition-all flex items-center gap-1.5 ${
                      globalGenders.includes(g.value)
                        ? "bg-indigo-500 text-white border-indigo-400"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}>
                    {globalGenders.includes(g.value) && <Check className="w-3 h-3" />}
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-3">Color del producto</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button"
                    onClick={() => toggleGlobal(globalColors, c, setGlobalColors)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      globalColors.includes(c)
                        ? "bg-slate-800 text-white border-slate-700"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}>
                    {globalColors.includes(c) && <Check className="w-3 h-3" />}
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Club + Tags + Campos */}
          <div className="bg-white border border-slate-100 p-6 rounded-xl space-y-8">

            {/* Club selector */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-500 mb-3">
                <Shield className="w-4 h-4" /> Asignar Equipo (Club)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                <button type="button" onClick={() => setSelectedLeague("")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors border ${
                    selectedLeague === ""
                      ? "bg-indigo-500 text-white border-indigo-400"
                      : "bg-transparent text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  }`}>
                  Todas ({clubs.length})
                </button>
                {leaguesData.map(([name, count]) => (
                  <button key={name} type="button" onClick={() => setSelectedLeague(name)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors border ${
                      selectedLeague === name
                        ? "bg-indigo-500 text-white border-indigo-400"
                        : "bg-transparent text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                    }`}>
                    {name} <span className="opacity-60 ml-1">({count})</span>
                  </button>
                ))}
              </div>
              <div className="relative mb-3">
                <input type="text" placeholder={`Buscar en ${selectedLeague || "todos"}...`}
                  value={clubSearch} onChange={e => setClubSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-xs text-slate-800 focus:border-indigo-400 outline-none" />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 min-h-[100px] content-start">
                {selectedLeague === "" && (
                  <div onClick={() => setFormData({ ...formData, clubId: "" })}
                    className={`p-3 rounded border cursor-pointer transition-all text-xs text-center flex items-center justify-center ${
                      formData.clubId === ""
                        ? "border-indigo-400 bg-indigo-500/10 text-slate-800 font-bold"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}>
                    Sin Equipo / General
                  </div>
                )}
                {displayedClubs.map(club => (
                  <div key={club.id} onClick={() => setFormData({ ...formData, clubId: club.id })}
                    className={`p-3 rounded border cursor-pointer transition-all text-xs truncate ${
                      formData.clubId === club.id
                        ? "border-indigo-400 bg-indigo-500/10 text-slate-800 font-bold"
                        : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`} title={club.name}>
                    {club.name}
                  </div>
                ))}
                {displayedClubs.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-slate-500 text-xs italic border border-dashed border-slate-200 rounded">
                    No se encontraron equipos en esta liga.
                  </div>
                )}
              </div>
              {totalClubPages > 1 && (
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <button type="button" onClick={() => setClubPage(p => Math.max(1, p - 1))} disabled={clubPage === 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                  <span className="text-[10px] text-slate-400">{clubPage} / {totalClubPages}</span>
                  <button type="button" onClick={() => setClubPage(p => Math.min(totalClubPages, p + 1))} disabled={clubPage === totalClubPages} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                </div>
              )}
            </div>

            {/* Tag selector */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-500 mb-3">
                <Tag className="w-4 h-4" /> Etiquetas / Estilos
              </label>
              <div className="relative mb-3">
                <input type="text" placeholder="Buscar etiquetas..." value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-xs text-slate-800 focus:border-indigo-400 outline-none" />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 min-h-[100px] content-start">
                {displayedTags.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-100 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-500/10 h-fit">
                    <input type="checkbox" className="accent-indigo-500"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)} />
                    <span className="text-xs text-slate-600 select-none truncate" title={tag.name}>{tag.name}</span>
                  </label>
                ))}
              </div>
              {totalTagPages > 1 && (
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <button type="button" onClick={() => setTagPage(p => Math.max(1, p - 1))} disabled={tagPage === 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                  <span className="text-[10px] text-slate-400">{tagPage} / {totalTagPages}</span>
                  <button type="button" onClick={() => setTagPage(p => Math.min(totalTagPages, p + 1))} disabled={tagPage === totalTagPages} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                </div>
              )}
              <div className="mt-2 text-right">
                <p className="text-[10px] text-slate-500">Tags seleccionados: <span className="text-indigo-500 font-bold">{formData.tagIds.length}</span></p>
              </div>
            </div>

            {/* Marca / Categoría / Temporada */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Marca</label>
                <input type="text" value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 focus:border-indigo-400 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Categoría</label>
                <select value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-xs focus:border-indigo-400 outline-none">
                  <option value="">Selecciona Categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Temporada (Opcional)</label>
                <select value={formData.seasonId}
                  onChange={e => setFormData({ ...formData, seasonId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-xs focus:border-indigo-400 outline-none">
                  <option value="">Ninguna / Atemporal</option>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.code} ({s.startYear}-{s.endYear})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Jersey Personalizable */}
          <div className="bg-white border border-indigo-400/20 p-6 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-indigo-500 font-bold uppercase mb-1">Jersey Personalizable</h3>
              <p className="text-slate-500 text-xs text-balance">Habilita esta opción si quieres permitir estampar un nombre y número en las playeras.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.globalAllowsNameNumber}
                onChange={e => setFormData({ ...formData, globalAllowsNameNumber: e.target.checked })}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* Recompensas */}
          <div className="bg-white border border-amber-400/20 p-6 rounded-xl space-y-4">
            <h3 className="text-amber-600 font-bold uppercase flex items-center gap-2">
              <Star className="w-4 h-4 fill-current" /> Recompensas
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Acumula puntos al comprar</p>
                <p className="text-xs text-slate-400">¿Esta compra genera puntos de recompensa?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.earnPoints}
                  onChange={e => setFormData({ ...formData, earnPoints: e.target.checked })}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Máx. unidades canjeables con puntos</label>
              <input type="number" min={0} value={formData.redeemMaxQty}
                onChange={e => setFormData({ ...formData, redeemMaxQty: e.target.value })}
                placeholder="Vacío = sin límite | 0 = no canjeable | 1 = máx 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-sm focus:border-amber-400 outline-none" />
              <p className="text-xs text-slate-400 mt-1">Vacío = ilimitado (jerseys). 1 = max 1 con puntos (llaveros, balones).</p>
            </div>
          </div>

          {/* Variantes */}
          <div className="bg-white border border-slate-100 p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-slate-800 font-bold uppercase">Variantes del Producto</h3>
                <p className="text-slate-500 text-xs">Stock local, envío y personalización por talla.</p>
              </div>
              <button type="button" onClick={handleAddVariant}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Agregar Variante
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm">Sin variantes — solo dropshipping / catálogo</p>
                <p className="text-xs mt-1">No habrá stock local ni puntos verdes en la tienda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((v, index) => (
                  <div key={v.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 bg-indigo-500/20 text-indigo-500 px-2 py-1 text-[10px] font-black uppercase rounded-br-lg">
                      Var {index + 1}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Talla</label>
                        <select value={v.size} onChange={e => handleVariantChange(v.id, "size", e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-2 text-xs text-slate-800 focus:border-indigo-400 outline-none">
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                          <option value="2XL">2XL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Versión</label>
                        <select value={v.isPlayerVersion ? 'player' : 'fan'}
                          onChange={e => handleVariantChange(v.id, "isPlayerVersion", e.target.value === 'player')}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-2 text-xs text-slate-800 focus:border-indigo-400 outline-none">
                          <option value="fan">Fan</option>
                          <option value="player">Player</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Corte</label>
                        <select value={v.sleeve} onChange={e => handleVariantChange(v.id, "sleeve", e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-2 text-xs text-slate-800 focus:border-indigo-400 outline-none">
                          <option value="SHORT">Manga Corta</option>
                          <option value="LONG">Manga Larga</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Parches</label>
                        <select
                          value={v.hasLeaguePatch ? 'league' : v.hasChampionsPatch ? 'champions' : 'none'}
                          onChange={e => {
                            const val = e.target.value;
                            handleVariantChange(v.id, "hasLeaguePatch",    val === 'league');
                            handleVariantChange(v.id, "hasChampionsPatch", val === 'champions');
                          }}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-2 text-xs text-slate-800 focus:border-indigo-400 outline-none">
                          <option value="none">Sin Parches</option>
                          <option value="league">Liga</option>
                          <option value="champions">Champions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Stock Local</label>
                        <input type="number" min="0" value={v.stock}
                          onChange={e => handleVariantChange(v.id, "stock", parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-2 text-xs text-slate-800 focus:border-indigo-400 outline-none" />
                      </div>
                      <div className="col-span-2 flex items-center justify-between bg-slate-50 px-3 py-2 rounded border border-slate-100">
                        <label className="text-xs text-slate-600 font-bold">¿Permite Dropshipping?</label>
                        <input type="checkbox" checked={v.isDropshippable}
                          onChange={e => handleVariantChange(v.id, "isDropshippable", e.target.checked)}
                          className="w-4 h-4 accent-indigo-500" />
                      </div>
                      {formData.globalAllowsNameNumber && (
                        <div className="col-span-2 flex flex-col gap-2 bg-indigo-500/5 px-3 py-2 rounded border border-indigo-400/20">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-indigo-500 font-bold truncate">Personalizable (Variante)</label>
                            <input type="checkbox" checked={v.allowsNameNumber}
                              onChange={e => handleVariantChange(v.id, "allowsNameNumber", e.target.checked)}
                              className="w-4 h-4 accent-indigo-500 flex-shrink-0" />
                          </div>
                          {v.allowsNameNumber && (
                            <div className="flex items-center gap-2 mt-1 border-t border-slate-100 pt-2">
                              <label className="text-[10px] text-slate-500 uppercase font-bold">Costo Extra ($ MXN):</label>
                              <input type="number" min="0" value={v.customizationPrice}
                                onChange={e => handleVariantChange(v.id, "customizationPrice", parseInt(e.target.value) || 0)}
                                className="w-20 bg-white border border-indigo-400/30 text-slate-800 text-xs px-2 py-1 rounded outline-none focus:border-indigo-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => handleRemoveVariant(v.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar Variante">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-xl flex flex-col items-center space-y-4">
            <div className="w-full text-left mb-1">
              <p className="text-xs font-bold uppercase text-slate-500">Foto del Jersey</p>
              <p className="text-[10px] text-slate-400 mt-0.5">La imagen se sube directamente a Cloudinary — optimizada y lista para la tienda.</p>
            </div>
            <ImageUploadWidget
              images={formData.images}
              onChange={(newImages) => setFormData(prev => ({ ...prev, images: newImages, imageUrl: newImages[0] || "" }))}
            />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-indigo-500 text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Guardando..." : "Actualizar Cambios"}
          </button>

          {error && <p className="text-rose-500 text-xs text-center bg-rose-50 p-3 rounded-xl">{error}</p>}
        </div>

      </form>
    </div>
  );
}
