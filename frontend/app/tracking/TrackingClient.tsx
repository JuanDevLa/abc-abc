"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Package,
  MapPin,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  Globe2,
  Shield,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TrackingEvent {
  time: string;
  description: string;
  location: string;
}

interface TrackingData {
  trackingNumber: string;
  carrier: string;
  status: string;
  subStatus: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

// ─── STATUS → STEP INDEX MAPPING ─────────────────────────────────────────────
const STATUS_TO_STEP: Record<string, number> = {
  NotFound: 0,
  InfoReceived: 0,
  InTransit: 2,
  AvailableForPickup: 4,
  OutForDelivery: 4,
  DeliveryFailure: 3,
  Delivered: 5,
  Expired: 2,
};

function getStep(status: string, subStatus: string, events: TrackingEvent[]): number {
  if (status === "Delivered") return 5;
  if (status === "OutForDelivery" || subStatus === "OutForDelivery") return 4;

  let maxStep = STATUS_TO_STEP[status] ?? 0;

  for (const event of events) {
    const desc = event.description.toLowerCase();
    const loc = (event.location || "").toLowerCase();

    if (desc.includes("delivered") || desc.includes("entregado")) return 5;

    if (desc.includes("out for delivery") || desc.includes("派送") ||
      (desc.includes("transfer in recipient") && loc && !loc.includes("cuautitlán") && !loc.includes("mx") && !loc.includes("mexico"))) {
      maxStep = Math.max(maxStep, 4);
    } else if (desc.includes("handover to lastmile") || desc.includes("recipient's country")) {
      maxStep = Math.max(maxStep, 3);
    } else if (desc.includes("arrived at airport") || desc.includes("customs") || desc.includes("mexico") || desc.includes("nlu")) {
      maxStep = Math.max(maxStep, 2);
    } else if (desc.includes("air transport") || desc.includes("departed from airport") || desc.includes("vuelo")) {
      maxStep = Math.max(maxStep, 1);
    } else if (desc.includes("processed") || desc.includes("received in operation hub") || desc.includes("left operation hub")) {
      maxStep = Math.max(maxStep, 0);
    }
  }

  return maxStep;
}

function translateEvent(description: string, location: string): string {
  const lower = description.toLowerCase();
  const locLower = location.toLowerCase();

  if (lower.includes("received in operation hub")) return "Paquete recibido en centro de operaciones";
  if (lower.includes("processed in operation hub")) return "Tu pedido se ha procesado y está listo para volar";
  if (lower.includes("left operation hub") && !lower.includes("lastmile")) return "Paquete salió del centro de operaciones de origen";
  if (lower.includes("handover to air transport")) return "Enviado al Operador Aéreo";
  if (lower.includes("departed from airport")) return "Vuelo internacional en tránsito";
  if (lower.includes("arrived at airport")) return "Llegada al Aeropuerto de Destino";
  if (lower.includes("in customs clearance")) return "En proceso de revisión aduanal";
  if (lower.includes("customs clearance completed")) return "Liberado por la aduana";
  if (lower.includes("handover to lastmile")) return "Entregado a la paquetería local";
  if (lower.includes("transfer in recipient")) {
    if (locLower.includes("cuautitlán") || locLower.includes("izcalli")) return "Recolectado por la paquetería (Centro de Distribución)";
    if (locLower.includes("mexico") || locLower.includes("mx")) return "En tránsito dentro del país destino";
    return "En ruta de entrega a tu domicilio / En tránsito a tu localidad";
  }
  if (lower.includes("派送") || lower.includes("out for delivery")) return "En ruta de entrega a tu domicilio";
  if (lower.includes("delivered")) return "Paquete entregado exitosamente";

  return description;
}


const STEPS = [
  { id: "registered", label: "Procesado", sublabel: "Tu pedido se ha procesado y está listo para volar", Icon: Package },
  { id: "origin", label: "Enviado al Operador Aéreo", sublabel: "En vuelo", Icon: Globe2 },
  { id: "transit", label: "Llegada al Aeropuerto de Destino", sublabel: "Aduana / Descarga", Icon: Shield },
  { id: "customs", label: "Recolectado por la paquetería", sublabel: "Clasificación local", Icon: MapPin },
  { id: "delivery", label: "En Entrega", sublabel: "Rumbo a tu domicilio", Icon: Truck },
  { id: "delivered", label: "Entregado", sublabel: "¡Completado!", Icon: CheckCircle },
];

// ─── ANIMATED GLOBE ───────────────────────────────────────────────────────────
function GlobeVisualization() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="sphereGrad" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#252630" />
          <stop offset="55%" stopColor="#10111a" />
          <stop offset="100%" stopColor="#04040a" />
        </radialGradient>
        <radialGradient id="atmosphereGlow" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="#F8C37C" stopOpacity="0" />
          <stop offset="100%" stopColor="#F8C37C" stopOpacity="0.09" />
        </radialGradient>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="strongGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="globeClip">
          <circle cx="200" cy="200" r="182" />
        </clipPath>
        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F8C37C" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#F8C37C" stopOpacity="1" />
          <stop offset="100%" stopColor="#F8C37C" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Atmosphere */}
      <circle cx="200" cy="200" r="200" fill="url(#atmosphereGlow)" />

      {/* Sphere */}
      <circle cx="200" cy="200" r="182" fill="url(#sphereGrad)" />

      {/* Grid lines */}
      <g clipPath="url(#globeClip)">
        {/* Parallels */}
        {([-60, -30, 0, 30, 60] as number[]).map((lat) => {
          const rad = (lat * Math.PI) / 180;
          const y = 200 - 182 * Math.sin(rad);
          const rx = 182 * Math.cos(rad);
          return (
            <ellipse
              key={lat}
              cx="200"
              cy={y}
              rx={rx}
              ry={rx * 0.22}
              fill="none"
              stroke="#F8C37C"
              strokeWidth="0.5"
              strokeOpacity="0.13"
            />
          );
        })}
        {/* Meridians */}
        {([0, 30, 60, 90, 120, 150] as number[]).map((lon) => {
          const rad = (lon * Math.PI) / 180;
          const rx = 182 * Math.abs(Math.cos(rad));
          return (
            <ellipse
              key={lon}
              cx="200"
              cy="200"
              rx={rx}
              ry="182"
              fill="none"
              stroke="#F8C37C"
              strokeWidth="0.5"
              strokeOpacity="0.10"
            />
          );
        })}
      </g>

      {/* Sphere ring */}
      <circle cx="200" cy="200" r="182" fill="none" stroke="#F8C37C" strokeWidth="0.8" strokeOpacity="0.22" />

      {/* Route: China (290,150) → Mexico (112,165), arcs north over Pacific */}
      <path
        d="M 290 150 C 265 48, 138 48, 112 162"
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="1.8"
        strokeDasharray="6 3"
        filter="url(#glow)"
        opacity="0.9"
      />

      {/* China origin — pulse */}
      <circle cx="290" cy="150" r="5" fill="#F8C37C" filter="url(#glow)" />
      <circle cx="290" cy="150" r="5" fill="#F8C37C" opacity="0.5">
        <animate attributeName="r" values="5;20;5" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Mexico destination — dimmer pulse */}
      <circle cx="112" cy="162" r="5" fill="#F8C37C" filter="url(#glow)" opacity="0.55" />
      <circle cx="112" cy="162" r="5" fill="#F8C37C" opacity="0.25">
        <animate attributeName="r" values="5;20;5" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0;0.25" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
      </circle>

      {/* Moving package dot */}
      <circle r="5" fill="white" filter="url(#strongGlow)">
        <animateMotion
          path="M 290 150 C 265 48, 138 48, 112 162"
          dur="3.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Country labels */}
      <text x="300" y="145" fill="#F8C37C" fontSize="9" fontFamily="monospace" opacity="0.75" letterSpacing="1">
        SRC
      </text>
      <text x="88" y="180" fill="#F8C37C" fontSize="9" fontFamily="monospace" opacity="0.75" letterSpacing="1">
        DEST
      </text>
    </svg>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────
