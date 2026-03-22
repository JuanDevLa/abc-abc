/**
 * Centralized API client — JerseysRAW
 * ────────────────────────────────────
 * Single source of truth for all API calls.
 * - Base URL configured once
 * - Auth token injected automatically on protected routes
 * - Types exported for reuse across components
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

/* ─── Types ─── */

export interface ProductImage {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
  sortOrder?: number | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  currency: string;
  stock: number;
  color?: string | null;
  size?: string | null;
  audience?: string;
  isDropshippable?: boolean;
  allowsNameNumber?: boolean;
  customizationPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  price?: number;
  compareAtPrice?: number | null;
  brand?: string;
  categoryId?: string;
  clubId?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  category?: { id: string; name: string; slug: string };
  tags?: Array<{ tagId: string; tag?: { id: string; name: string; slug: string } }>;
}

export interface PaginatedProducts {
  items: Product[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

/* ─── Auth helpers ─── */

const ADMIN_TOKEN_KEY = 'admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/* ─── Core fetch wrapper ─── */

interface FetchOptions extends RequestInit {
  auth?: boolean; // If true, injects Authorization header
}

export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (auth) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...rest,
  });

  // Handle 401 — token expired or invalid
  if (res.status === 401 && auth && typeof window !== 'undefined') {
    clearAdminToken();
    // Don't redirect here — let the AdminGuard handle it
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || `API error: ${res.status}`) as any;
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return res.json();
}

/* ─── Convenience methods ─── */

export const api = {
  get: <T = any>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'GET', ...opts }),

  post: <T = any>(path: string, body?: any, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),

  put: <T = any>(path: string, body?: any, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),

  patch: <T = any>(path: string, body?: any, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),

  delete: <T = any>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...opts }),
};
