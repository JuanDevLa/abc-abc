import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | Jerseys Raw",
  description: "Cómo recopilamos, usamos y protegemos tu información personal en Jerseys Raw.",
  alternates: { canonical: "https://jerseysraw.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-th-secondary mb-2">Última actualización: marzo 2025</p>
        <h1 className="font-heading text-5xl mb-8">Política de Privacidad</h1>

        <div className="prose prose-sm max-w-none space-y-8 text-th-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">1. Responsable del tratamiento</h2>
            <p>
              Jerseys Raw («nosotros», «nuestro») es el responsable del tratamiento de los datos personales que recopilamos a
              través del sitio web <strong>jerseysraw.com</strong>. Puedes contactarnos en{" "}
              <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">
                ayuda@jerseysraw.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">2. Datos que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos de registro:</strong> nombre, correo electrónico y contraseña cifrada.</li>
              <li><strong>Datos de compra:</strong> dirección de envío, teléfono e historial de pedidos.</li>
              <li><strong>Datos de pago:</strong> procesados directamente por Stripe; no almacenamos números de tarjeta.</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo y páginas visitadas (analytics anónimo).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">3. Finalidades del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Procesar y gestionar tus pedidos.</li>
              <li>Enviarte confirmaciones de compra y actualizaciones de envío por correo.</li>
              <li>Mejorar la experiencia de navegación y el catálogo de productos.</li>
              <li>Cumplir con obligaciones legales y fiscales aplicables en México.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">4. Base legal</h2>
            <p>
              Tratamos tus datos con base en la ejecución del contrato de compraventa (Art. 8, LFPDPPP), el
              cumplimiento de obligaciones legales y, en su caso, tu consentimiento explícito para comunicaciones
              de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">5. Compartición de datos</h2>
            <p>No vendemos ni cedemos tus datos. Los compartimos únicamente con:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Stripe</strong> – procesamiento de pagos.</li>
              <li><strong>Proveedores de logística</strong> – para el cumplimiento y envío de pedidos.</li>
              <li><strong>Brevo</strong> – envío de correos transaccionales.</li>
            </ul>
            <p className="mt-2">Todos operan bajo sus propias políticas de privacidad y medidas de seguridad adecuadas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">6. Conservación de datos</h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa o sea necesario para cumplir
              con obligaciones legales (máximo 5 años para datos fiscales según el SAT).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">7. Tus derechos (ARCO)</h2>
            <p>
              Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
              (LFPDPPP), tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al
              tratamiento de tus datos. Para ejercerlos escríbenos a{" "}
              <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">
                ayuda@jerseysraw.com
              </a>{" "}
              con asunto «Derechos ARCO».
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies estrictamente necesarias para el funcionamiento del carrito y la sesión,
              y cookies analíticas anónimas. Puedes deshabilitar las cookies en la configuración de tu
              navegador, aunque algunas funciones del sitio pueden verse afectadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos por correo si los cambios
              son sustanciales. La fecha de la última actualización siempre aparecerá al inicio de esta página.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-th-border flex flex-wrap gap-4 text-sm text-th-secondary">
          <Link href="/terms" className="hover:text-th-primary transition-colors">Términos y Condiciones</Link>
          <Link href="/returns" className="hover:text-th-primary transition-colors">Política de Devoluciones</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
