import type { Metadata } from "next";
import { ProductListing } from "@/components/store/ProductListing";

export const metadata: Metadata = {
  title: "Catálogo de Jerseys",
  description: "Explora nuestra colección completa de jerseys auténticos de fútbol. Filtra por equipo, liga, talla y color. Envíos a todo México.",
  openGraph: {
    title: "Catálogo de Jerseys — Jerseys Raw",
    description: "Explora nuestra colección completa de jerseys auténticos de fútbol.",
    url: "https://jerseysraw.com/catalog",
  },
};

// Obtener productos iniciales (Server Component)
async function getCatalogProducts(search?: string) {
  try {
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("search", search);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?${params.toString()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { items: [], pagination: { total: 0 } };
    return res.json();
  } catch (error) {
    return { items: [], pagination: { total: 0 } };
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams?.search || "";
  const data = await getCatalogProducts(search);

  return (
    <ProductListing
      title={search ? `Resultados para "${search}"` : "Catálogo"}
      products={data.items || []}
      enableFilters={true}
      initialSearch={search}
    />
  );
}
