import type { Metadata } from "next";
import { ProductListing } from "@/components/store/ProductListing";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Jerseys de ${title}`,
    description: `Compra jerseys auténticos de ${title}. Todas las tallas disponibles. Envíos a toda la República Mexicana.`,
    openGraph: {
      title: `Jerseys de ${title} — Jerseys Raw`,
      description: `Jerseys auténticos de ${title}. Envíos a todo México.`,
      url: `https://jerseysraw.com/teams/${params.slug}`,
    },
  };
}

// Obtener datos (Server Component)
async function getTeamProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?club=${slug}&limit=100`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { items: [] };
    return res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function TeamPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await getTeamProducts(slug);
  
  // Nombre bonito (ej: real-madrid -> Real Madrid)
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <ProductListing 
      title={title}
      products={data.items || []}
      clubSlug={slug}
      enableFilters={true}
    />
  );
}