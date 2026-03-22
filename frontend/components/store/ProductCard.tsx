import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/app/store/cartStore";
import { ShoppingBag } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary";

/** Resuelve la imagen del producto — retrocompatible con URLs antiguas y nuevos publicIds de Cloudinary */
function resolveImageUrl(raw: string | undefined): string {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;            // URL completa (productos existentes)
  return cldUrl(raw, { w: 600, q: "auto" });         // publicId corto → Cloudinary CDN
}

/** Calcula el % de descuento entre precio original y precio de oferta */
function calcDiscountPercent(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Resuelve el género: prioriza "Unisex" sobre cualquier otro valor */
function resolveGender(product: any): string {
  // Buscar en tags primero
  const tagNames: string[] = (product.tags || [])
    .map((pt: any) => (pt.tag?.name || pt.name || "").toLowerCase());

  if (tagNames.some(t => t.includes("unisex"))) return "UNISEX";
  if (tagNames.some(t => t.includes("mujer"))) return "MUJER";
  if (tagNames.some(t => t.includes("hombre"))) return "HOMBRE";

  // Buscar en variantes (campo audience)
  const audiences: string[] = (product.variants || [])
    .map((v: any) => (v.audience || "").toUpperCase())
    .filter(Boolean);

  if (audiences.includes("UNISEX")) return "UNISEX";
  if (audiences.includes("MUJER")) return "MUJER";
  if (audiences.includes("HOMBRE")) return "HOMBRE";

  // Default
  return "UNISEX";
}

interface ProductCardProps {
  product: any;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Precio base (del primer variante o del campo product.price)
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.priceCents ? firstVariant.priceCents / 100 : product.price || 0;
  const compareAtPrice = firstVariant?.compareAtPriceCents
    ? firstVariant.compareAtPriceCents / 100
    : product.compareAtPrice || 0;

  const isSale = compareAtPrice > 0 && compareAtPrice > price;
  const discountPercent = calcDiscountPercent(price, compareAtPrice);
  const brand = (product.brand || "").toUpperCase();
  const gender = resolveGender(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: firstVariant?.id || product.id,
      variantId: firstVariant?.id || product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: price,
      imageUrl: product.imageUrl || product.images?.[0]?.url || "",
      size: firstVariant?.size || "Unitalla"
    });
  };

  return (
    <Link href={`/product/${product.id}`} className="group cursor-pointer block relative">
      {/* 1. IMAGEN */}
      <div className="aspect-square w-full bg-gray-50 mb-3 relative overflow-hidden rounded-lg border border-gray-200 transition-all">

        {/* Imagen */}
        <Image
          src={resolveImageUrl(product.imageUrl || product.images?.[0]?.url)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges de Descuento — diseño comercial de dos bloques */}
        {isSale && discountPercent > 0 && (
          <>
            {/* Bloque izquierdo — REBAJA */}
            <div className="absolute top-0 left-0 z-10 bg-pink-500 text-white text-[10px] font-black uppercase px-2 py-1 tracking-wider">
              REBAJA
            </div>
            {/* Bloque derecho — OFF + porcentaje */}
            <div className="absolute top-0 right-0 z-10 flex flex-col">
              <div className="bg-red-500 text-white text-[10px] font-black uppercase text-center px-2 py-0.5 tracking-wider">
                OFF
              </div>
              <div className="bg-white border border-t-0 border-red-500 text-red-600 text-[11px] font-black text-center px-2 py-0.5">
                -{discountPercent}%
              </div>
            </div>
          </>
        )}

        {/* Botón Comprar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="bg-[#F8C37C] text-black text-xs font-bold uppercase py-3 px-6 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap">
            Comprar
          </span>
        </div>

      </div>

      {/* 2. INFORMACIÓN */}
      <div className="space-y-1 px-1">

        {/* Marca + Género */}
        <p className="text-gray-500 text-xs uppercase tracking-wider">
          {brand}{brand && gender ? " · " : ""}{gender}
        </p>

        {/* Título — peso normal, sin negritas */}
        <h3 className="text-th-primary font-normal text-sm leading-snug group-hover:underline tracking-tight">
          {product.name}
        </h3>

        {/* Precio */}
        <div className="pt-1 flex items-center gap-2">
          {isSale ? (
            <>
              {/* Precio original tachado */}
              <span className="text-gray-400 line-through text-xs">
                ${Number(compareAtPrice).toFixed(2).replace(/\.00$/, '')}
              </span>
              {/* Precio de oferta en rojo */}
              <span className="text-red-600 font-bold text-base">
                ${Number(price).toFixed(2).replace(/\.00$/, '')}
              </span>
            </>
          ) : (
            <span className="text-th-primary font-medium text-base">
              ${Number(price).toFixed(2).replace(/\.00$/, '')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};