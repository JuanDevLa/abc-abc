"use client";
import { useState, useEffect } from "react";
import { Package, ChevronLeft, ChevronRight, Eye, Loader2, Truck, Clock, CheckCircle, XCircle, ArrowRight, PlaneTakeoff } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_PAYMENT: { label: "Pendiente de Pago", color: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock },
    PAID: { label: "Pagado", color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle },
    PROCESSING: { label: "Procesando", color: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: Package },
    SHIPPED: { label: "Enviado", color: "bg-blue-50 text-blue-600 border-blue-200", icon: Truck },
    DELIVERED: { label: "Entregado", color: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: CheckCircle },
    CANCELLED: { label: "Cancelado", color: "bg-rose-50 text-rose-600 border-rose-200", icon: XCircle },
};

const STATUS_FLOW = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

/** Determina el tipo de fulfillment de una orden según sus items */
function getOrderFulfillmentType(items: any[]): "LOCAL" | "DROPSHIPPING" | "MIXED" {
    if (!items || items.length === 0) return "LOCAL";
    const types = items.map(i => i.product?.fulfillmentType ?? "LOCAL");
    const hasDropship = types.some(t => t === "DROPSHIPPING");
    const hasLocal = types.some(t => t === "LOCAL");
    if (hasDropship && hasLocal) return "MIXED";
    if (hasDropship) return "DROPSHIPPING";
    return "LOCAL";
}

