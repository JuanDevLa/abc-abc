// app/product/[id]/page.tsx — SERVER COMPONENT
// Responsabilidades:
//   1. Fetchear el producto desde el backend (server-side, para SEO)
//   2. Exportar generateMetadata con OpenGraph tags dinámicos
//   3. Renderizar el ProductDetailClient (que contiene toda la lógica interactiva)

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
      next: { revalidate: 60 }, // Revalidar cada 60s (ISR)
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── SEO Dinámico — generateMetadata ─── */
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return { title: "Producto no encontrado — Jerseys Raw" };
  }

  const price = product.variants?.[0]?.priceCents
    ? `$${(product.variants[0].priceCents / 100).toFixed(0)} MXN`
    : "";

  const description = product.description
    || `${product.name}${price ? ` — ${price}` : ""}. Jersey oficial disponible en Jerseys Raw.`;

  const imageUrl = product.images?.[0]?.url || product.imageUrl || "";

  return {
    title: `${product.name}${price ? ` — ${price}` : ""} | Jerseys Raw`,
    description,
    openGraph: {
      title: `${product.name}${price ? ` — ${price}` : ""}`,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: "website" as const,
      siteName: "Jerseys Raw",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name}${price ? ` — ${price}` : ""}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

/* ─── Page Component ─── */
export default async function ProductDetailPage(
  { params }: { params: { id: string } }
) {
  const product = await getProduct(params.id);

  if (!product) notFound();

  // Pasar el producto pre-fetched al client component para evitar doble fetch
  return <ProductDetailClient productId={params.id} initialProduct={product} />;
}