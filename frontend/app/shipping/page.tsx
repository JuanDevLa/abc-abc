
import Footer from "@/components/Footer";
import Link from "next/link";
import { Truck, Package, Globe } from "lucide-react";

export const metadata = {
  title: "Envío a todo México | Jerseys Raw",
  description: "Información sobre nuestros métodos y tiempos de envío.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-16">
        <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-th-secondary hover:text-th-primary transition-colors mb-8">
          ← Volver al inicio
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Envío a todo México</h1>
          <p className="text-th-secondary max-w-2xl mx-auto">
            Hacemos que tus jerseys lleguen a la puerta de tu casa de forma rápida y segura, estés donde estés.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Envío Estándar</h3>
            <p className="text-th-secondary text-sm mb-4">Llega en 5 a 8 días hábiles a cualquier parte de la república.</p>
            <p className="font-bold text-accent-DEFAULT">$99 MXN <span className="text-xs font-normal text-th-secondary ml-1">(Gratis en compras mayores a $999)</span></p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center transform md:-translate-y-4 shadow-md border-black/5">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2 h-[28px]">Envío Express (DHL)</h3>
            <p className="text-th-secondary text-sm mb-4">Para cuando no puedes esperar a ponerte la camiseta. Llega en 2 a 3 días hábiles.</p>
            <p className="font-bold text-accent-DEFAULT">$199 MXN</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Envío Internacional</h3>
            <p className="text-th-secondary text-sm mb-4">Productos importados o personalizados directamente de fábrica. 22-25 días hábiles.</p>
            <p className="font-bold text-accent-DEFAULT">Envío Gratuito</p>
          </div>
        </div>

        <div className="bg-theme-card p-8 rounded-2xl border border-th-border/20">
          <h2 className="text-2xl font-heading uppercase mb-4">Preguntas Frecuentes sobre envíos</h2>
          <div className="space-y-6 text-sm text-th-secondary">
            <div>
              <h4 className="font-bold text-th-primary mb-1">¿Cómo rastreo mi pedido?</h4>
              <p>Una vez que tu pedido sea despachado, recibirás un correo electrónico con tu guía de rastreo y el enlace directo a la paquetería.</p>
            </div>
            <div>
              <h4 className="font-bold text-th-primary mb-1">Me equivoqué en mi dirección, ¿puedo cambiarla?</h4>
              <p>Puedes solicitar un cambio de dirección dentro de las primeras 2 horas posteriores a la compra escribiéndonos a <a href="mailto:ayuda@jerseysraw.com" className="text-accent underline">ayuda@jerseysraw.com</a>.</p>
            </div>
            <div>
              <h4 className="font-bold text-th-primary mb-1">¿Qué pasa si mi pedido incluye artículos locales y de dropshipping?</h4>
              <p>Para no hacerte esperar, te enviaremos primero los artículos que tenemos en stock local, y posteriormente recibirás los artículos de dropshipping en un paquete separado.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-th-border/20">
            <Link href="/help" className="text-black font-bold underline hover:text-gray-600">Ver todas las preguntas frecuentes</Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
