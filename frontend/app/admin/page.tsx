"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Package, ShoppingCart, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface DashboardData {
  grossRevenueCents: number;
  netRevenueCents: number;
  totalFeesCents: number;
  todayGrossCents: number;
  todayNetCents: number;
  todayOrderCount: number;
  pendingShipment: number;
  totalProducts: number;
}

const formatMXN = (cents: number) => {
  const amount = cents / 100;
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/analytics/dashboard", { auth: true })
      .then((res: DashboardData) => { setData(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Ingresos Netos",
      value: loading ? "..." : formatMXN(data?.netRevenueCents || 0),
      subtitle: loading ? "" : `Bruto: ${formatMXN(data?.grossRevenueCents || 0)}`,
      icon: DollarSign,
      color: "bg-indigo-50 text-indigo-500",
      border: "border-indigo-100",
      href: "/admin/orders",
    },
    {
      label: "Ventas Hoy",
      value: loading ? "..." : `${data?.todayOrderCount || 0}`,
      subtitle: loading ? "" : `Neto: ${formatMXN(data?.todayNetCents || 0)}`,
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-500",
      border: "border-emerald-100",
      href: "/admin/orders",
    },
    {
      label: "Pendientes de Envío",
      value: loading ? "..." : `${data?.pendingShipment || 0}`,
      subtitle: "Pagadas, sin enviar",
      icon: ShoppingCart,
      color: "bg-violet-50 text-violet-500",
      border: "border-violet-100",
      href: "/admin/orders?status=PAID",
    },
    {
      label: "Productos",
      value: loading ? "..." : `${data?.totalProducts || 0}`,
      subtitle: "En catálogo",
      icon: Package,
      color: "bg-amber-50 text-amber-500",
      border: "border-amber-100",
      href: "/admin/products",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">

      {/* CABECERA */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Panel de Control</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Resumen de tu tienda JerseysRAW.</p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
          Hoy — {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white border ${stat.border} p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer block`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {loading ? (
                <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              )}
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
            {stat.subtitle && (
              <p className="text-[11px] text-slate-400 mt-1">{stat.subtitle}</p>
            )}
          </Link>
        ))}
      </div>

      {/* ÁREA VACÍA ESTILIZADA */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-slate-700 text-lg">Gráficos de Rendimiento</h3>
          <p className="text-slate-400 text-sm mt-1">Las analíticas de ventas estarán disponibles próximamente.</p>
        </div>
        <div className="flex gap-2 mt-2">
          {["Ene", "Feb", "Mar", "Abr", "May"].map((m, i) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className="w-8 rounded-lg bg-indigo-100"
                style={{ height: `${[24, 40, 32, 56, 20][i]}px` }}
              />
              <span className="text-[9px] text-slate-300 font-bold">{m}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}