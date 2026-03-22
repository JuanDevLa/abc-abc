
import Footer from "@/components/Footer";
import Link from "next/link";
import { ShieldCheck, CreditCard } from "lucide-react";

export const metadata = {
  title: "Formas de Pago Seguro | Jerseys Raw",
  description: "Conoce todos los métodos de pago aceptados en Jerseys Raw y nuestra seguridad.",
};

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-th-secondary hover:text-th-primary transition-colors mb-8">
          ← Volver al inicio
        </Link>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#F5EDE4] text-[#B8977E] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-4xl mb-4">Pago 100% Seguro</h1>
          <p className="text-th-secondary max-w-lg mx-auto">
            Utilizamos tecnología de encriptación de nivel bancario a través de Stripe para garantizar que tus datos estén protegidos en todo momento.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
            <CreditCard className="w-6 h-6 text-black" />
            <h2 className="text-xl font-bold">Tarjetas de Crédito y Débito</h2>
          </div>
          <div className="p-6 md:p-8">
            <p className="text-sm text-th-secondary mb-6">Aceptamos todas las tarjetas respaldadas por Visa, Mastercard y American Express.</p>
            <div className="flex gap-4 flex-wrap">
              <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898213/visa-10_wyt5i3.svg" alt="Visa" className="h-8 object-contain" />
              <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898212/mastercard-modern-design-_gsyd1p.svg" alt="Mastercard" className="h-8 object-contain" />
              <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898212/american-express-1_v71nnx.svg" alt="AMEX" className="h-8 object-contain" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
            <h2 className="text-xl font-bold">Pagos Digitales y Efectivo</h2>
          </div>
          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
            <div>
              <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898211/paypal-3_ai1tll.svg" alt="PayPal" className="h-8 object-contain mb-4" />
              <h3 className="font-bold mb-2">PayPal</h3>
              <p className="text-sm text-th-secondary">Paga de forma rápida y segura vinculando tus tarjetas a tu cuenta de PayPal. (Sujeto a meses sin intereses según promociones vigentes).</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898211/spei-1_zdinhs.svg" alt="SPEI" className="h-6 object-contain" />
                <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772897874/oxxo-logo_dm1spz.svg" alt="OXXO" className="h-6 object-contain ml-2" />
              </div>
              <h3 className="font-bold mb-2">OXXO y Transferencia (SPEI)</h3>
              <p className="text-sm text-th-secondary">Al elegir esta opción en el checkout, se generará una ficha para que pagues en efectivo en cualquier OXXO o los datos CLABE para hacer transferencia desde tu banca móvil.</p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
