"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ShoppingCart, User, Search, Menu, LogOut, Package, ChevronDown } from "lucide-react";
import { useCartStore } from "@/app/store/cartStore";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// --- MENSAJES DEL CARRUSEL ---
const ANNOUNCEMENTS = [
  "ENVÍOS GRATIS a partir de $999 MXN",
  "AUTENTICIDAD GARANTIZADA • CALIDAD PREMIUM",
  "10% DE DESCUENTO EN TU PRIMERA COMPRA",
  "PAGO SEGURO • ENCRIPTACIÓN SSL",
];

interface InstantResult {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  clubName: string | null;
  categoryName: string | null;
}

// ─── DROPDOWN MENU DATA ───
const DROPDOWN_SUBCATEGORIES = [
  {
    label: "Novedades",
    description: "Lo más nuevo",
    tagFilter: "novedades",
    sort: "newest",
  },
  {
    label: "Retros",
    description: "Clásicos de siempre",
    tagFilter: "retro",
    sort: "",
  },
  {
    label: "Clubes",
    description: "Equipos del mundo",
    tagFilter: "clubes",
    sort: "",
  },
  {
    label: "Naciones",
    description: "Selecciones nacionales",
    tagFilter: "naciones",
    sort: "",
  },
];

const GENDER_MAP: Record<string, string> = {
  hombres: "HOMBRE",
  mujeres: "MUJER",
  ninos: "NINO",
};

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const { user, logout } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Instant Search Mega-Menu
  const [instantResults, setInstantResults] = useState<InstantResult[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Cart
  const { openCart, getTotalItems } = useCartStore();

  useEffect(() => { setMounted(true); }, []);

  // Carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      const scrolledToBottom = window.innerHeight + currentScrollY >= document.body.offsetHeight - 100;
      if (currentScrollY > lastScrollY && scrolledToBottom) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ── Debounced Instant Search (300ms) ──
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setInstantResults([]);
      setShowMenu(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/products/instant-search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (!res.ok) return;
        const data: InstantResult[] = await res.json();
        setInstantResults(data);
        setShowMenu(data.length > 0);
      } catch {
        setInstantResults([]);
        setShowMenu(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Cerrar mega-menu con Escape o click fuera ──
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        searchInputRef.current?.blur();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideMenu = megaMenuRef.current?.contains(target);
      const clickedInsideInput = searchInputRef.current?.contains(target);
      if (!clickedInsideMenu && !clickedInsideInput) {
        setShowMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ── Cerrar menú de usuario con click fuera ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setShowMenu(false);
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleResultClick = useCallback(() => {
    setShowMenu(false);
    setSearchQuery("");
  }, []);

  const solid = !isHomePage || isScrolled;

  const openDropdown = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(key);
  };

  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const buildDropdownUrl = (genderKey: string, sub: typeof DROPDOWN_SUBCATEGORIES[0]) => {
    const params = new URLSearchParams();
    const gender = GENDER_MAP[genderKey];
    if (gender) params.set("genders", gender);
    params.set("tags", sub.tagFilter);
    if (sub.sort) params.set("sort", sub.sort);
    return `/catalog?${params.toString()}`;
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${isHidden
        ? "-translate-y-full"
        : solid
          ? "-translate-y-[34px] md:-translate-y-[38px]"
          : "translate-y-0"
        }`}
    >
      {/* 1. BARRA DE ANUNCIOS */}
      <div className={`text-[10px] md:text-xs font-bold py-2.5 px-4 tracking-widest border-b relative z-50 h-[34px] md:h-[38px] transition-all duration-500 ${solid
        ? 'bg-th-announce text-th-primary border-th-border/20'
        : 'bg-transparent text-white border-white/10'
        }`}>
        <div className="container mx-auto flex justify-center md:justify-between items-center h-full">
          <div className="flex-1 text-center transition-all duration-500 ease-in-out pl-8 md:pl-19">
            <span key={currentIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {ANNOUNCEMENTS[currentIndex]}
            </span>
          </div>
          <div className="hidden md:flex gap-6 text-[10px] absolute right-6 opacity-70">
            <Link href="/help" className="hover:opacity-100 transition-opacity">AYUDA</Link>
            <Link href="/tracking" className="hover:opacity-100 transition-opacity">RASTREA TU ORDEN</Link>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR PRINCIPAL */}
      <div className={`w-full backdrop-blur-md border-b h-16 md:h-20 transition-all duration-500 ${solid
        ? 'bg-th-navbar/95 border-th-border/10 shadow-lg'
        : 'bg-transparent border-white/20 shadow-none'
        }`}>
        <div className="container mx-auto px-6 h-full flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-1 group">
            <span className={`text-2xl font-black italic tracking-tighter transition-colors duration-500 group-hover:opacity-80 ${solid ? 'text-th-primary' : 'text-white'
              }`}>JERSEYS</span>
            <span className="text-2xl font-black italic tracking-tighter text-accent">RAW</span>
          </Link>

          {/* MENÚ */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Hombres', key: 'hombres' },
              { label: 'Mujeres', key: 'mujeres' },
              { label: 'Niños',   key: 'ninos'   },
            ].map(({ label, key }) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => openDropdown(key)}
                onMouseLeave={closeDropdown}
              >
                {/* Trigger */}
                <button
                  className={`flex items-center gap-1 text-sm font-bold uppercase tracking-widest hover:text-accent transition-colors duration-300 ${solid ? 'text-th-primary' : 'text-white'}`}
                >
                  {label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === key ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Panel */}
                {activeDropdown === key && (
                  <div
                    onMouseEnter={() => openDropdown(key)}
                    onMouseLeave={closeDropdown}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 rounded-xl border border-white/10 shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{ background: 'rgb(var(--navbar-bg))' }}
                  >
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
                    </div>

                    {/* Items */}
                    <div className="py-1.5">
                      {DROPDOWN_SUBCATEGORIES.map((sub) => (
                        <Link
                          key={sub.label}
                          href={buildDropdownUrl(key, sub)}
                          onClick={() => setActiveDropdown(null)}
                          className="group flex flex-col gap-0.5 px-4 py-2.5 hover:bg-white/5 transition-colors duration-150"
                        >
                          <span className="text-sm font-bold text-white group-hover:text-accent transition-colors duration-150">
                            {sub.label}
                          </span>
                          <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors duration-150">
                            {sub.description}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Ver todo */}
                    <div className="border-t border-white/10 px-4 py-2.5">
                      <Link
                        href={`/catalog?genders=${GENDER_MAP[key]}`}
                        onClick={() => setActiveDropdown(null)}
                        className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-accent transition-colors duration-150"
                      >
                        Ver todo →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Outlet — sin dropdown */}
            <Link
              href="/catalog?tags=outlet"
              className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${solid ? 'text-th-sale hover:opacity-80' : 'text-white hover:text-accent'}`}
            >
              Outlet
            </Link>
          </nav>

          {/* ÍCONOS + SEARCH */}
          <div className={`flex items-center gap-3 transition-colors duration-500 ${solid ? 'text-th-primary' : 'text-white'
            }`}>
            {/* Search Input */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-secondary/60 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                onFocus={() => { if (instantResults.length > 0) setShowMenu(true); }}
                placeholder="Buscar"
                className={`w-40 lg:w-48 text-sm py-2 pl-9 pr-3 rounded-full outline-none transition-colors ${solid
                    ? "bg-theme-surface text-th-primary placeholder:text-th-secondary/50"
                    : "bg-white/10 text-white placeholder:text-white/50"
                  }`}
              />
            </div>

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="hover:text-accent transition-colors relative"
                aria-label="Mi cuenta"
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-150">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sesión iniciada</p>
                        <p className="text-sm font-medium truncate mt-0.5">{user.name ?? user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-gray-500" />
                        Mi cuenta y pedidos
                      </Link>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); router.push('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cuenta</p>
                      </div>
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-gray-600"
                      >
                        Crear cuenta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARRITO */}
            <button onClick={openCart} className="relative hover:text-accent transition-colors">
              {mounted && getTotalItems() > 0
                ? <ShoppingCart className="w-5 h-5" />
                : <ShoppingBag className="w-5 h-5" />
              }
              <span
                suppressHydrationWarning
                className={`absolute -top-2 -right-2 bg-accent-cta text-accent-cta-text text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full transition-opacity duration-200 ${mounted && getTotalItems() > 0 ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                {mounted ? getTotalItems() : 0}
              </span>
            </button>

            <button className="md:hidden"><Menu className="w-6 h-6" /></button>
          </div>

        </div>
      </div>

      {/* ── 3. MEGA-MENU (Full-width, estilo Nike) ── */}
      {showMenu && instantResults.length > 0 && (
        <div
          ref={megaMenuRef}
          className="absolute top-full inset-x-0 w-full bg-white text-black shadow-2xl z-[100] border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="container mx-auto p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {instantResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  onClick={handleResultClick}
                  className="group flex flex-col gap-2"
                >
                  {/* Imagen */}
                  <div className="aspect-[4/5] w-full overflow-hidden bg-gray-50 rounded-sm">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={300}
                        height={375}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
                    )}
                  </div>

                  {/* Textos */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-black truncate capitalize">{item.name.toLowerCase()}</h3>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {item.clubName || item.categoryName || "Jersey Oficial"}
                    </p>
                    <span className="text-sm text-black mt-1 font-medium">
                      ${item.price.toFixed(0)} MXN
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Ver todos los resultados */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                href={`/catalog?search=${encodeURIComponent(searchQuery.trim())}`}
                onClick={handleResultClick}
                className="text-sm font-bold text-black hover:underline"
              >
                Ver todos los resultados para &quot;{searchQuery.trim()}&quot; →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;