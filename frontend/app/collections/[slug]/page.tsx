import { ProductListing } from "@/components/store/ProductListing";

async function getCollectionProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/v1/products?tag=${slug}&limit=100`,
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