"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/app/store/cartStore";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Package, MapPin, Truck, Copy, Check } from "lucide-react";

interface OrderData {
    orderNumber: string;
    status: string;
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    reference?: string;
    shippingMethod: string;
    shippingCents: number;
    subtotalCents: number;
    totalCents: number;
    items: Array<{
        productName: string;
        productImageUrl?: string;
        variantSize?: string;
        variantColor?: string;
        quantity: number;
        unitPriceCents: number;
        totalCents: number;
        isPersonalized: boolean;
        customName?: string;
        customNumber?: string;
    }>;
}

export default function ConfirmationPage() {
    const params = useParams();
    const orderNumber = params.orderNumber as string;

    const { user } = useAuth();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Recuperar el email guardado en sessionStorage durante el checkout.
        // Si no existe (el usuario llegó directo a esta URL), se omite y solo
        // se muestran los campos públicos (sin datos personales).
        const savedEmail = sessionStorage.getItem('order_email') ?? '';
        const url = savedEmail
            ? `/api/v1/orders/${orderNumber}?email=${encodeURIComponent(savedEmail)}`
            : `/api/v1/orders/${orderNumber}`;

        api.get(url)
            .then(data => {
                setOrder(data);
                setLoading(false);
                setTimeout(() => setShowContent(true), 300);

                // Limpiar carrito si el pago fue confirmado O si el usuario viene del checkout
                // (sessionStorage tiene el email = pasó por el flujo de pago).
                const cameFromCheckout = Boolean(savedEmail);
                if (cameFromCheckout || data.status === 'PAID' || data.status === 'PROCESSING' || data.status === 'SHIPPED') {
                    useCartStore.getState().clearCart();
                    sessionStorage.removeItem('order_email');
                }
            })
            .catch(() => { setError("Orden no encontrada"); setLoading(false); });
    }, [orderNumber]);

    const copyOrderNumber = () => {
        navigator.clipboard.writeText(orderNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg text-th-primary flex items-center justify-center">
                <Navbar />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-th-secondary text-sm">Cargando tu orden...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-theme-bg text-th-primary flex flex-col items-center justify-center gap-4">
                <Navbar />
                <p className="text-xl font-bold mt-20">{error}</p>
                <Link href="/" className="text-accent underline">Volver a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg text-th-primary font-sans pb-20 transition-colors duration-300">
            <Navbar />

            <div className="pt-24 md:pt-32 container mx-auto px-6 max-w-3xl">

                {/* ─── Animated Checkmark ─── */}
                <div className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center animate-[pulse_2s_ease-in-out_1]">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
                        </div>
                        {/* Rings animation */}
                        <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: "1.5s", animationIterationCount: 2 }} />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
                        ¡Pedido Registrado!
                    </h1>
                    <p className="text-th-secondary max-w-md">
                        Tu orden ha sido recibida. Te contactaremos por correo o WhatsApp para coordinar el pago.
                    </p>
                </div>

                {/* ─── Order Number ─── */}
                <div className={`bg-theme-card border border-th-border/10 rounded-2xl p-6 mb-6 text-center transition-all duration-700 delay-200 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <p className="text-xs text-th-secondary uppercase font-bold tracking-widest mb-2">Número de Orden</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl md:text-3xl font-black tracking-wider text-accent">{order.orderNumber}</span>
                        <button
                            onClick={copyOrderNumber}
                            className="p-2 rounded-lg hover:bg-th-border/10 transition-colors"
                            title="Copiar"
                        >
                            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-th-secondary" />}
                        </button>
                    </div>
                    <p className="text-xs text-th-secondary mt-2">Guarda este número para dar seguimiento a tu pedido</p>
                </div>

                {/* ─── Details Grid ─── */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 transition-all duration-700 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    {/* Dirección */}
                    <div className="bg-theme-card border border-th-border/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-accent" />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Dirección de Envío</h3>
                        </div>
                        <div className="text-sm text-th-secondary space-y-1">
                            <p className="text-th-primary font-semibold">{order.firstName} {order.lastName}</p>
                            <p>{order.address}</p>
                            <p>{order.city}, {order.state} {order.zipCode}</p>
                            <p>{order.country}</p>
                            {order.reference && <p className="text-xs italic">Ref: {order.reference}</p>}
                        </div>
                    </div>

                    {/* Envío */}
                    <div className="bg-theme-card border border-th-border/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Truck className="w-4 h-4 text-accent" />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Envío</h3>
                        </div>
                        <div className="text-sm text-th-secondary space-y-1">
                            <p className="text-th-primary font-semibold">{order.shippingMethod || 'Envío Estándar'}</p>
                            <p>{order.shippingCents === 0 ? "Envío Gratis" : formatPrice(order.shippingCents)}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Items ─── */}
                <div className={`bg-theme-card border border-th-border/10 rounded-2xl p-6 mb-6 transition-all duration-700 delay-400 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-accent" />
                        <h3 className="font-bold text-sm uppercase tracking-wide">Productos ({order.items.length})</h3>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                {item.productImageUrl && (
                                    <div className="relative w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-th-border/10">
                                        <Image src={item.productImageUrl} alt={item.productName} fill sizes="56px" className="object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{item.productName}</p>
                                    <div className="flex gap-2 text-xs text-th-secondary">
                                        {item.variantSize && <span>Talla: {item.variantSize}</span>}
                                        <span>×{item.quantity}</span>
                                    </div>
                                    {item.isPersonalized && (
                                        <p className="text-xs text-accent mt-0.5">Personalizado: {item.customName} #{item.customNumber}</p>
                                    )}
                                </div>
                                <span className="font-bold text-sm">{formatPrice(item.totalCents)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-th-border/10 my-4" />

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-th-secondary">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.subtotalCents)}</span>
                        </div>
                        <div className="flex justify-between text-th-secondary">
                            <span>Envío</span>
                            <span>{order.shippingCents === 0 ? "Gratis" : formatPrice(order.shippingCents)}</span>
                        </div>
                        <div className="flex justify-between font-black text-lg pt-2 border-t border-th-border/10">
                            <span>Total</span>
                            <span className="text-accent">{formatPrice(order.totalCents)}</span>
                        </div>
                    </div>
                </div>

                {/* ─── CTA ─── */}
                <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <Link
                        href="/"
                        className="bg-accent-cta text-accent-cta-text font-bold uppercase py-4 px-8 rounded-xl text-center hover:opacity-90 transition-all text-sm"
                    >
                        Seguir Comprando
                    </Link>
                </div>

                {/* ─── CTA Registro (solo para guests) ─── */}
                {!user && (
                    <div className={`mt-6 bg-theme-card border border-th-border/10 rounded-2xl p-6 text-center transition-all duration-700 delay-600 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                        <p className="text-sm font-bold mb-1">¿Sabías que puedes ganar puntos por cada compra?</p>
                        <p className="text-xs text-th-secondary mb-4">Crea tu cuenta gratis con el mismo correo y acumula puntos para una jersey gratis.</p>
                        <Link
                            href={`/register${order?.email ? `?email=${encodeURIComponent(order.email)}` : ''}`}
                            className="inline-block bg-black text-white font-bold uppercase text-xs py-3 px-6 rounded-xl hover:opacity-80 transition-all"
                        >
                            Crear cuenta y ganar puntos
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
