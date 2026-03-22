import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Política de Devoluciones | Jerseys Raw",
  description: "Plazos, condiciones y proceso de devolución o cambio en Jerseys Raw.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-th-secondary mb-2">Última actualización: marzo 2025</p>
        <h1 className="font-heading text-5xl mb-8">Política de Devoluciones</h1>

        <div className="prose prose-sm max-w-none space-y-8 text-th-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Plazo para devoluciones</h2>
            <p>
              Aceptamos devoluciones dentro de los <strong>15 días naturales</strong> posteriores a la
              fecha de entrega de tu pedido. Pasado este plazo no podremos procesar devoluciones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Condiciones del producto</h2>
            <p>Para que una devolución sea aceptada, el artículo debe:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Estar sin usar, sin lavar y sin daños.</li>
              <li>Conservar todas las etiquetas y empaques originales.</li>
              <li>No presentar olores, manchas ni señales de uso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Artículos que no aplican devolución</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Productos en oferta o liquidación marcados como «venta final».</li>
              <li>Artículos personalizados (nombre, número impreso).</li>
              <li>Productos de dropshipping — consulta directamente con el proveedor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Cómo iniciar una devolución</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Escríbenos a{" "}
                <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">
                  ayuda@jerseysraw.com
                </a>{" "}
                con el asunto <strong>«Devolución #NÚMERO_DE_ORDEN»</strong>.
              </li>
              <li>Incluye el motivo de la devolución y fotos del producto si hay algún defecto.</li>
              <li>Te responderemos en un plazo máximo de <strong>2 días hábiles</strong> con las instrucciones de envío.</li>
              <li>Envía el producto con empaque seguro. El costo del flete de regreso es responsabilidad del cliente,
                salvo que el artículo tenga un defecto de fábrica.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Proceso de reembolso</h2>
            <p>
              Una vez que recibamos e inspeccionemos el artículo, te notificaremos por correo. Si la
              devolución es aprobada:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>El reembolso se acredita al método de pago original en un plazo de <strong>5 a 10 días hábiles</strong>.</li>
              <li>El costo de envío original no es reembolsable, salvo que el error haya sido nuestro.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Cambios de talla</h2>
            <p>
              Si necesitas cambiar la talla de un artículo, inicia el proceso como una devolución normal.
              Una vez aprobada, puedes realizar un nuevo pedido con la talla correcta. No realizamos
              cambios directos por el momento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">Artículos defectuosos o incorrectos</h2>
            <p>
              Si recibiste un producto con defecto de fábrica o distinto al que pediste, cúbrenos los
              gastos de envío de regreso y te enviaremos el artículo correcto sin costo adicional —
              o te reembolsamos el total si no hay disponibilidad.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-th-border flex flex-wrap gap-4 text-sm text-th-secondary">
          <Link href="/terms" className="hover:text-th-primary transition-colors">Términos y Condiciones</Link>
          <Link href="/privacy" className="hover:text-th-primary transition-colors">Política de Privacidad</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
