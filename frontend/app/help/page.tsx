
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageCircle, FileText, ShoppingBag, Truck } from "lucide-react";

export const metadata = {
  title: "Centro de Ayuda | Jerseys Raw",
  description: "Encuentra respuestas a todas tus dudas sobre Jerseys Raw.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-16">
        <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-th-secondary hover:text-th-primary transition-colors mb-8">
          ← Volver al inicio
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Centro de Ayuda</h1>
          <p className="text-th-secondary max-w-2xl mx-auto">
            ¿Tienes alguna duda? Hemos recopilado las preguntas más frecuentes para ayudarte.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Link href="/shipping" className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-black transition-colors">
            <div className="w-12 h-12 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Envíos y Entregas</h3>
              <p className="text-sm text-th-secondary">Tiempos, métodos y rastreo.</p>
            </div>
          </Link>
          <Link href="/returns" className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-black transition-colors">
            <div className="w-12 h-12 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cambios y Devoluciones</h3>
              <p className="text-sm text-th-secondary">Nuestra política de satisfacción.</p>
            </div>
          </Link>
          <Link href="/payment-methods" className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-black transition-colors">
            <div className="w-12 h-12 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pagos y Facturación</h3>
              <p className="text-sm text-th-secondary">Métodos aceptados y facturas.</p>
            </div>
          </Link>
          <a href="mailto:ayuda@jerseysraw.com" className="flex items-start gap-4 p-6 bg-black text-white rounded-2xl hover:bg-gray-900 transition-colors">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Contacto Directo</h3>
              <p className="text-sm text-white/80">Escríbenos, te respondemos pronto.</p>
            </div>
          </a>
        </div>

        <div className="space-y-12">
          <section id="facturacion">
            <h2 className="text-2xl font-heading uppercase mb-6 border-b border-gray-200 pb-2">Facturación</h2>
            <div className="space-y-4 text-sm text-th-secondary">
              <p>Para solicitar la factura de tu pedido, envíanos un correo a <strong>ayuda@jerseysraw.com</strong> con el asunto &ldquo;Facturación&rdquo; incluyendo:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Número de pedido (ej. JR-20250315-ABCD).</li>
                <li>Constancia de Situación Fiscal actualizada (PDF).</li>
                <li>Uso de CFDI.</li>
                <li>Forma de pago utilizada.</li>
              </ul>
              <p className="text-xs italic bg-amber-50 p-3 rounded text-amber-800">Nota: Tienes hasta el último día del mes en curso en que realizaste tu compra para solicitar la factura.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-heading uppercase mb-6 border-b border-gray-200 pb-2">Productos</h2>
            <div className="space-y-6 text-sm text-th-secondary">
              <div>
                <h4 className="font-bold text-th-primary mb-1">¿Qué diferencia hay entre Versión Jugador y Versión Fan?</h4>
                <p>Las playeras <strong>Versión Jugador</strong> son las mismas que usan los profesionales: corte más ajustado, telas más ligeras y logos termosellados. Las <strong>Versión Fan</strong> tienen un corte casual, tela estándar y escudos bordados, ideales para el uso diario o para apoyar en el estadio.</p>
              </div>
              <div>
                <h4 className="font-bold text-th-primary mb-1">¿Cómo sé mi talla?</h4>
                <p>Cada marca tiene ligeras variaciones. Recomendamos elegir tu talla habitual para Versión Fan, o considerar pedir una talla más grande si eliges Versión Jugador, ya que son ceñidas al cuerpo.</p>
              </div>
            </div>
          </section>
        </div>

      </main>

      <Footer />
    </div>
  );
}