function TrackingTimeline({ data }: { data: TrackingData }) {
  const currentStep = getStep(data.status, data.subStatus, data.events);

  return (
    <div className="relative">
      {STEPS.map((step, idx) => {
        const completed = idx < currentStep;
        const active = idx === currentStep;
        const pending = idx > currentStep;
        const isLast = idx === STEPS.length - 1;

        // Pick the event that corresponds to this step (mapping newest events to current steps)
        const eventIdx = currentStep - idx;
        const event = eventIdx >= 0 && eventIdx < data.events.length ? data.events[eventIdx] : null;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Indicator column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-500 ${completed ? "border-[#F8C37C] bg-[#F8C37C]/10" : ""
                  } ${active
                    ? "border-[#F8C37C] bg-[#F8C37C]/15 shadow-[0_0_16px_rgba(248,195,124,0.35)]"
                    : ""
                  } ${pending ? "border-white/10 bg-white/2" : ""}`}
              >
                <step.Icon
                  className={`w-4 h-4 ${completed || active ? "text-[#F8C37C]" : "text-white/20"
                    }`}
                />
              </div>
              {!isLast && (
                <div
                  className={`w-px flex-1 my-1 min-h-[2rem] transition-colors duration-500 ${completed ? "bg-[#F8C37C]/35" : "bg-white/8"
                    }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`font-heading text-lg tracking-widest ${completed || active ? "text-[#F8C37C]" : "text-white/22"
                      }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${completed || active ? "text-white/45" : "text-white/18"
                      }`}
                  >
                    {active && event?.location ? event.location : step.sublabel}
                  </p>
                </div>
                {(completed || active) && event && (
                  <p className="text-[10px] text-white/30 whitespace-nowrap mt-1 font-mono">
                    {new Date(event.time).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              {active && event && (
                <div className="mt-2 px-3 py-2.5 rounded-lg bg-[#F8C37C]/5 border border-[#F8C37C]/12">
                  <p className="text-xs text-white/65 leading-relaxed">{translateEvent(event.description, event.location || "")}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TrackingClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const json = await api.post<TrackingData>("/api/v1/tracking", { trackingNumber: trimmed });
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = data ? getStep(data.status, data.subStatus, data.events) : 0;
  const progressPct = Math.round((currentStep / (STEPS.length - 1)) * 100);

  const daysRemaining =
    data?.estimatedDelivery
      ? Math.max(
        0,
        Math.ceil(
          (new Date(data.estimatedDelivery).getTime() - Date.now()) / 86_400_000
        )
      )
      : null;

  return (
    <main className="min-h-screen bg-[#090909] text-white pt-6 relative">
      {/* ── BACK BUTTON ─────────────────────────────────────────────────── */}
      <div className="absolute top-8 left-6 md:left-12 z-20">
        <Link
          href="/"
          className="inline-flex items-center text-[10px] md:text-xs font-bold uppercase tracking-[3px] text-white/40 hover:text-[#F8C37C] transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[82vh] overflow-hidden px-6 pt-10">
        {/* Background radial */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full bg-[#F8C37C]/[0.04] blur-[120px]" />
        </div>

        {/* Globe */}
        <div className="relative w-[240px] h-[240px] md:w-[320px] md:h-[320px] mb-8">
          {mounted && <GlobeVisualization />}
        </div>

        {/* Headings */}
        <div className="text-center mb-3">
          <h1
            className="text-5xl md:text-7xl tracking-[0.15em] leading-none mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-white">RASTREA TU</span>{" "}
            <span style={{ color: "#F8C37C" }}>PEDIDO</span>
          </h1>
          <p className="text-white/35 text-xs tracking-[4px] uppercase mt-3">
            Seguimiento en tiempo real · Origen → Destino
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="w-full max-w-[560px] mt-8">
          <div
            className="flex rounded-xl overflow-hidden border bg-white/[0.03] backdrop-blur-sm transition-all duration-300 focus-within:bg-white/[0.05]"
            style={{
              borderColor: "rgba(248,195,124,0.2)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(248,195,124,0.5)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(248,195,124,0.2)")
            }
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: JR123456789"
              className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/25 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 font-bold text-sm tracking-[3px] uppercase flex items-center gap-2 transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#F8C37C", color: "#000" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#DCA55A")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8C37C")
              }
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? "..." : "Buscar"}
            </button>
          </div>
        </form>
      </section>

      {/* ── ERROR STATE ─────────────────────────────────────────────────── */}
      {error && (
        <section className="max-w-xl mx-auto px-6 pb-16 -mt-10">
          <div className="flex gap-3 items-start p-4 rounded-xl bg-red-500/5 border border-red-500/18">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Error al rastrear</p>
              <p className="text-xs text-white/45 mt-1">{error}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── RESULTS ─────────────────────────────────────────────────────── */}
      {data && (
        <section className="max-w-5xl mx-auto px-6 pb-24 -mt-8">
          {/* Section divider */}
          <div className="flex items-center gap-5 mb-12">
            <div className="flex-1 h-px bg-white/6" />
            <span
              className="text-[10px] tracking-[5px] uppercase font-mono"
              style={{ color: "rgba(248,195,124,0.55)" }}
            >
              Resultado
            </span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <div className="grid md:grid-cols-5 gap-5">
            {/* LEFT: Timeline */}
            <div className="md:col-span-3">
              <div
                className="rounded-2xl p-6 md:p-8 h-full"
                style={{
                  border: "1px solid rgba(248,195,124,0.1)",
                  background: "rgba(255,255,255,0.018)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-start justify-between mb-8 gap-4">
                  <div>
                    <h2
                      className="text-2xl tracking-[4px]"
                      style={{ fontFamily: "var(--font-heading)", color: "#F8C37C" }}
                    >
                      SEGUIMIENTO
                    </h2>
                    <p className="text-[11px] text-white/32 font-mono mt-1 tracking-wider">
                      {data.trackingNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Carrier</p>
                    <p className="text-sm font-semibold text-white/65 mt-0.5">{data.carrier}</p>
                  </div>
                </div>

                <TrackingTimeline data={data} />
              </div>
            </div>

            {/* RIGHT: Info cards */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {/* Estimated delivery */}
              {data.estimatedDelivery && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    border: "1px solid rgba(248,195,124,0.18)",
                    background: "rgba(248,195,124,0.04)",
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[4px] mb-3 flex items-center gap-2"
                    style={{ color: "rgba(248,195,124,0.6)" }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Entrega estimada
                  </p>
                  <p
                    className="text-3xl tracking-wider"
                    style={{ fontFamily: "var(--font-heading)", color: "#F8C37C" }}
                  >
                    {new Date(data.estimatedDelivery).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  {daysRemaining !== null && (
                    <>
                      <p className="text-white/38 text-xs mt-1">
                        {daysRemaining === 0
                          ? "¡Hoy llega!"
                          : `${daysRemaining} días restantes`}
                      </p>
                      <div className="mt-4">
                        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${progressPct}%`,
                              background:
                                "linear-gradient(90deg, rgba(248,195,124,0.6) 0%, #F8C37C 100%)",
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/22 mt-1.5">
                          <span>Enviado</span>
                          <span>{progressPct}%</span>
                          <span>Entregado</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Route */}
              <div
                className="rounded-2xl p-5"
                style={{
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.018)",
                }}
              >
                <p className="text-[10px] text-white/32 uppercase tracking-[4px] mb-4">Ruta</p>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Package className="w-8 h-8 text-white/40 mx-auto" strokeWidth={1} />
                    <p className="text-[10px] text-white/32 mt-2">Origen</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <div
                      className="flex-1 border-t border-dashed"
                      style={{ borderColor: "rgba(248,195,124,0.2)" }}
                    />
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(248,195,124,0.4)" }} />
                  </div>
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-[#F8C37C]/80 mx-auto" strokeWidth={1} />
                    <p className="text-[10px] text-white/32 mt-2">Destino</p>
                  </div>
                </div>
                <p className="text-[10px] text-white/20 mt-4 text-center">Logística y Distribución</p>
              </div>

              {/* Latest event */}
              {data.events.length > 0 && (
                <div
                  className="rounded-2xl p-5 flex-1"
                  style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.018)",
                  }}
                >
                  <p className="text-[10px] text-white/32 uppercase tracking-[4px] mb-3">
                    Último evento
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {translateEvent(data.events[0].description, data.events[0].location || "")}
                  </p>
                  {data.events[0].location && (
                    <p
                      className="text-[11px] mt-2 flex items-center gap-1"
                      style={{ color: "rgba(248,195,124,0.5)" }}
                    >
                      <MapPin className="w-3 h-3" />
                      {data.events[0].location}
                    </p>
                  )}
                  <p className="text-[10px] text-white/22 mt-2">
                    {new Date(data.events[0].time).toLocaleString("es-MX")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Full event log */}
          {data.events.length > 1 && (
            <div
              className="mt-5 rounded-2xl p-6 md:p-8"
              style={{
                border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.018)",
              }}
            >
              <h3
                className="text-lg tracking-[5px] text-white/40 mb-6"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                HISTORIAL COMPLETO
              </h3>
              <div className="space-y-4">
                {data.events.map((e, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            i === 0 ? "#F8C37C" : "rgba(248,195,124,0.25)",
                        }}
                      />
                      {i < data.events.length - 1 && (
                        <div
                          className="w-px flex-1 mt-1 min-h-[1.5rem]"
                          style={{ backgroundColor: "rgba(248,195,124,0.1)" }}
                        />
                      )}
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <p className={`text-sm ${i === 0 ? "text-white/75" : "text-white/45"}`}>
                          {translateEvent(e.description, e.location || "")}
                        </p>
                        <p className="text-[10px] text-white/25 whitespace-nowrap font-mono mt-0.5">
                          {new Date(e.time).toLocaleDateString("es-MX", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {e.location && (
                        <p
                          className="text-[11px] mt-0.5 flex items-center gap-1"
                          style={{ color: "rgba(248,195,124,0.38)" }}
                        >
                          <MapPin className="w-3 h-3" />
                          {e.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
