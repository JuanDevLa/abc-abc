'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de pago', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  PAID:            { label: 'Pagado',             color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  PROCESSING:      { label: 'En proceso',         color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  SHIPPED:         { label: 'Enviado',            color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  DELIVERED:       { label: 'Entregado',          color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  CANCELLED:       { label: 'Cancelado',          color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

function formatMXN(cents: number) {
  return `$${(cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`;
}

interface OrderItem {
  productName: string;
  productImageUrl: string | null;
  variantSize: string | null;
  variantColor: string | null;
  quantity: number;
  totalCents: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  shippingCents: number;
  shippingMethod: string;
  trackingNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AccountClient() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Cargar órdenes
  useEffect(() => {
    if (!token) return;
    setOrdersLoading(true);
    setOrdersError(null);
    apiFetch('/api/v1/orders/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setOrders(data.items ?? []))
      .catch((err) => setOrdersError(err instanceof Error ? err.message : 'Error al cargar pedidos'))
      .finally(() => setOrdersLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="w-8 h-8 border-2 border-[#F8C37C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">

        {/* ── Botón volver ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-th-secondary hover:text-th-primary transition-colors mb-8"
        >
          <span>←</span>
          <span>Volver</span>
        </button>

        {/* ── Header de perfil ── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-heading text-4xl tracking-widest uppercase text-[#F8C37C]">
              Mi Cuenta
            </h1>
            <p className="text-th-secondary text-sm mt-1">
              {user.name ? `Hola, ${user.name}` : user.email}
            </p>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-th-secondary hover:text-red-400 transition-colors border border-th-border rounded-xl px-4 py-2"
          >
            Cerrar sesión
          </button>
        </div>

        {/* ── Info de perfil ── */}
        <div className="bg-theme-card border border-th-border rounded-2xl p-6 mb-8 flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-th-secondary mb-1">Correo</p>
            <p className="text-sm">{user.email}</p>
          </div>
          {user.name && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-th-secondary mb-1">Nombre</p>
              <p className="text-sm">{user.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-th-secondary mb-1">Tipo de cuenta</p>
            <p className="text-sm capitalize">{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
          </div>
        </div>

        {/* ── Historial de órdenes ── */}
        <h2 className="font-heading text-2xl tracking-widest uppercase text-[#F8C37C] mb-5">
          Mis Pedidos
        </h2>

        {ordersError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {ordersError}
          </div>
        )}

        {ordersLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#F8C37C] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!ordersLoading && orders.length === 0 && (
          <div className="bg-theme-card border border-th-border rounded-2xl p-12 text-center">
            <p className="text-th-secondary text-sm mb-4">Aún no tienes pedidos.</p>
            <Link
              href="/catalog"
              className="inline-block bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl px-6 py-3 text-sm hover:bg-[#f0b55a] transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {!ordersLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-th-secondary bg-th-border/10 border-th-border' };
              const isOpen = expanded === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-theme-card border border-th-border rounded-2xl overflow-hidden"
                >
                  {/* Cabecera del pedido */}
                  <button
                    className="w-full flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-bold text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-th-secondary">
                          {new Date(order.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-sm font-bold text-[#F8C37C]">
                        {formatMXN(order.totalCents)}
                      </span>
                      <span className="text-th-secondary text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Detalle expandible */}
                  {isOpen && (
                    <div className="border-t border-th-border px-6 py-5 space-y-4">

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            {item.productImageUrl && (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                <Image
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-xs text-th-secondary">
                                {[item.variantSize, item.variantColor].filter(Boolean).join(' · ')}
                                {' · '}Qty {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-[#F8C37C] flex-shrink-0">
                              {formatMXN(item.totalCents)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Detalles de envío */}
                      <div className="border-t border-th-border pt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-th-secondary">
                        <span>Envío: <strong className="text-th-primary">{formatMXN(order.shippingCents)}</strong></span>
                        <span>Método: <strong className="text-th-primary">{order.shippingMethod}</strong></span>
                        {order.trackingNumber && (
                          <span>
                            Rastreo:{' '}
                            <Link
                              href={`/tracking?number=${order.trackingNumber}`}
                              className="text-[#F8C37C] hover:underline font-bold"
                            >
                              {order.trackingNumber}
                            </Link>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
