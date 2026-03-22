
import Footer from "@/components/Footer";
import Link from "next/link";
import { User, Star, Clock, Gift } from "lucide-react";

export const metadata = {
  title: "Beneficios de tu Cuenta | Jerseys Raw",
  description: "Crea una cuenta para disfrutar exclusivas ventajas.",
};

export default function AccountBenefitsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="flex justify-start">
          <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-th-secondary hover:text-th-primary transition-colors mb-8">
            ← Volver al inicio
          </Link>
        </div>
        
        <h1 className="font-heading text-4xl md:text-5xl mb-4">Únete a la Familia Raw</h1>
        <p className="text-th-secondary max-w-2xl mx-auto mb-16">
          Comprar como invitado es rápido, pero tener una cuenta eleva la experiencia. Descubre por qué.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-bold mb-2">Checkout Veloz</h3>
            <p className="text-sm text-th-secondary text-center">Guarda tus direcciones y tarjetas de manera segura para comprar en un solo clic.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-bold mb-2">Historial de Órdenes</h3>
            <p className="text-sm text-th-secondary text-center">Accede a todo tu registro de compras y obtén los números de rastreo al instante.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-bold mb-2">Reseñas Exclusivas</h3>
            <p className="text-sm text-th-secondary text-center">Solo las cuentas registradas pueden dejar valoraciones y calificar productos comprados.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-black" />
            </div>
            <h3 className="font-bold mb-2">Promos Especiales</h3>
            <p className="text-sm text-th-secondary text-center">Recibe el newsletter con accesos anticipados y cupones solo para miembros.</p>
          </div>
        </div>

        <Link href="/login" className="inline-block bg-black text-white font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-colors">
          Crear una cuenta gratis
        </Link>
      </main>

      <Footer />
    </div>
  );
}
