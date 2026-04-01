"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/app/store/cartStore";
import { api } from "@/lib/api";
import { getDeliveryDates } from "@/lib/shipping";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Truck, CreditCard, ChevronRight, Package, Zap, Loader2, Tag, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface ShippingOption {
    method: string;
    label: string;
    costCents: number;
    isFree: boolean;
}

const MEXICAN_STATES = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
    "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
    "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
    "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
    "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán",
    "Zacatecas",
];

function normalizeState(apiState: string): string {
    const map: Record<string, string> = {
        "México": "Estado de México",
        "Michoacán de Ocampo": "Michoacán",
        "Coahuila de Zaragoza": "Coahuila",
        "Veracruz de Ignacio de la Llave": "Veracruz",
    };
    return map[apiState] ?? apiState;
}

function getFieldError(name: string, value: string): string {
    const v = value.trim();
    switch (name) {
        case 'email':
            if (!v) return 'El correo es obligatorio';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Correo electrónico inválido';
            return '';
        case 'firstName':
            if (!v) return 'El nombre es obligatorio';
            if (v.length < 2) return 'Mínimo 2 caracteres';
            return '';
        case 'lastName':
            if (!v) return 'El apellido es obligatorio';
            if (v.length < 2) return 'Mínimo 2 caracteres';
            return '';
        case 'address':
            if (!v) return 'La dirección es obligatoria';
            if (v.length < 5) return 'Dirección muy corta';
            return '';
        case 'city':
            if (!v) return 'La ciudad es obligatoria';
            return '';
        case 'state':
            if (!v) return 'El estado es obligatorio';
            return '';
        case 'zipCode':
            if (!v) return 'El C.P. es obligatorio';
            if (!/^\d{5}$/.test(v)) return 'Debe tener exactamente 5 dígitos';
            return '';
        case 'phone':
            if (!v) return 'El teléfono es obligatorio';
            if (!/^\d{10}$/.test(v)) return 'Debe tener exactamente 10 dígitos';
            return '';
        default:
            return '';
    }
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

    // Cupones
    const [couponInput, setCouponInput] = useState("");
    const [couponData, setCouponData] = useState<{ code: string; discountPercent: number; discountCents: number; description: string } | null>(null);
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
    const [cpLoading, setCpLoading] = useState(false);
    const [firstPurchaseCoupon, setFirstPurchaseCoupon] = useState<{ code: string; discountPercent: number; description: string } | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // Fetch cupón de primera compra activo (para sugerencia)
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/v1/coupons/announcement`)
            .then((r) => r.json())
            .then((data) => { if (data?.code) setFirstPurchaseCoupon(data); })
            .catch(() => {});
    }, []);

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
        const hasLocal = items.some(item => item.hasLocalStock && !item.isCustomized);
        const localSubCents = Math.round(
            items.filter(item => item.hasLocalStock && !item.isCustomized)
                .reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
        );

        api.get(`/api/v1/shipping/options?subtotalCents=${subtotalCents}&hasDropshipItems=${hasDropship}&hasLocalItems=${hasLocal}&localSubtotalCents=${localSubCents}`)
            .then((data: { options: ShippingOption[] }) => {
                setShippingOptions(data.options);
                setShippingMethod(data.options[0]?.method ?? "STANDARD");
                setShippingLoading(false);
            })
            .catch(() => setShippingLoading(false));
    }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

    // CP lookup: cuando el usuario completa 5 dígitos, busca ciudad y estado
    useEffect(() => {
        if (formData.zipCode.length !== 5) return;
        setCpLoading(true);
        fetch(`/api/cp/${formData.zipCode}`)
            .then(r => r.json())
            .then(data => {
                const zc = data.zip_codes?.[0];
                if (!zc) return;
                const city = (zc.d_ciudad || zc.D_mnpio || '').trim();
                const state = normalizeState((zc.d_estado || '').trim());
                setFormData(prev => ({
                    ...prev,
                    ...(city ? { city } : {}),
                    ...(MEXICAN_STATES.includes(state) ? { state } : {}),
                }));
                setTouched(prev => ({
                    ...prev,
                    ...(city ? { city: true } : {}),
                    ...(MEXICAN_STATES.includes(state) ? { state: true } : {}),
                }));
            })
            .catch(() => {}) // fallo silencioso — el usuario llena manualmente
            .finally(() => setCpLoading(false));
    }, [formData.zipCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const hasLocalItems = items.some(item => item.hasLocalStock && !item.isCustomized);
    const subtotal = getSubtotal();
    const selectedOption = shippingOptions.find(o => o.method === shippingMethod);
    const standardOption = shippingOptions.find(o => o.method === 'STANDARD');
    const expressOption = shippingOptions.find(o => o.method === 'EXPRESS');
    const shippingCost = (selectedOption?.costCents ?? 0) / 100;
    const couponDiscountAmount = couponData ? couponData.discountCents / 100 : 0;
    const total = Math.max(0, subtotal + shippingCost - couponDiscountAmount);

    const applyCoupon = async (code: string) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        setCouponLoading(true);
        setCouponError("");
        setCouponData(null);
        try {
            const result = await api.post("/api/v1/coupons/validate", {
                code: trimmed,
                subtotalCents: Math.round(subtotal * 100),
                email: formData.email || (user?.email ?? ""),
            });
            if (result.valid) {
                setCouponData({ code: trimmed, discountPercent: result.discountPercent, discountCents: result.discountCents, description: result.description });
                setCouponInput(trimmed);
            } else {
                setCouponError(result.error || "Cupón inválido");
            }
        } catch {
            setCouponError("No se pudo validar el cupón");
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setCouponData(null);
        setCouponError("");
        setCouponInput("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // Touch all required fields to surface errors
        const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
        setTouched(requiredFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
        const hasErrors = requiredFields.some(f => getFieldError(f, formData[f as keyof typeof formData] ?? ''));
        if (hasErrors) return;

        setLoading(true); // PREVENCIÓN DE DOBLE CLIC: botón bloqueado desde el primer clic
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

            // Determinar el método de envío según los tipos de items
            const hasCustomized = items.some(item => item.isCustomized);
            const hasDropship   = items.some(item => !item.hasLocalStock);
            const hasLocal      = items.some(item => item.hasLocalStock && !item.isCustomized);

            let finalShippingMethod: string;
            if (hasCustomized) {
                finalShippingMethod = "Estándar Personalizado (20-27 días)";
            } else if (hasDropship && !hasLocal) {
                finalShippingMethod = "Estándar Internacional (22-25 días)";
            } else if (hasDropship && hasLocal) {
                const localMethod = shippingMethod === "EXPRESS" ? "Express DHL (1-3 días)" : "Envío Rápido (3-7 días)";
                finalShippingMethod = `Mixto: ${localMethod} + Internacional`;
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
                couponCode: couponData?.code ?? undefined,
            }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

            // PASO 2: Crear sesión de Stripe Checkout con los datos reales de la orden
            // SEGURIDAD: El estado PAID solo cambia vía webhook cuando Stripe confirma el cobro
            const { stripeUrl } = await api.post(
                `/api/v1/orders/${result.orderNumber}/stripe-session`,
                {}
            );

            // PASO 3: Guardar email en sessionStorage para que /confirmation pueda
            // autenticarse contra el backend y ver los datos personales de la orden.
            // sessionStorage expira al cerrar la pestaña (no persiste entre sesiones).
            sessionStorage.setItem('order_email', formData.email);

            // PASO 4: Redirigir al usuario a la página de pago de Stripe
            // NO limpiar carrito aquí — se limpia en /confirmation solo si el pago fue exitoso
            // El botón permanece deshabilitado hasta que la página cambia (no hay doble clic posible)
            window.location.href = stripeUrl;

        } catch (err: any) {
            setError(err.message || "Error al procesar tu orden. Intenta de nuevo.");
            setLoading(false); // Reactivar solo si hay error
        }
    };


    const getInputClass = (name: string) => {
        const base = "w-full bg-white border rounded-lg px-4 py-3 text-base text-black focus:outline-none transition-colors placeholder:text-gray-400";
        if (!touched[name]) return `${base} border-gray-300 focus:border-black`;
        const err = getFieldError(name, formData[name as keyof typeof formData] ?? '');
        if (err) return `${base} border-red-400 focus:border-red-500`;
        return `${base} border-green-500 focus:border-green-600`;
    };

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
                                    <label htmlFor="email" className="block text-xs font-medium text-th-secondary mb-1">Correo Electrónico *</label>
                                    <input id="email" type="email" name="email" required placeholder="tu@correo.com" value={formData.email} onChange={handleInputChange} onBlur={handleBlur} autoComplete="email" className={getInputClass('email')} />
                                    {touched.email && getFieldError('email', formData.email) && (
                                        <p className="text-xs text-red-500 mt-1">{getFieldError('email', formData.email)}</p>
                                    )}
                                    <p className="text-xs text-th-secondary mt-2 flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Te enviaremos el recibo y actualizaciones de envío aquí.
                                    </p>
                                </div>
                            </section>

                            {/* DIRECCIÓN */}
                            <section className="space-y-4">
                                <h2 className="text-xl font-heading uppercase tracking-wide">Dirección de Envío</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Nombre + Apellido */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="firstName" className="text-xs font-medium text-th-secondary">Nombre *</label>
                                        <input id="firstName" type="text" name="firstName" required placeholder="Juan" value={formData.firstName} onChange={handleInputChange} onBlur={handleBlur} autoComplete="given-name" className={getInputClass('firstName')} />
                                        {touched.firstName && getFieldError('firstName', formData.firstName) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('firstName', formData.firstName)}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="lastName" className="text-xs font-medium text-th-secondary">Apellido(s) *</label>
                                        <input id="lastName" type="text" name="lastName" required placeholder="García López" value={formData.lastName} onChange={handleInputChange} onBlur={handleBlur} autoComplete="family-name" className={getInputClass('lastName')} />
                                        {touched.lastName && getFieldError('lastName', formData.lastName) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('lastName', formData.lastName)}</p>
                                        )}
                                    </div>

                                    {/* CP + País — el CP dispara autofill de ciudad y estado */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="zipCode" className="text-xs font-medium text-th-secondary flex items-center gap-1">
                                            Código Postal *
                                            {cpLoading && <Loader2 className="w-3 h-3 animate-spin text-th-secondary" />}
                                        </label>
                                        <input
                                            id="zipCode" type="text" name="zipCode" required placeholder="06600"
                                            value={formData.zipCode} onChange={handleInputChange} onBlur={handleBlur}
                                            pattern="\d{5}" maxLength={5} title="5 dígitos"
                                            autoComplete="postal-code" className={getInputClass('zipCode')}
                                        />
                                        {touched.zipCode && getFieldError('zipCode', formData.zipCode) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('zipCode', formData.zipCode)}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="country" className="text-xs font-medium text-th-secondary">País</label>
                                        <select id="country" name="country" value={formData.country} onChange={handleInputChange} autoComplete="country-name" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-black focus:border-black focus:outline-none transition-colors">
                                            <option value="México">México</option>
                                        </select>
                                    </div>

                                    {/* Ciudad + Estado — autollenados por CP */}
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="city" className="text-xs font-medium text-th-secondary">Ciudad *</label>
                                        <input id="city" type="text" name="city" required placeholder="Ciudad de México" value={formData.city} onChange={handleInputChange} onBlur={handleBlur} autoComplete="address-level2" className={getInputClass('city')} />
                                        {touched.city && getFieldError('city', formData.city) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('city', formData.city)}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="state" className="text-xs font-medium text-th-secondary">Estado *</label>
                                        <select
                                            id="state" name="state" required
                                            value={formData.state} onChange={handleInputChange} onBlur={handleBlur}
                                            autoComplete="address-level1" className={getInputClass('state')}
                                        >
                                            <option value="">Selecciona un estado</option>
                                            {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {touched.state && getFieldError('state', formData.state) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('state', formData.state)}</p>
                                        )}
                                    </div>

                                    {/* Dirección */}
                                    <div className="flex flex-col gap-1 md:col-span-2">
                                        <label htmlFor="address" className="text-xs font-medium text-th-secondary">Dirección *</label>
                                        <input id="address" type="text" name="address" required placeholder="Calle, Número, Colonia" value={formData.address} onChange={handleInputChange} onBlur={handleBlur} autoComplete="street-address" className={getInputClass('address')} />
                                        {touched.address && getFieldError('address', formData.address) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('address', formData.address)}</p>
                                        )}
                                    </div>

                                    {/* Teléfono */}
                                    <div className="flex flex-col gap-1 md:col-span-2">
                                        <label htmlFor="phone" className="text-xs font-medium text-th-secondary">Teléfono *</label>
                                        <input
                                            id="phone" type="tel" name="phone" required placeholder="5512345678"
                                            value={formData.phone} onChange={handleInputChange} onBlur={handleBlur}
                                            pattern="\d{10}" maxLength={10} title="10 dígitos"
                                            autoComplete="tel" className={getInputClass('phone')}
                                        />
                                        {touched.phone && getFieldError('phone', formData.phone) && (
                                            <p className="text-xs text-red-500 mt-1">{getFieldError('phone', formData.phone)}</p>
                                        )}
                                    </div>

                                    {/* Referencia (opcional) */}
                                    <div className="flex flex-col gap-1 md:col-span-2">
                                        <label htmlFor="reference" className="text-xs font-medium text-th-secondary">Referencia <span className="font-normal">(opcional)</span></label>
                                        <input
                                            id="reference" type="text" name="reference" placeholder="Entre calles, color de fachada, etc."
                                            value={formData.reference} onChange={handleInputChange}
                                            maxLength={120}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-black focus:border-black focus:outline-none transition-colors placeholder:text-gray-400"
                                        />
                                    </div>
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
                                    ) : hasDropshipItems && !hasLocalItems ? (
                                        /* TODOS dropship — envío gratis */
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
                                            {/* MIXTO: banner informativo para artículos importados */}
                                            {hasDropshipItems && hasLocalItems && (
                                                <>
                                                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-accent/30 bg-accent/5">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="w-5 h-5 text-accent" />
                                                            <div>
                                                                <p className="font-bold text-sm">Artículos importados — Envío Gratuito</p>
                                                                <p className="text-xs text-th-secondary">Llega del {getDeliveryDates('dropship')}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-sm text-accent">Gratis</span>
                                                    </div>
                                                    <p className="text-xs text-th-secondary font-semibold uppercase tracking-wide">Envío para artículos en stock:</p>
                                                </>
                                            )}

                                            {/* Opciones Standard / Express para ítems locales */}
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

                            {/* CUPÓN — sugerencia de primera compra */}
                            {firstPurchaseCoupon && !couponData && (
                                <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                                    <Tag className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-th-primary font-semibold">
                                            ¿Quieres aplicar el cupón de primera compra?
                                        </p>
                                        <p className="text-xs text-th-secondary mt-0.5">
                                            {firstPurchaseCoupon.discountPercent}% de descuento con el código{" "}
                                            <span className="font-bold text-accent tracking-widest">{firstPurchaseCoupon.code}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => applyCoupon(firstPurchaseCoupon.code)}
                                        disabled={couponLoading}
                                        className="flex-shrink-0 text-xs font-bold uppercase tracking-widest border border-accent/40 text-accent rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-50"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            )}

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
                                            <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold truncate pr-4">{item.name}</h4>
                                            {item.size && <p className="text-xs text-th-secondary uppercase">Talla: <span className="text-th-primary">{item.size}</span></p>}
                                            {item.isCustomized && (
                                                <p className="text-xs text-accent">
                                                    Personalizado: {item.customName} #{item.customNumber}
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

                            {/* Barra de envío gratis */}
                            {(() => {
                                const FREE_THRESHOLD = 999;
                                const remaining = Math.max(0, FREE_THRESHOLD - subtotal);
                                const progress = Math.min(100, (subtotal / FREE_THRESHOLD) * 100);
                                return remaining === 0 ? (
                                    <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
                                        <span className="text-xs font-bold text-emerald-600">¡Envío gratis desbloqueado!</span>
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <p className="text-xs text-th-secondary mb-1.5">
                                            Te faltan <span className="font-bold text-th-primary">${remaining.toFixed(0)}</span> para envío gratis
                                        </p>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-th-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-3 text-sm text-th-secondary mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-th-primary">${Number(subtotal).toFixed(2).replace(/\.00$/, '')}</span>
                                </div>
                                {hasDropshipItems && hasLocalItems && (
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            <Package className="w-4 h-4" />
                                            Importados
                                        </span>
                                        <span className="text-accent font-bold uppercase">Gratis</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <Truck className="w-4 h-4" />
                                        {hasDropshipItems && !hasLocalItems
                                            ? "Internacional"
                                            : shippingMethod === "EXPRESS" ? "Express (DHL)" : "Estándar"}
                                    </span>
                                    <span className={shippingCost === 0 ? "text-accent font-bold uppercase" : "text-th-primary"}>
                                        {shippingCost === 0 ? "Gratis" : `$${Number(shippingCost).toFixed(2).replace(/\.00$/, '')}`}
                                    </span>
                                </div>
                                {couponData && (
                                    <div className="flex justify-between items-center text-emerald-500">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-4 h-4" />
                                            Cupón <span className="font-bold tracking-widest">{couponData.code}</span>
                                            <button type="button" onClick={removeCoupon} className="ml-1 text-th-secondary hover:text-red-400 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                        <span className="font-bold">-${couponDiscountAmount.toFixed(2).replace(/\.00$/, '')}</span>
                                    </div>
                                )}
                            </div>

                            {/* AGREGAR CUPÓN */}
                            <div className="mb-4">
                                {!couponData ? (
                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Código de cupón"
                                                value={couponInput}
                                                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon(couponInput))}
                                                className="flex-1 bg-theme-bg border border-th-border/20 rounded-xl px-3 py-2 text-base font-mono uppercase tracking-widest focus:outline-none focus:border-accent transition-colors placeholder:normal-case placeholder:tracking-normal"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => applyCoupon(couponInput)}
                                                disabled={couponLoading || !couponInput.trim()}
                                                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-accent-cta text-accent-cta-text rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
                                            >
                                                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                <X className="w-3 h-3" /> Cupón inválido: {couponError}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                        ✓ Descuento aplicado: {couponData.description}
                                    </p>
                                )}
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
