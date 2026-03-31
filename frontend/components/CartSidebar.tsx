"use client";

import { useCartStore } from "@/app/store/cartStore";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartSidebar() {
    const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <>
            {/* OVERLAY — z-[60] para quedar encima del navbar (z-50) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] transition-opacity"
                    onClick={closeCart}
                />
            )}

            {/* SIDEBAR — z-[61] encima del overlay */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white border-l border-gray-200 z-[61] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-black" />
                        <h2 className="text-xl font-black uppercase italic text-black tracking-widest">
                            Tu Carrito
                        </h2>
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400 hover:text-black" />
                    </button>
                </div>

                {/* ITEMS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <ShoppingBag className="w-16 h-16 opacity-20" />
                            <p className="text-sm font-medium">Tu carrito está vacío</p>
                            <button
                                onClick={closeCart}
                                className="mt-4 px-6 py-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white text-xs font-bold uppercase rounded-full transition-colors"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">

                                {/* Eliminar */}
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Imagen */}
                                <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Detalles */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="text-sm font-bold text-black uppercase tracking-tight line-clamp-2 pr-6">
                                            {item.name}
                                        </h3>
                                        {item.size && (
                                            <p className="text-xs text-gray-500 mt-1 uppercase">Talla: <span className="text-black">{item.size}</span></p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-3 text-gray-400 hover:text-black transition-colors disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs font-bold text-black w-6 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-3 text-gray-400 hover:text-black transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <p className="text-black font-bold text-sm">
                                            ${item.price.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 bg-white p-6 space-y-4">

                        {/* Barra de envío gratis */}
                        {(() => {
                            const FREE_THRESHOLD = 999;
                            const subtotal = getSubtotal();
                            const remaining = Math.max(0, FREE_THRESHOLD - subtotal);
                            const progress = Math.min(100, (subtotal / FREE_THRESHOLD) * 100);
                            return remaining === 0 ? (
                                <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                    <span className="text-xs font-bold text-emerald-600">¡Envío gratis desbloqueado!</span>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1.5">
                                        Te faltan <span className="font-bold text-black">${remaining.toFixed(0)}</span> para envío gratis
                                    </p>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-xl font-bold text-black">${getSubtotal().toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase text-center tracking-wider">
                            Gastos de envío e impuestos calculados en el checkout.
                        </p>

                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="w-full bg-white border-2 border-black text-black hover:bg-black hover:text-white font-black uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            Proceder al Checkout
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
