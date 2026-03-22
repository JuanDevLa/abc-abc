"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Share2, Star, Truck, ShieldCheck, Ruler, ZoomIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { getDeliveryDates } from "@/lib/shipping";
import ReviewsSection from "@/components/store/ReviewsSection";
import { useCartStore } from "@/app/store/cartStore";
import ProductSkeleton from "@/components/store/ProductSkeleton";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Props {
  productId: string;
  initialProduct: any; // Pre-fetched desde el Server Component
}

export default function ProductDetailClient({ productId, initialProduct }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const initVariants: any[] = initialProduct?.variants || [];
    const SIZE_PREFERENCE = ['L', 'M', 'XL', 'S', '2XL', '3XL'];
    const fastSizes = initVariants
      .filter((v: any) => v.stock > 0)
      .map((v: any) => v.size as string);
    return SIZE_PREFERENCE.find(s => fastSizes.includes(s)) ?? '';
  });
  const [selectedVersion, setSelectedVersion] = useState<'fan' | 'player'>(() => {
    const initVariants: any[] = initialProduct?.variants || [];
    const hasFanFast = initVariants.some((v: any) => !v.isPlayerVersion && v.stock > 0);
    if (hasFanFast) return 'fan';
    const hasPlayerFast = initVariants.some((v: any) => v.isPlayerVersion && v.stock > 0);
    if (hasPlayerFast) return 'player';
    return 'fan';
  });
  const [selectedSleeve, setSelectedSleeve] = useState<'SHORT' | 'LONG'>(() => {
    const initVariants: any[] = initialProduct?.variants || [];
    const hasShortFast = initVariants.some((v: any) => (v.sleeve || 'SHORT') === 'SHORT' && v.stock > 0);
    if (hasShortFast) return 'SHORT';
    const hasLongFast = initVariants.some((v: any) => v.sleeve === 'LONG' && v.stock > 0);
    if (hasLongFast) return 'LONG';
    return 'SHORT';
  });
  const [selectedPatch, setSelectedPatch] = useState<'none' | 'patch'>('none');

  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);

  // ======= LÓGICA REACTIVA DE VARIANTES =======
  const ALL_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
  const variants = product?.variants || [];
  const SIZES = ALL_SIZES;

  // Buscar variante que coincida con TODAS las dimensiones seleccionadas
  const selectedVariant = variants.find((v: any) =>
    v.size === selectedSize &&
    (v.isPlayerVersion === (selectedVersion === 'player')) &&
    ((v.sleeve || 'SHORT') === selectedSleeve) &&
    (selectedPatch === 'patch' ? (v.hasLeaguePatch || v.hasChampionsPatch) : (!v.hasLeaguePatch && !v.hasChampionsPatch))
  ) || null;

  // Fallback: variante base solo por talla (para precio/personalización)
  const sizeVariant = variants.find((v: any) => v.size === selectedSize) || null;

  useEffect(() => {
    if (product && !selectedSize && SIZES.length > 0) {
      setSelectedSize(SIZES[0]);
    }
  }, [product, selectedSize, SIZES]);

  const localStock = selectedVariant?.stock ?? 0;
  const isDropshippable = selectedVariant ? selectedVariant.isDropshippable : true;
  const sizeAvailable = selectedVariant ? (localStock > 0 || isDropshippable) : true;
  const customizationPrice = (selectedVariant || sizeVariant)?.customizationPrice
    ? (selectedVariant || sizeVariant).customizationPrice / 100 : 199;

  const globalAllowsCustomization = variants.length > 0
    ? variants.some((v: any) => v.allowsNameNumber)
    : true;
  const canCustomize = globalAllowsCustomization;

  useEffect(() => {
    if (!canCustomize) {
      setIsCustomized(false);
      setCustomName("");
      setCustomNumber("");
    }
  }, [selectedSize, canCustomize]);

  // Precios dinámicos con extras
  const EXTRA_LONG_SLEEVE = 50;   // +$50 MXN
  const EXTRA_PATCH = 40;         // +$40 MXN
  const rawBase = (selectedVariant || sizeVariant)?.priceCents
    ? (selectedVariant || sizeVariant).priceCents / 100 : product?.price || 0;
  const sleeveExtra = selectedSleeve === 'LONG' ? EXTRA_LONG_SLEEVE : 0;
  const patchExtra = selectedPatch !== 'none' ? EXTRA_PATCH : 0;
  const basePrice = rawBase + sleeveExtra + patchExtra;
  const displayPrice = isCustomized ? basePrice + customizationPrice : basePrice;
  const compareAtPrice = (selectedVariant || sizeVariant)?.compareAtPriceCents
    ? (selectedVariant || sizeVariant).compareAtPriceCents / 100 : product?.compareAtPrice || 0;

  // ── Si no había producto inicial, fetch desde el cliente (fallback) ──
  useEffect(() => {
    if (!initialProduct) {
      fetch(`${API_BASE}/api/v1/products/${productId}`)
        .then(res => { if (!res.ok) throw new Error("Producto no encontrado"); return res.json(); })
        .then(data => { setProduct(data); setLoading(false); })
        .catch(() => { setLoading(false); });
    }
  }, [productId, initialProduct]);

  // ── 📊 ANALÍTICAS: Registrar visita al montar (silencioso, no bloquea la UI) ──
  useEffect(() => {
    if (!productId) return;
    try {
      const blob = new Blob([JSON.stringify({ productId })], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/api/v1/analytics/view`, blob);
    } catch { /* fallo silencioso */ }
  }, [productId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (loading || !mounted) {
    return <ProductSkeleton />;
  }

  if (!product) return <div className="text-th-primary text-center py-20">Producto no encontrado</div>;

  return (
    <div className="min-h-screen bg-theme-bg text-th-primary font-sans transition-colors duration-300">
      <Navbar />

      <div className="pt-24 md:pt-32 pb-20 container mx-auto px-6">

        {/* BREADCRUMBS */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-8 text-sm text-th-secondary">
          <button onClick={() => router.back()} className="hover:text-accent transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <span>/</span>

          {/* 3. Club / Equipo (Opcional) */}
          {product.club && (
            <>
              <Link
                href={`/teams/${product.club.slug}`}
                className="capitalize tracking-widest hover:text-accent transition-colors truncate max-w-[120px] md:max-w-none"
              >
                {product.club.name.toLowerCase()}
              </Link>
              <span>/</span>
            </>
          )}

          {/* 4. Nombre de la Playera */}
          <span className="text-th-primary truncate max-w-[150px] md:max-w-[300px]">
            {product.name}
          </span>
        </div>

        {/* --- MOBILE ONLY: Título y Precio arriba de la imagen --- */}
        <div className="block lg:hidden w-full mb-6">
          <div className="flex items-center gap-2 mb-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-th-secondary">
            <span className="text-black">Nuevo</span>
            <span>{product.brand || "Adidas"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter text-black leading-tight mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-black font-medium font-jost text-lg sm:text-xl tracking-wide">
              ${Number(displayPrice).toFixed(2).replace(/\.00$/, '')} MXN
            </span>
            {product.compareAtPrice > 0 && (
              <span className="text-gray-400 font-medium font-jost line-through decoration-gray-400 decoration-1 text-lg sm:text-xl">
                ${product.compareAtPrice}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] xl:grid-cols-[1.5fr_1fr] gap-12 lg:gap-16">

          {/* COLUMNA IZQUIERDA: GALERÍA */}
          <div className="space-y-6">
            {(() => {
              const galleryImages: string[] =
                product.images?.length > 0
                  ? product.images.map((img: any) => img.url || img)
                  : product.imageUrl ? [product.imageUrl] : [];
              const currentImage = galleryImages[selectedImageIndex] || galleryImages[0] || '';
              const hasMultiple = galleryImages.length > 1;

              return (
                <div className="flex flex-col-reverse md:flex-row gap-4">
                  {/* Thumbnails — izquierda en desktop, abajo en mobile (siempre reservar espacio) */}
                  <div className={`flex md:flex-col gap-3 md:w-20 lg:w-24 flex-shrink-0 overflow-x-auto md:overflow-y-auto ${!hasMultiple ? 'invisible' : ''}`}>
                    {(hasMultiple ? galleryImages : [galleryImages[0] || '']).map((url: string, i: number) => (
                      <button
                        key={`thumb-${i}`}
                        type="button"
                        onClick={() => hasMultiple && setSelectedImageIndex(i)}
                        className={`relative flex-shrink-0 aspect-square w-16 md:w-full rounded-sm overflow-hidden border-0 transition-all duration-200 ${selectedImageIndex === i
                          ? 'opacity-100'
                          : 'opacity-60 hover:opacity-100'
                          }`}
                      >
                        <Image
                          src={url}
                          alt={`Vista ${i + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Imagen principal con zoom */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div
                      ref={zoomRef}
                      className="relative aspect-square bg-transparent rounded-sm overflow-hidden border-0 cursor-crosshair"
                    /* 
                    onMouseEnter={() => setZoomActive(true)}
                    onMouseLeave={() => setZoomActive(false)}
                    onMouseMove={(e) => {
                      if (!zoomRef.current) return;
                      const rect = zoomRef.current.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      const overlay = zoomRef.current.querySelector('.zoom-overlay') as HTMLElement;
                      if (overlay) {
                        overlay.style.backgroundPosition = `${x}% ${y}%`;
                      }
                    }} 
                    */
                    >
                      {/* Imagen normal */}
                      <Image
                        key={currentImage}
                        src={currentImage}
                        alt={product.name}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain transition-opacity duration-500"
                      />

                      {/* Zoom overlay (2x) — Inactivo por petición
                    {zoomActive && (
                      <div
                        className="zoom-overlay absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${currentImage})`,
                          backgroundSize: '200%',
                          backgroundPosition: '50% 50%',
                          backgroundRepeat: 'no-repeat',
                          opacity: 1,
                        }}
                      />
                    )} 
                    */}

                      {/* Zoom hint — Inactivo por petición
                    {!zoomActive && (
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 opacity-60">
                        <ZoomIn className="w-3 h-3" /> Zoom
                      </div>
                    )} 
                    */}
                    </div>

                    {/* Mensajes de Confianza */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                        <Truck className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase text-th-secondary">Envío Rápido</p>
                      </div>
                      <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                        <ShieldCheck className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase text-th-secondary">Oficial</p>
                      </div>
                      <div className="bg-theme-card p-4 rounded-xl text-center border border-th-border/10">
                        <Share2 className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase text-th-secondary">Compartir</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* COLUMNA DERECHA: INFO Y COMPRA */}
          <div className="flex flex-col w-full max-w-[420px]">

            {/* Etiquetas, Título y Precio (DESKTOP ONLY) */}
            <div className="hidden lg:block mb-4">
              <div className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-th-secondary">
                <span className="text-black">Nuevo</span>
                <span>{product.brand || "Adidas"}</span>
              </div>

              <h1 className="text-2xl xl:text-3xl font-semibold tracking-tighter text-black leading-tight mb-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-black font-medium font-jost text-lg xl:text-xl tracking-wide">
                  ${Number(displayPrice).toFixed(2).replace(/\.00$/, '')} MXN
                </span>
                {product.compareAtPrice > 0 && (
                  <span className="text-gray-400 font-medium font-jost line-through decoration-gray-400 decoration-1 text-lg xl:text-xl">
                    ${product.compareAtPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-th-border/10 my-4" />

            {/* Descripción */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary mb-2">Descripción</h3>
              <p className="text-th-secondary leading-relaxed font-light text-sm">
                {product.description || "El jersey oficial de la temporada. Fabricado con tecnología de alta transpirabilidad para mantenerte fresco dentro y fuera de la cancha."}
              </p>
            </div>

            {/* Selector de Talla */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary">Selecciona tu talla</h3>
                <button className="flex items-center gap-1 text-[10px] md:text-xs uppercase tracking-widest text-th-secondary hover:text-th-primary transition-colors underline underline-offset-4">
                  <Ruler className="w-3 h-3" /> Guía de tallas
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => {
                  const variantForSize = variants.find((v: any) => v.size === size);
                  const hasLocalStock = (variantForSize?.stock ?? 0) > 0;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 border border-th-border/60 rounded-sm font-medium uppercase tracking-widest text-xs relative transition-all ${selectedSize === size
                        ? "border-black text-black shadow-sm ring-1 ring-black"
                        : "text-gray-500 hover:border-gray-400 hover:text-gray-700"
                        }`}
                    >
                      {size}
                      {hasLocalStock && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" title="Envío Rápido disponible" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Versión */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary mb-3">Versión</h3>
              <div className="grid grid-cols-2 gap-2 w-[60%]">
                {(['fan', 'player'] as const).map(ver => {
                  const hasFastStock = variants.some((v: any) =>
                    (v.isPlayerVersion === (ver === 'player')) && v.stock > 0
                  );
                  return (
                    <button
                      key={ver}
                      onClick={() => setSelectedVersion(ver)}
                      className={`h-10 border rounded-sm font-medium uppercase tracking-widest text-xs relative transition-all ${selectedVersion === ver
                          ? 'border-black text-black shadow-sm ring-1 ring-black'
                          : 'border-th-border/60 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                        }`}
                    >
                      {ver === 'fan' ? 'Fan' : 'Player'}
                      {hasFastStock && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" title="Envío Rápido disponible" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Corte */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary mb-3">Corte</h3>
              <div className="grid grid-cols-2 gap-2 w-[60%]">
                {(['SHORT', 'LONG'] as const).map(sl => {
                  const hasFastStock = variants.some((v: any) =>
                    (v.sleeve || 'SHORT') === sl && v.stock > 0
                  );
                  return (
                    <button
                      key={sl}
                      onClick={() => setSelectedSleeve(sl)}
                      className={`h-10 border rounded-sm font-medium uppercase tracking-widest text-xs relative transition-all ${selectedSleeve === sl
                          ? 'border-black text-black shadow-sm ring-1 ring-black'
                          : 'border-th-border/60 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                        }`}
                    >
                      {sl === 'SHORT' ? 'Manga Corta' : 'Manga Larga'}
                      {hasFastStock && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" title="Envío Rápido disponible" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-th-secondary mb-3">Parches</h3>
              <div className="grid grid-cols-2 gap-2 w-[60%]">
                {(['none', 'patch'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPatch(p)}
                    className={`h-10 border rounded-sm font-medium uppercase tracking-widest text-[10px] transition-all ${selectedPatch === p
                        ? 'border-black text-black shadow-sm ring-1 ring-black'
                        : 'border-th-border/60 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                      }`}
                  >
                    {p === 'none' ? 'Sin Parches' : 'Con Parches'}
                  </button>
                ))}
              </div>
            </div>

            {/* PERSONALIZACIÓN UI */}
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-th-primary">¿Deseas personalizar tu Jersey?</h3>
                {!canCustomize && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded">No Disponible</span>
                )}
              </div>

              {canCustomize && (
                <p className="text-xs text-th-secondary">Al personalizar, el envío cambia a Estándar (se manda a hacer con tu nombre y número).</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => canCustomize && setIsCustomized(false)}
                  disabled={!canCustomize}
                  className={`flex-1 h-12 flex items-center justify-center text-[10px] font-medium uppercase tracking-widest rounded-sm transition-all border ${!canCustomize ? 'border-gray-200 text-gray-400 cursor-not-allowed' : !isCustomized ? 'border-black text-black shadow-sm ring-1 ring-black' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}
                >
                  Sin Personalizar
                </button>
                <button
                  onClick={() => canCustomize && setIsCustomized(true)}
                  disabled={!canCustomize}
                  className={`flex-1 h-12 flex flex-col items-center justify-center text-[10px] font-medium uppercase tracking-widest rounded-sm transition-all border ${!canCustomize ? 'border-gray-200 text-gray-400 cursor-not-allowed' : isCustomized ? 'border-black text-black shadow-sm ring-1 ring-black' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}
                >
                  <span>Personalizar</span>
                  <span className="text-[9px] mt-0.5 tracking-normal">(+${customizationPrice} MXN)</span>
                </button>
              </div>

              {isCustomized && canCustomize && (
                <div className="pt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-th-secondary mb-1">Nombre en el Jersey (Máx 15)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={customName}
                      onChange={(e) => {
                        // 1. Limpiamos: Aceptamos mayúsculas, minúsculas, espacios y caracteres latinos (ñ, acentos)
                        const rawValue = e.target.value.replace(/[^A-Za-zÀ-ÿ ]/g, '');

                        // 2. Capitalizamos la primera letra y concatenamos el resto exactamente como lo escribió
                        const formattedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

                        setCustomName(formattedValue);
                      }}
                      // ATENCIÓN: Eliminé la clase 'uppercase' de Tailwind de aquí para que el 
                      // usuario vea exactamente las mayúsculas/minúsculas reales que se van a guardar.
                      className="w-full bg-transparent border border-gray-300 rounded-sm px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium text-xs tracking-wider"
                      placeholder="Ronaldo"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-th-secondary mb-1">Número (Máx 2 dígitos)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-transparent border border-gray-300 rounded-sm px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium uppercase text-xs tracking-wider text-center"
                      placeholder="7"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Compra */}
            <button
              onClick={() => {
                if (!selectedSize) { alert("Por favor, selecciona una talla antes de agregar al carrito."); return; }
                if (isCustomized && (!customName.trim() || !customNumber.trim())) { alert("Por favor, ingresa el Nombre y Número para tu jersey personalizado."); return; }
                const comboId = `${product.id}-${selectedSize}-${selectedVersion}-${selectedSleeve}-${selectedPatch}${isCustomized ? `-${customName}-${customNumber}` : ''}`;
                useCartStore.getState().addItem({
                  id: comboId,
                  variantId: selectedVariant?.id || sizeVariant?.id || '',
                  productId: product.id, name: product.name, slug: product.slug, price: basePrice,
                  imageUrl: product.imageUrl || product.images?.[0]?.url || "", size: selectedSize,
                  hasLocalStock: localStock > 0,
                  isCustomized, customName: isCustomized ? customName : undefined,
                  customNumber: isCustomized ? customNumber : undefined, customizationPrice: isCustomized ? customizationPrice : 0
                });
              }}
              className="w-full bg-black text-white rounded-full font-medium text-sm uppercase tracking-wide py-4 mt-6 transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!sizeAvailable}
            >
              {(localStock === 0 && !isDropshippable) ? "Agotado" : "Agregar al carrito"}
            </button>

            {/* DISPONIBILIDAD LOGÍSTICA MINIMALISTA */}
            <div className="mt-4 space-y-1">
              {isCustomized ? (
                <>
                  <p className="text-sm font-medium text-black">Envío Estándar (Personalizado)</p>
                  <p className="text-sm text-th-secondary">Llega del {getDeliveryDates('custom')}</p>
                </>
              ) : localStock > 0 ? (
                <>
                  <p className="text-sm font-medium text-black">Envío Rápido Disponible</p>
                  <p className="text-sm text-th-secondary">Llega del {getDeliveryDates('fast')}</p>
                </>
              ) : localStock === 0 && isDropshippable ? (
                <>
                  <p className="text-sm font-medium text-black">Envío Estándar</p>
                  <p className="text-sm text-th-secondary">Llega del {getDeliveryDates('dropship')}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-red-600">Agotado</p>
                  <p className="text-sm text-th-secondary">Sin disponibilidad por el momento.</p>
                </>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* COMPARATIVA */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-black mb-2">La diferencia está en los detalles</h2>
        <p className="text-center text-th-secondary text-sm mb-12">Más calidad, mejor acabado y una experiencia de compra más segura.</p>

        <div className="w-full">
          <div className="grid grid-cols-[1fr_120px_120px] mb-4">
            <div />
            <div className="text-center text-xs font-bold uppercase tracking-widest text-black">JerseysRaw</div>
            <div className="text-center text-xs font-bold uppercase tracking-widest text-th-secondary">Otros</div>
          </div>

          {[
            'Bordado/Parche premium (no impresión barata)',
            'Costuras reforzadas + acabado limpio',
            'Personalización de dorsal (nombre y número)',
            'Envío gratis + seguimiento',
            'Atención personalizada por WhatsApp',
            'Fit fiel a la talla',
          ].map((feature, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_120px] items-center py-3 border-t border-gray-400">
              <span className="text-xs tracking-wide text-black">{feature}</span>
              <div className="flex justify-center">
                <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <div className="flex justify-center">
                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RESEÑAS — Lo que opinan los expertos */}
      <ReviewsSection currentProductId={productId} currentProductName={product?.name} />

    </div>
  );
}
