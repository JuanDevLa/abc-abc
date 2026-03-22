import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // Clave única del carrito (composite)
    variantId: string; // ID real del ProductVariant en la DB
    productId: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    quantity: number;
    size?: string;
    hasLocalStock?: boolean; // NUEVO: Para distinguir "verdes" de dropshipping
    isCustomized?: boolean;
    customName?: string;
    customNumber?: string;
    customizationPrice?: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Computed values
    getTotalItems: () => number;
    getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === newItem.id);

                    if (existingItem) {
                        // Si ya existe, incrementar la cantidad
                        return {
                            items: state.items.map((item) =>
                                item.id === newItem.id
                                    ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                                    : item
                            ),
                            isOpen: true, // Abrir el carrito al agregar
                        };
                    }

                    // Si es nuevo, agregarlo al final
                    return {
                        items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }],
                        isOpen: true, // Abrir el carrito al agregar
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getSubtotal: () => {
                return get().items.reduce((total, item) => {
                    const itemPrice = item.price + (item.isCustomized && item.customizationPrice ? item.customizationPrice : 0);
                    return total + (itemPrice * item.quantity);
                }, 0);
            },
        }),
        {
            name: 'jerseys-raw-cart', // Clave en localStorage
        }
    )
);
