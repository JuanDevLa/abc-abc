import type { MetadataRoute } from "next";

const BASE = "https://jerseysraw.com";
const API  = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function getProducts(): Promise<{ id: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API}/api/v1/products?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

async function getLeagues(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/api/v1/leagues`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getClubs(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/api/v1/clubs`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getTags(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API}/api/v1/tags`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, leagues, clubs, tags] = await Promise.all([
    getProducts(),
    getLeagues(),
    getClubs(),
    getTags(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                      lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/catalog`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/tracking`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/shipping`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/returns`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/help`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/payment-methods`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/product/${p.id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const leagueRoutes: MetadataRoute.Sitemap = leagues.map((l) => ({
    url: `${BASE}/leagues/${l.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const teamRoutes: MetadataRoute.Sitemap = clubs.map((c) => ({
    url: `${BASE}/teams/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${BASE}/collections/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...leagueRoutes, ...teamRoutes, ...collectionRoutes];
}
