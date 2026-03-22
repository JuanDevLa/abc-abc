"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { ProductCard } from "./ProductCard";
import { api } from "@/lib/api";

interface ProductListingProps {
  title: string;
  products: any[];
  clubSlug?: string;
  enableFilters?: boolean;
  initialSearch?: string;
}

/* ─── Filtro Acordeón ─── */
const FilterSection = ({
  title, children, defaultOpen = false
}: {
  title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 py-5 first:border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left mb-2 group outline-none"
      >
        <span className="font-medium text-black text-[16px]">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-black" /> : <ChevronDown className="w-4 h-4 text-black" />}
      </button>
      {isOpen && <div className="space-y-1.5 mt-2">{children}</div>}
    </div>
  );
};

/* ─── Checkbox ─── */
const FilterCheckbox = ({
  label, checked, onChange
}: {
  label: string; checked: boolean; onChange: () => void
}) => (
  <label className="flex items-center gap-3 cursor-pointer group py-1">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        className="peer appearance-none w-5 h-5 border border-gray-300 rounded-[4px] checked:bg-black checked:border-black transition-colors"
      />
      <Check className="w-3.5 h-3.5 text-white absolute left-[3px] opacity-0 peer-checked:opacity-100 pointer-events-none" />
    </div>
    <span className="text-[16px] text-black group-hover:text-gray-600 transition-colors" onClick={(e) => e.stopPropagation()}>{label}</span>
  </label>
);

/* ─── Helpers para leer URL params ─── */
const parseList = (val: string | null): string[] =>
  val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];

const parsePriceRange = (min: string | null, max: string | null) => {
  if (!min || !max) return null;
  const a = Number(min), b = Number(max);
  return (isNaN(a) || isNaN(b)) ? null : { min: a, max: b };
};

/* ─── Constantes ─── */
const SORT_OPTIONS = [
  { value: "", label: "Destacados" },
  { value: "price_asc", label: "Menor Precio - Mayor Precio" },
  { value: "price_desc", label: "Mayor Precio - Menor Precio" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "newest", label: "Lo más nuevo" },
];

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const GENDERS = [
  { value: "HOMBRE", label: "Hombre" },
  { value: "MUJER", label: "Mujer" },
  { value: "UNISEX", label: "Unisex" },
];
const PRICE_RANGES = [
  { label: "$0 - $500", min: 0, max: 500 },
  { label: "$500 - $1,500", min: 500, max: 1500 },
  { label: "$1,500 - $2,500", min: 1500, max: 2500 },
  { label: "Más de $2,500", min: 2500, max: 99999 },
];

const COLORS = [
  { value: "Rojo", hex: "#DC2626" },
  { value: "Azul", hex: "#2563EB" },
  { value: "Blanco", hex: "#FFFFFF" },
  { value: "Negro", hex: "#000000" },
  { value: "Amarillo", hex: "#EAB308" },
  { value: "Verde", hex: "#16A34A" },
  { value: "Rosa", hex: "#EC4899" },
  { value: "Naranja", hex: "#EA580C" },
  { value: "Morado", hex: "#7C3AED" },
];

