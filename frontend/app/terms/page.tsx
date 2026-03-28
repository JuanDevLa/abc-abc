import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | Jerseys Raw",
  description: "Términos y condiciones de uso y compra en Jerseys Raw.",
  alternates: { canonical: "https://jerseysraw.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-th-secondary mb-2">Última actualización: marzo 2025</p>
        <h1 className="font-heading text-5xl mb-8">Términos y Condiciones</h1>

        <div className="prose prose-sm max-w-none space-y-8 text-th-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">1. Aceptación</h2>
            <p>
              Al acceder o realizar una compra en <strong>jerseysraw.com</strong>, aceptas estos Términos y
              Condiciones en su totalidad. Si no estás de acuerdo, por favor no uses el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">2. Productos y disponibilidad</h2>
            <p>
              Todos los productos están sujetos a disponibilidad de stock. Las imágenes son representativas;
              los colores reales pueden variar ligeramente según la pantalla. Nos reservamos el derecho de
              retirar cualquier producto del catálogo sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">3. Precios y pagos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Los precios están expresados en pesos mexicanos (MXN) e incluyen IVA.</li>
              <li>Aceptamos tarjetas de crédito y débito a través de Stripe.</li>
              <li>El cobro se realiza en el momento en que confirmas la compra.</li>
              <li>Nos reservamos el derecho de corregir errores de precio obvios antes de procesar el pedido.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">4. Envíos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Envío estándar:</strong> $99 MXN — 5 a 8 días hábiles.</li>
              <li><strong>Envío express:</strong> $199 MXN — 2 a 3 días hábiles.</li>
              <li><strong>Envío gratis</strong> en pedidos mayores a $999 MXN (envío estándar).</li>
              <li>Artículos de dropshipping no aplican costo de envío adicional.</li>
            </ul>
            <p className="mt-2">
              Los tiempos de entrega son estimados y pueden variar por causas externas. Una vez despachado
              el pedido, recibirás un correo con tu número de rastreo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">5. Cancelaciones</h2>
            <p>
              Puedes cancelar tu pedido dentro de las primeras <strong>2 horas</strong> después de realizarlo,
              siempre que no haya sido procesado. Pasado ese tiempo, no es posible cancelar. Para solicitar
              una cancelación escríbenos a{" "}
              <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">
                ayuda@jerseysraw.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">6. Devoluciones y cambios</h2>
            <p>
              Consulta nuestra{" "}
              <Link href="/returns" className="text-accent-DEFAULT underline">
                Política de Devoluciones
              </Link>{" "}
              para conocer los plazos y condiciones detalladas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">7. Propiedad intelectual</h2>
            <p>
              Todo el contenido del sitio (imágenes, textos, logotipos, diseño) es propiedad de Jerseys Raw
              o de sus licenciantes. Queda prohibida su reproducción o uso sin autorización escrita.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">8. Limitación de responsabilidad</h2>
            <p>
              Jerseys Raw no será responsable de daños indirectos, pérdidas de ingresos o cualquier daño
              consecuente derivado del uso del sitio o de los productos adquiridos más allá de lo permitido
              por la legislación mexicana aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">9. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia
              se someterá a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro
              fuero que pudiera corresponder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">10. Contacto</h2>
            <p>
              Para cualquier duda sobre estos términos escríbenos a{" "}
              <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">
                ayuda@jerseysraw.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-th-border flex flex-wrap gap-4 text-sm text-th-secondary">
          <Link href="/privacy" className="hover:text-th-primary transition-colors">Política de Privacidad</Link>
          <Link href="/returns" className="hover:text-th-primary transition-colors">Política de Devoluciones</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
