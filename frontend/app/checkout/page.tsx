"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/app/store/cartStore";
import { api } from "@/lib/api";
import { getDeliveryDates } from "@/lib/shipping";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Truck, CreditCard, ChevronRight, Package, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface ShippingOption {
    method: string;
    label: string;
    costCents: number;
    isFree: boolean;
}

export default function CheckoutPage() {
    const { items, getSubtotal } = useCartStore();
    const { user, token } = useAuth();

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "", firstName: "", lastName: "",
        address: "", city: "", state: "",
        zipCode: "", country: "México",
        phone: "", reference: ""
    });

    const [shippingMethod, setShippingMethod] = useState<string>("STANDARD");
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [shippingLoading, setShippingLoading] = useState(true);

    useEffect(() => { setMounted(true); }, []);

    // Pre-llenar email si el usuario tiene sesión
    useEffect(() => {
        if (user?.email) {
            setFormData((prev) => ({ ...prev, email: user.email }));
        }
    }, [user]);

    useEffect(() => {
        if (!mounted) return;
        const subtotalCents = Math.round(getSubtotal() * 100);
        const hasDropship = items.some(item => !item.hasLocalStock || item.isCustomized);

        api.get(`/api/v1/shipping/options?subtotalCents=${subtotalCents}&hasDropshipItems=${hasDropship}`)
            .then((data: { options: ShippingOption[] }) => {
                setShippingOptions(data.options);
                setShippingMethod(data.options[0]?.method ?? "STANDARD");
                setShippingLoading(false);
            })
            .catch(() => setShippingLoading(false));
    }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!mounted) return null;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-theme-bg text-th-primary flex flex-col items-center justify-center transition-colors duration-300">
                <Navbar />
                <h2 className="text-3xl font-heading uppercase mb-4 mt-20">Tu carrito está vacío</h2>
                <p className="text-th-secondary mb-8">Agrega algunos artículos antes de proceder al checkout.</p>
                <Link href="/" className="bg-accent-cta text-accent-cta-text font-bold uppercase py-3 px-8 rounded-full hover:opacity-90 transition-colors">
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    // Calcular envío
    const hasDropshipItems = items.some(item => !item.hasLocalStock || item.isCustomized);
    const subtotal = getSubtotal();
    const selectedOption = shippingOptions.find(o => o.method === shippingMethod);
    const standardOption = shippingOptions.find(o => o.method === 'STANDARD');
    const expressOption = shippingOptions.find(o => o.method === 'EXPRESS');
    const shippingCost = (selectedOption?.costCents ?? 0) / 100;
    const total = subtotal + shippingCost;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // ✅ PREVENCIÓN DE DOBLE CLIC: botón bloqueado desde el primer clic
        setError("");

        try {
            // Mapear items del carrito al formato de la API (self-healing)
            const orderItems = items.map(item => ({
                // Si tiene variantId real, enviarlo. Si no, el backend usará productId+size
                variantId: item.variantId || undefined,
                productId: item.productId,
                size: item.size || undefined,
                quantity: item.quantity,
                isPersonalized: item.isCustomized || false,
                customName: item.customName || null,
                customNumber: item.customNumber || null,
            }));

            // Determinar el método de envío global según el peor escenario del carrito
            const hasCustomized = items.some(item => item.isCustomized);
            const hasDropship   = items.some(item => !item.hasLocalStock);

            let finalShippingMethod: string;
            if (hasCustomized) {
                finalShippingMethod = "Estándar Personalizado (20-27 días)";
            } else if (hasDropship) {
                finalShippingMethod = "Estándar Internacional (22-25 días)";
            } else if (shippingMethod === "EXPRESS") {
                finalShippingMethod = "Express DHL (1-3 días)";
            } else {
                finalShippingMethod = "Envío Rápido (3-7 días)";
            }

            // PASO 1: Crear la orden en nuestro backend (queda en PENDING_PAYMENT)
            const result = await api.post("/api/v1/orders", {
                ...formData,
                reference: formData.reference || null,
                shippingMethod: finalShippingMethod,
                items: orderItems,
            }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

            // PASO 2: Crear sesión de Stripe Checkout con los datos reales de la orden
            // ✅ SEGURIDAD: El estado PAID solo cambia vía webhook cuando Stripe confirma el cobro
            const { stripeUrl } = await api.post(
                `/api/v1/orders/${result.orderNumber}/stripe-session`,
                {}
            );

            // PASO 3: Guardar email en sessionStorage para que /confirmation pueda
            // autenticarse contra el backend y ver los datos personales de la orden.
            // sessionStorage expira al cerrar la pestaña (no persiste entre sesiones).
            sessionStorage.setItem('order_email', formData.email);

            // PASO 4: Redirigir al usuario a la página de pago de Stripe
            // ✅ NO limpiar carrito aquí — se limpia en /confirmation solo si el pago fue exitoso
            // El botón permanece deshabilitado hasta que la página cambia (no hay doble clic posible)
            window.location.href = stripeUrl;

        } catch (err: any) {
            setError(err.message || "Error al procesar tu orden. Intenta de nuevo.");
            setLoading(false); // Reactivar solo si hay error
        }
    };


    const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black outline-none transition-colors placeholder:text-gray-400";

    return (
        <div className="min-h-screen bg-theme-bg text-th-primary font-sans pb-20 transition-colors duration-300">
            <Navbar />

            <div className="pt-24 md:pt-32 container mx-auto px-6 max-w-6xl">

                {/* BREADCRUMB */}
                <div className="hidden md:flex items-center gap-2 mb-8 text-xs text-th-secondary font-bold uppercase tracking-widest">
                    <Link href="/cart" className="hover:text-th-primary">Carrito</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-accent">Información y Envío</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>Confirmación</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* ─── FORMULARIO ─── */}
                    <div className="lg:col-span-7 space-y-10">
                        <form onSubmit={handleCheckout} id="checkout-form" className="space-y-8">

                            {/* BANNER: Invitado vs Sesión */}
                            {user ? (
                                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-600" />
                                    <span>
                                        Comprando como <strong>{user.email}</strong>.{' '}
                                        <Link href="/account" className="underline hover:no-underline">Ver mis pedidos</Link>
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                                    <span>¿Ya tienes cuenta? Inicia sesión para prellenar tus datos.</span>
                                    <Link
                                        href={`/login?redirect=/checkout`}
                                        className="flex-shrink-0 font-bold text-black border border-black rounded-lg px-3 py-1.5 hover:bg-black hover:text-white transition-colors text-xs uppercase tracking-widest"
                                    >
                                        Iniciar sesión
                                    </Link>
                                </div>
                            )}

                            {/* CONTACTO */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-heading uppercase tracking-wide">Información de Contacto</h2>
                                <div>
                                    <input type="email" name="email" required placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} className={inputClass} />
                                    <p className="text-xs text-th-secondary mt-2 flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Te enviaremos el recibo y actualizaciones de envío aquí.
                                    </p>
                                </div>
                            </section>

                            {/* DIRECCIÓN */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-heading uppercase tracking-wide">Dirección de Envío</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" name="firstName" required placeholder="Nombre" value={formData.firstName} onChange={handleInputChange} className={inputClass} />
                                    <input type="text" name="lastName" required placeholder="Apellido(s)" value={formData.lastName} onChange={handleInputChange} className={inputClass} />
                                    <input type="text" name="address" required placeholder="Dirección (Calle, Número, Colonia)" value={formData.address} onChange={handleInputChange} className={`${inputClass} md:col-span-2`} />
                                    <input type="text" name="city" required placeholder="Ciudad" value={formData.city} onChange={handleInputChange} className={inputClass} />
                                    <input type="text" name="state" required placeholder="Estado" value={formData.state} onChange={handleInputChange} className={inputClass} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text" name="zipCode" required placeholder="C.P."
                                            value={formData.zipCode} onChange={handleInputChange}
                                            pattern="\d{5}" maxLength={5} title="5 dígitos"
                                            className={inputClass}
                                        />
                                        <select name="country" value={formData.country} onChange={handleInputChange} className={inputClass}>
                                            <option value="México">México</option>
                                        </select>
                                    </div>
                                    <input
                                        type="tel" name="phone" required placeholder="Teléfono (10 dígitos)"
                                        value={formData.phone} onChange={handleInputChange}
                                        pattern="\d{10}" maxLength={10} title="10 dígitos"
                                        className={`${inputClass} md:col-span-2`}
                                    />
                                    <input
                                        type="text" name="reference" placeholder="Referencia (entre calles, fachada, etc.)"
                                        value={formData.reference} onChange={handleInputChange}
                                        maxLength={120}
                                        className={`${inputClass} md:col-span-2`}
                                    />
                                </div>
                            </section>

                            {/* ENVÍO */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-heading uppercase tracking-wide">Método de Envío</h2>
                                <div className="space-y-3">
                                    {shippingLoading ? (
                                        <div className="flex items-center gap-2 p-4">
                                            <Loader2 className="w-4 h-4 animate-spin text-th-secondary" />
                                            <span className="text-sm text-th-secondary">Calculando opciones de envío...</span>
                                        </div>
                                    ) : hasDropshipItems ? (
                                        <label className="flex items-center justify-between p-4 rounded-xl border-2 border-accent bg-accent/5 cursor-default">
                                            <div className="flex items-center gap-3">
                                                <input type="radio" checked readOnly className="accent-accent" />
                                                <Package className="w-5 h-5 text-th-secondary" />
                                                <div>
                                                    <p className="font-bold text-sm">Envío Gratuito (Internacional)</p>
                                                    <p className="text-xs text-th-secondary">Llega del {getDeliveryDates('dropship')}</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm text-accent">Gratis</span>
                                        </label>
                                    ) : (
                                        <>
                                            <label
                                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingMethod === "STANDARD"
                                                    ? "border-black bg-black/5"
                                                    : "border-th-border/10 bg-theme-card hover:border-th-border/30"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" name="shipping" value="STANDARD" checked={shippingMethod === "STANDARD"} onChange={() => setShippingMethod("STANDARD")} className="accent-black" />
                                                    <Package className="w-5 h-5 text-th-secondary" />
                                                    <div>
                                                        <p className="font-bold text-sm">Estándar</p>
                                                        <p className="text-xs text-th-secondary">Llega del {getDeliveryDates('fast')}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold text-sm ${standardOption?.costCents === 0 ? "text-accent" : ""}`}>
                                                    {standardOption?.costCents === 0 ? "Gratis" : `$${(standardOption?.costCents ?? 9900) / 100}`}
                                                </span>
                                            </label>

                                            <label
                                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingMethod === "EXPRESS"
                                                    ? "border-black bg-black/5"
                                                    : "border-th-border/10 bg-theme-card hover:border-th-border/30"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" name="shipping" value="EXPRESS" checked={shippingMethod === "EXPRESS"} onChange={() => setShippingMethod("EXPRESS")} className="accent-black" />
                                                    <Zap className="w-5 h-5 text-amber-500" />
                                                    <div>
                                                        <p className="font-bold text-sm">Express (DHL)</p>
                                                        <p className="text-xs text-th-secondary">1-3 días hábiles</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-sm">${(expressOption?.costCents ?? 19900) / 100}</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* ERROR */}
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                    <p className="text-rose-400 text-sm font-semibold">{error}</p>
                                </div>
                            )}
                        </form>

                        {/* SEGURIDAD */}
                        <div className="hidden lg:block pt-8 border-t border-gray-200">
                            <div className="flex bg-theme-card p-4 rounded-xl border border-th-border/10 gap-4 items-center">
                                <ShieldCheck className="w-8 h-8 text-accent" />
                                <div className="text-xs text-th-secondary">
                                    <p className="font-bold text-th-primary uppercase">Checkout seguro</p>
                                    <p>Tus datos están protegidos y nunca los compartimos.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RESUMEN ─── */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-28 bg-theme-card border border-th-border/10 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-heading uppercase tracking-wide mb-6">Resumen del Pedido</h2>

                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-20 bg-theme-surface rounded-lg overflow-hidden flex-shrink-0 relative border border-th-border/10">
                                            <div className="absolute -top-2 -right-2 bg-th-secondary text-white text-[10px] font-bold w-5 h-5 flex flex-col items-center justify-center rounded-full z-10">
                                                {item.quantity}
                                            </div>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold truncate pr-4">{item.name}</h4>
                                            {item.size && <p className="text-xs text-th-secondary uppercase">Talla: <span className="text-th-primary">{item.size}</span></p>}
                                            {item.isCustomized && (
                                                <p className="text-xs text-accent">
                                                    ✨ {item.customName} #{item.customNumber}
                                                </p>
                                            )}
                                        </div>
                                        <div className="font-bold text-sm whitespace-nowrap">
                                            ${Number(item.price * item.quantity).toFixed(2).replace(/\.00$/, '')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gray-200 w-full mb-6" />

                            <div className="space-y-3 text-sm text-th-secondary mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-th-primary">${Number(subtotal).toFixed(2).replace(/\.00$/, '')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <Truck className="w-4 h-4" />
                                        {shippingMethod === "EXPRESS" ? "Express (DHL)" : "Estándar"}
                                    </span>
                                    <span className={shippingCost === 0 ? "text-accent font-bold uppercase" : "text-th-primary"}>
                                        {shippingCost === 0 ? "Gratis" : `$${Number(shippingCost).toFixed(2).replace(/\.00$/, '')}`}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-gray-200 w-full mb-6" />

                            <div className="flex justify-between items-end mb-8">
                                <span className="text-lg font-bold">Total</span>
                                <div className="text-right">
                                    <span className="text-xs text-th-secondary mr-2 uppercase">MXN</span>
                                    <span className="text-3xl font-black text-accent">${Number(total).toFixed(2).replace(/\.00$/, '')}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={loading}
                                className="w-full bg-white border-2 border-black text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase text-lg py-5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                                ) : (
                                    <><CreditCard className="w-5 h-5" /> Confirmar Pedido</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