export const ProductListing = ({ title, products: initialProducts, clubSlug, enableFilters = true, initialSearch = "" }: ProductListingProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [showFiltersDesktop, setShowFiltersDesktop] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // ─── Filter state (inicializado desde URL) ───
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => parseList(searchParams.get("sizes")));
  const [selectedGenders, setSelectedGenders] = useState<string[]>(() => parseList(searchParams.get("genders")));
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(() => parseList(searchParams.get("leagues")));
  const [selectedClubs, setSelectedClubs] = useState<string[]>(() => parseList(searchParams.get("clubs")));
  const [selectedColors, setSelectedColors] = useState<string[]>(() => parseList(searchParams.get("colors")));
  const [selectedTags, setSelectedTags] = useState<string[]>(() => parseList(searchParams.get("tags")));
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(
    () => parsePriceRange(searchParams.get("minPrice"), searchParams.get("maxPrice"))
  );
  const [sort, setSort] = useState(() => searchParams.get("sort") || "");
  const [leagues, setLeagues] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // ─── Products state ───
  const [products, setProducts] = useState(initialProducts);
  const [totalCount, setTotalCount] = useState(initialProducts.length);
  const [loading, setLoading] = useState(false);

  // ─── Sync filtros → URL (sin recargar página) ───
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!enableFilters) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    const p = new URLSearchParams();
    if (initialSearch) p.set("search", initialSearch);
    if (selectedSizes.length > 0) p.set("sizes", selectedSizes.join(","));
    if (selectedGenders.length > 0) p.set("genders", selectedGenders.join(","));
    if (selectedLeagues.length > 0) p.set("leagues", selectedLeagues.join(","));
    if (selectedClubs.length > 0) p.set("clubs", selectedClubs.join(","));
    if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
    if (selectedColors.length > 0) p.set("colors", selectedColors.join(","));
    if (selectedPriceRange) {
      p.set("minPrice", String(selectedPriceRange.min));
      p.set("maxPrice", String(selectedPriceRange.max));
    }
    if (sort) p.set("sort", sort);

    const qs = p.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [selectedSizes, selectedGenders, selectedLeagues, selectedClubs, selectedTags, selectedColors, selectedPriceRange, sort, enableFilters, pathname, router, initialSearch]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch leagues, clubs, tags
  useEffect(() => {
    // Tags always needed
    api.get("/api/v1/tags")
      .then((data) => { if (Array.isArray(data)) setTags(data); })
      .catch(console.error);

    if (!clubSlug) {
      api.get("/api/v1/leagues")
        .then((data) => { if (Array.isArray(data)) setLeagues(data); })
        .catch(console.error);
    }
  }, [clubSlug]);

  // Build query & fetch when filters change
  useEffect(() => {
    if (!enableFilters) return;

    const params = new URLSearchParams();
    if (clubSlug) params.set("club", clubSlug);
    if (initialSearch) params.set("search", initialSearch);
    if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
    if (selectedGenders.length > 0) params.set("genders", selectedGenders.join(","));
    if (selectedLeagues.length > 0) params.set("leagues", selectedLeagues.join(","));
    if (selectedClubs.length > 0) params.set("clubs", selectedClubs.join(","));
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (selectedColors.length > 0) params.set("colors", selectedColors.join(","));
    if (selectedPriceRange) {
      params.set("minPrice", String(selectedPriceRange.min * 100));
      params.set("maxPrice", String(selectedPriceRange.max * 100));
    }
    if (sort) params.set("sort", sort);
    params.set("limit", "100");

    setLoading(true);
    api.get(`/api/v1/products?${params.toString()}`)
      .then((data) => {
        setProducts(data.items || []);
        setTotalCount(data.pagination?.total || data.items?.length || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clubSlug, initialSearch, selectedSizes, selectedGenders, selectedLeagues, selectedClubs, selectedTags, selectedColors, selectedPriceRange, sort, enableFilters]);

  // ─── Toggle helpers ───
  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };
  const selectPriceRange = (range: { min: number; max: number }) => {
    if (selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max) {
      setSelectedPriceRange(null);
    } else {
      setSelectedPriceRange(range);
    }
  };
  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedGenders([]);
    setSelectedLeagues([]);
    setSelectedClubs([]);
    setSelectedTags([]);
    setSelectedColors([]);
    setSelectedPriceRange(null);
    setSort("");
  };

  const activeFilterCount =
    selectedSizes.length + selectedGenders.length + selectedLeagues.length +
    selectedTags.length + selectedColors.length + (selectedPriceRange ? 1 : 0);

  // ─── Sidebar content ───
  // NOTE: This must NOT be a functional component `const FiltersContent = () => ...` 
  // because redefining a function component inside the render causes React to unmount and remount it completely on every render.
  // This was causing the `FilterSection` state to reset and collapse!
  // It is now evaluated as a regular JSX element variable.
  const filtersMarkup = (
    <div className="space-y-1">
      {/* Ligas (solo en catálogo, no en team page) */}
      {!clubSlug && leagues.length > 0 && (
        <FilterSection title="Ligas">
          {leagues.map((league) => (
            <FilterCheckbox
              key={league.id}
              label={league.name}
              checked={selectedLeagues.includes(league.slug)}
              onChange={() => toggle(selectedLeagues, league.slug, setSelectedLeagues)}
            />
          ))}
        </FilterSection>
      )}


      {/* Estilos (Dinámicos desde tags) */}
      {tags.length > 0 && (
        <FilterSection title="Estilos">
          {tags.map((tag) => (
            <FilterCheckbox
              key={tag.id}
              label={tag.name}
              checked={selectedTags.includes(tag.slug)}
              onChange={() => toggle(selectedTags, tag.slug, setSelectedTags)}
            />
          ))}
        </FilterSection>
      )}


      <FilterSection title="Género">
        {GENDERS.map((g) => (
          <FilterCheckbox
            key={g.value}
            label={g.label}
            checked={selectedGenders.includes(g.value)}
            onChange={() => toggle(selectedGenders, g.value, setSelectedGenders)}
          />
        ))}
      </FilterSection>

      <FilterSection
        title={
          <span className="flex items-center gap-2">
            <span>Tallas</span>
            <span className="text-[11px] font-normal text-gray-400 normal-case">(Envío Express)</span>
          </span>
        }
      >
        {SIZES.map((s) => (
          <FilterCheckbox key={s} label={s} checked={selectedSizes.includes(s)} onChange={() => toggle(selectedSizes, s, setSelectedSizes)} />
        ))}
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2 mt-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => toggle(selectedColors, c.value, setSelectedColors)}
              title={c.value}
              className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColors.includes(c.value) ? "border-black scale-110" : "border-gray-200 hover:border-gray-400"
                }`}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColors.includes(c.value) && (
                <Check className={`w-3.5 h-3.5 mx-auto ${c.value === "Negro" || c.value === "Azul" || c.value === "Morado" ? "text-white" : "text-black"}`} />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Comprar por precio">
        {PRICE_RANGES.map((range, i) => (
          <FilterCheckbox
            key={i}
            label={range.label}
            checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
            onChange={() => selectPriceRange(range)}
          />
        ))}
      </FilterSection>

      {/* Limpiar */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <button onClick={clearAllFilters} className="text-sm text-gray-500 underline hover:text-black transition-colors">
            Limpiar todos los filtros ({activeFilterCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <div className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
        <Navbar />
      </div>

      {/* ─── Mobile Filters Overlay ─── */}
      <div className={`fixed inset-0 z-[60] bg-white transform transition-transform duration-300 ease-in-out ${showFiltersMobile ? "translate-y-0" : "translate-y-full"} lg:hidden flex flex-col`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium">Filtros</h2>
          <button onClick={() => setShowFiltersMobile(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {filtersMarkup}
        </div>
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => setShowFiltersMobile(false)}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-base"
          >
            Ver {totalCount} resultados
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="pt-20 md:pt-32 pb-20 px-4 md:px-12 max-w-[1920px] mx-auto">

        {/* Header & Toolbar — SAME ROW with title left, controls right */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200 mb-6">
          {/* Título con contador */}
          <h1 className="text-xl md:text-2xl font-medium text-black tracking-tight uppercase">
            {title} <span className="text-gray-500 font-normal text-lg ml-1">({totalCount})</span>
          </h1>

          {/* Controls: filter toggle + sort — alineados a la derecha */}
          <div className="flex items-center gap-4">
            {/* Filtrar (mobile) */}
            <button
              onClick={() => setShowFiltersMobile(true)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-300 px-4 py-2 rounded-full whitespace-nowrap"
            >
              Filtrar <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Ocultar/Mostrar filtros (desktop) */}
            <button
              onClick={() => setShowFiltersDesktop(!showFiltersDesktop)}
              className="hidden lg:flex items-center gap-2 text-[16px] font-medium hover:text-gray-600 transition-colors whitespace-nowrap"
            >
              {showFiltersDesktop ? "Ocultar filtros" : "Mostrar filtros"}
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Separador vertical */}
            <div className="hidden lg:block w-px h-5 bg-gray-300" />

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1.5 text-sm md:text-[16px] font-medium whitespace-nowrap hover:text-gray-600 transition-colors"
              >
                Ordenar por
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-lg rounded-lg py-1 z-50">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSort(option.value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === option.value ? "bg-gray-100 font-bold" : "hover:bg-gray-50"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Grid: Sidebar + Products ─── */}
        <div className="flex items-start gap-12 transition-all">
          {/* Sidebar desktop */}
          <aside
            className={`hidden lg:block flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${showFiltersDesktop ? "w-64 opacity-100" : "w-0 opacity-0"
              }`}
          >
            <div className="min-h-[75vh] overflow-y-auto pr-4 scrollbar-hide pb-20 bg-white">
              {filtersMarkup}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 transition-all duration-500">
            {loading ? (
              <div className={`grid gap-x-3 gap-y-8 md:gap-x-4 md:gap-y-10 ${showFiltersDesktop ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                }`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-lg" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={`grid gap-x-3 gap-y-8 md:gap-x-4 md:gap-y-10 transition-all duration-500 ${showFiltersDesktop ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                }`}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center w-full bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <h3 className="text-xl font-medium text-black mb-2">No se encontraron productos</h3>
                <p className="text-gray-500">Intenta cambiar los filtros o busca otro equipo.</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="mt-4 text-sm text-black underline font-medium">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};