const FULFILLMENT_BADGE: Record<string, { label: string; className: string }> = {
    LOCAL:       { label: "📦 Local",       className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    DROPSHIPPING:{ label: "✈️ Dropshipping", className: "bg-sky-50 text-sky-700 border-sky-200" },
    MIXED:       { label: "🔀 Mixto",        className: "bg-violet-50 text-violet-700 border-violet-200" },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [fulfillmentFilter, setFulfillmentFilter] = useState<"" | "LOCAL" | "DROPSHIPPING">(""); // client-side
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [changingStatus, setChangingStatus] = useState<string | null>(null);
    const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

    const fetchOrders = async (pageNum: number, status?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum) });
            if (status) params.append("status", status);
            const data = await api.get(`/api/v1/orders?${params}`, { auth: true });
            setOrders(data.items || []);
            setTotal(data.pagination?.total || 0);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(page, statusFilter); }, [page, statusFilter]);

    const getNextStatus = (current: string) => {
        const idx = STATUS_FLOW.indexOf(current);
        if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
        return STATUS_FLOW[idx + 1];
    };

    const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string) => {
        setChangingStatus(orderId);
        try {
            const body: { status: string; trackingNumber?: string } = { status: newStatus };
            if (trackingNumber?.trim()) body.trackingNumber = trackingNumber.trim();
            await api.put(`/api/v1/orders/${orderId}/status`, body, { auth: true });
            setTrackingInputs(prev => { const next = { ...prev }; delete next[orderId]; return next; });
            fetchOrders(page, statusFilter);
        } catch {
            alert("Error al cambiar status");
        } finally {
            setChangingStatus(null);
        }
    };

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    // Filtro de fulfillment aplicado en el cliente sobre los datos del servidor
    const displayedOrders = fulfillmentFilter
        ? orders.filter(order => {
            const t = getOrderFulfillmentType(order.items);
            if (fulfillmentFilter === "DROPSHIPPING") return t === "DROPSHIPPING" || t === "MIXED";
            return t === "LOCAL";
        })
        : orders;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* CABECERA */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Ventas</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-indigo-500" />
                    </div>
                    Órdenes
                    <span className="text-sm font-normal text-slate-400 ml-2">({total})</span>
                </h1>
            </div>

            {/* FILTROS — STATUS */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => { setStatusFilter(""); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!statusFilter ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                    Todas
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <button
                        key={key}
                        onClick={() => { setStatusFilter(key); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statusFilter === key ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* FILTROS — FULFILLMENT (logística) */}
            <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mr-1">Logística:</span>
                {([["", "Todas"], ["LOCAL", "📦 Local"], ["DROPSHIPPING", "✈️ Dropshipping"]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFulfillmentFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${fulfillmentFilter === key ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* LISTA */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
            ) : displayedOrders.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No hay órdenes{statusFilter ? " con este status" : ""}.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedOrders.map(order => {
                        const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_PAYMENT;
                        const StatusIcon = config.icon;
                        const nextStatus = getNextStatus(order.status);
                        const isExpanded = expandedId === order.id;
                        const fulfillType = getOrderFulfillmentType(order.items);
                        const badge = FULFILLMENT_BADGE[fulfillType];

                        return (
                            <div key={order.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                                {/* Header row */}
                                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-black text-sm text-slate-800">{order.orderNumber}</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${config.color}`}>
                                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                                {config.label}
                                            </span>
                                            {/* Badge de Fulfillment */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span>{order.firstName} {order.lastName}</span>
                                            <span>{order.email}</span>
                                            <span>{formatDate(order.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-black text-slate-800">{formatPrice(order.totalCents)}</p>
                                        <p className="text-[10px] text-slate-400">{order.items.length} producto{order.items.length > 1 ? "s" : ""}</p>
                                    </div>
                                    <Eye className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
                                        {/* Items */}
                                        <div className="space-y-2">
                                            {order.items.map((item: any, i: number) => {
                                                const itemFulfill = item.product?.fulfillmentType ?? "LOCAL";
                                                return (
                                                    <div key={i} className="flex items-center gap-3 text-sm">
                                                        {item.productImageUrl && (
                                                            <div className="w-10 h-12 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={item.productImageUrl} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-700">{item.productName}</p>
                                                            <p className="text-xs text-slate-400">
                                                                {item.variantSize && `Talla: ${item.variantSize}`} × {item.quantity}
                                                                {item.isPersonalized && ` · ✨ ${item.customName} #${item.customNumber}`}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${itemFulfill === "DROPSHIPPING" ? "bg-sky-50 text-sky-600 border-sky-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                                                            {itemFulfill === "DROPSHIPPING" ? "✈️" : "📦"}
                                                        </span>
                                                        <span className="font-bold text-slate-600">{formatPrice(item.totalCents)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Address + shipping */}
                                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                                            <div>
                                                <p className="font-bold text-slate-600 uppercase mb-1">Dirección</p>
                                                <p>{order.address}</p>
                                                <p>{order.city}, {order.state} {order.zipCode}</p>
                                                {order.reference && <p className="italic">Ref: {order.reference}</p>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-600 uppercase mb-1">Envío</p>
                                                <p>{order.shippingMethod === "EXPRESS" ? "Express DHL (1-3 días)" : "Estándar (3-7 días)"}</p>
                                                <p>{order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}</p>
                                                <p className="mt-1 font-bold">Tel: {order.phone}</p>
                                                {order.trackingNumber && (
                                                    <p className="mt-1">Tracking: <span className="font-mono text-indigo-500">{order.trackingNumber}</span></p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status change */}
                                        {nextStatus && order.status !== "CANCELLED" && (
                                            <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                                                {nextStatus === "SHIPPED" && (
                                                    <div>
                                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                                            Número de rastreo
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ej: 1Z999AA10123456784"
                                                            value={trackingInputs[order.id] ?? ""}
                                                            onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                            className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:border-indigo-400 outline-none"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, nextStatus, trackingInputs[order.id])}
                                                        disabled={changingStatus === order.id}
                                                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                                                    >
                                                        {changingStatus === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                                        Mover a: {STATUS_CONFIG[nextStatus]?.label}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, "CANCELLED")}
                                                        disabled={changingStatus === order.id}
                                                        className="text-xs text-rose-400 hover:text-rose-600 font-bold disabled:opacity-50 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 disabled:opacity-30 text-slate-500 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-400 font-mono">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 disabled:opacity-30 text-slate-500 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
