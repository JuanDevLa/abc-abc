import type { Metadata } from "next";
import { ProductListing } from "@/components/store/ProductListing";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Colección ${title} | Jerseys Raw`,
    description: `Jerseys de la colección ${title}. Todas las tallas disponibles. Envíos a toda la República Mexicana.`,
    openGraph: {
      title: `Colección ${title} — Jerseys Raw`,
      description: `Jerseys de la colección ${title}. Envíos a todo México.`,
      url: `https://jerseysraw.com/collections/${params.slug}`,
    },
    alternates: { canonical: `https://jerseysraw.com/collections/${params.slug}` },
  };
}

async function getCollectionProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?tags=${slug}&limit=100`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { items: [] };
    return res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await getCollectionProducts(slug);
  
  // Nombre bonito (ej: retro-kits -> Retro Kits)
  const title = slug.replace(/-/g, ' ').toUpperCase();

  return (
    <ProductListing
      title={title}
      products={data.items || []}
    />
  );
}