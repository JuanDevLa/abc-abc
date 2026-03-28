import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Términos y Condiciones | Jerseys Raw",
  description: "Términos y condiciones de uso, compra, envío y devoluciones de Jerseys Raw.",
  alternates: { canonical: "https://jerseysraw.com/terminos-y-condiciones" },
};

export default function TerminosCondicionesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-th-secondary mb-2">Última actualización: marzo 2026</p>
        <h1 className="font-heading text-5xl mb-8">Términos y Condiciones</h1>

        <div className="prose prose-sm max-w-none space-y-8 text-th-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">1. Partes</h2>
            <p>
              Los presentes Términos y Condiciones regulan la relación entre <strong>Juan Carlos Lara
              Clemente</strong>, persona física con actividad empresarial con domicilio en Tuxtla
              Gutiérrez, Chiapas, México, operando bajo la marca <strong>Jerseys Raw</strong>
              («Jerseys Raw», «nosotros»), y tú como usuario o comprador («cliente») del sitio
              web <strong>jerseysraw.com</strong>.
            </p>
            <p className="mt-3">
              Al realizar una compra o usar el sitio, aceptas estos términos en su totalidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">2. Productos y precios</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Todos los precios están expresados en <strong>pesos mexicanos (MXN)</strong> e incluyen IVA.</li>
              <li>Nos reservamos el derecho de modificar precios en cualquier momento sin previo aviso, excepto en pedidos ya confirmados y pagados.</li>
              <li>Las imágenes de los productos son referenciales. Colores y detalles pueden variar ligeramente respecto a la foto.</li>
              <li>La disponibilidad de stock se muestra en tiempo real. En caso de agotarse un producto después de tu compra, te contactaremos de inmediato para ofrecerte una alternativa o reembolso completo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">3. Proceso de compra</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Selecciona los productos y tallas que deseas en el catálogo.</li>
              <li>Agrégalos al carrito y procede al checkout.</li>
              <li>Proporciona tu información de envío y selecciona el método de entrega.</li>
              <li>Completa el pago a través de nuestra plataforma segura (<strong>Stripe</strong>).</li>
              <li>Recibirás una confirmación por correo electrónico con el número de tu pedido.</li>
            </ol>
            <p className="mt-3">
              Tu pedido queda confirmado únicamente al completarse el pago. Reservamos el derecho de
              cancelar pedidos en casos de error de precio, falta de stock o datos incorrectos,
              notificándote por correo y realizando el reembolso correspondiente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">4. Métodos de pago</h2>
            <p>
              Aceptamos pagos con tarjeta de crédito y débito (Visa, Mastercard, American Express)
              procesados por <strong>Stripe, Inc.</strong> bajo los más altos estándares de seguridad
              (PCI-DSS). No almacenamos datos de tarjetas en nuestros servidores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">5. Envíos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Realizamos envíos a toda la <strong>República Mexicana</strong> a través de <strong>Correos de México</strong> y servicios de paquetería.</li>
              <li>Los tiempos de entrega estimados van de <strong>3 a 10 días hábiles</strong> dependiendo de tu ubicación y la disponibilidad del producto.</li>
              <li>Pedidos con productos en stock local se procesan en 1–2 días hábiles. Pedidos con productos dropshipping pueden tomar entre 7–15 días hábiles.</li>
              <li>Recibirás un número de rastreo por correo una vez que tu pedido sea enviado. Puedes rastrear tu paquete en la sección <strong>"Rastrear pedido"</strong> de nuestro sitio.</li>
              <li>Jerseys Raw no se hace responsable por retrasos causados por la paquetería, desastres naturales, huelgas o situaciones fuera de nuestro control.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">6. Política de devoluciones y cambios</h2>

            <h3 className="text-base font-semibold text-th-primary mt-4 mb-2">6.1 Devoluciones</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tienes <strong>5 días naturales</strong> a partir de la fecha de recepción del producto para solicitar una devolución.</li>
              <li>El producto debe estar en <strong>perfecto estado</strong>: sin uso, sin daños, sin lavado, con etiquetas originales.</li>
              <li>Una vez que recibamos el producto y verifiquemos su estado, procesaremos el <strong>reembolso total</strong> al método de pago original. El tiempo de acreditación depende de tu banco (generalmente 5–10 días hábiles).</li>
              <li>El costo del envío de devolución corre <strong>a cargo del cliente</strong>, salvo que la devolución sea por un error de nuestra parte (ver sección 6.3).</li>
              <li>Los envíos de devolución se realizan a través de <strong>Correos de México</strong>.</li>
            </ul>

            <h3 className="text-base font-semibold text-th-primary mt-4 mb-2">6.2 Cambios</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Solo realizamos cambios cuando el <strong>error es de nuestra parte</strong>: producto incorrecto, talla equivocada enviada por nosotros, o defecto de fábrica.</li>
              <li>No realizamos cambios por preferencia personal del cliente (cambio de talla elegida por el cliente, cambio de diseño, etc.).</li>
            </ul>

            <h3 className="text-base font-semibold text-th-primary mt-4 mb-2">6.3 Pedidos personalizados</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Los pedidos con <strong>nombre y número personalizados</strong> no tienen devolución ni cambio, ya que se fabrican específicamente para el cliente.</li>
              <li>La única excepción es que el pedido llegue con un <strong>error cometido por Jerseys Raw</strong> (nombre o número incorrecto respecto a lo solicitado, defecto en la impresión). En ese caso, asumimos el costo total del cambio y envío.</li>
            </ul>

            <h3 className="text-base font-semibold text-th-primary mt-4 mb-2">6.4 Error de Jerseys Raw</h3>
            <p>
              Si recibes un producto diferente al ordenado o con un defecto imputable a nosotros:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>El cambio o reembolso es <strong>sin costo para ti</strong>.</li>
              <li>Nosotros cubrimos el costo del envío de devolución y el reenvío del producto correcto.</li>
              <li>Contáctanos dentro de los <strong>5 días naturales</strong> posteriores a la recepción con fotografías del error.</li>
            </ul>

            <div className="bg-th-border/10 border border-th-border/20 rounded-lg p-4 mt-4">
              <p className="font-medium text-th-primary">¿Cómo iniciar una devolución o cambio?</p>
              <p className="mt-1">
                Escríbenos a{" "}
                <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">ayuda@jerseysraw.com</a>
                {" "}o por{" "}
                <a href="https://wa.me/529651386865" target="_blank" rel="noopener noreferrer" className="text-accent-DEFAULT underline">
                  WhatsApp
                </a>
                {" "}indicando tu número de pedido y el motivo. Te responderemos en menos de 24 horas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">7. Personalización de jerseys</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>El servicio de nombre y número personalizado tiene un costo adicional indicado en el producto.</li>
              <li>Es responsabilidad del cliente verificar la ortografía del nombre y el número antes de confirmar el pedido.</li>
              <li>Una vez confirmado el pedido personalizado, <strong>no es posible modificarlo</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">8. Programa de recompensas</h2>
            <p>
              Jerseys Raw ofrece un programa de puntos para clientes registrados. Los puntos se acumulan
              con cada compra pagada y pueden canjearse por una jersey gratis al alcanzar el umbral
              establecido. Las condiciones del programa pueden cambiar con previo aviso. Los puntos
              no tienen valor monetario, no son transferibles y caducan si la cuenta permanece inactiva
              por más de 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">9. Propiedad intelectual</h2>
            <p>
              Todo el contenido del sitio (imágenes, textos, logotipos, diseños) es propiedad de
              Jerseys Raw o de sus respectivos titulares. Queda prohibida su reproducción,
              distribución o uso comercial sin autorización escrita previa.
            </p>
            <p className="mt-3">
              Los nombres de equipos, escudos y marcas de ligas deportivas pertenecen a sus respectivos
              dueños y se usan con fines descriptivos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">10. Limitación de responsabilidad</h2>
            <p>
              Jerseys Raw no será responsable por daños indirectos, pérdida de ganancias o perjuicios
              derivados del uso del sitio. Nuestra responsabilidad máxima se limita al valor del
              producto adquirido.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">11. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
              entran en vigor al publicarse en esta página. El uso continuado del sitio tras la
              publicación de cambios implica tu aceptación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">12. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se rigen por las leyes de los <strong>Estados Unidos Mexicanos</strong>.
              Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales
              competentes de <strong>Tuxtla Gutiérrez, Chiapas</strong>, renunciando a cualquier otro
              fuero que pudiera corresponderles por razón de domicilio presente o futuro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">13. Contacto</h2>
            <ul className="list-none pl-0 space-y-1">
              <li>📧 <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">ayuda@jerseysraw.com</a></li>
              <li>💬 <a href="https://wa.me/529651386865" target="_blank" rel="noopener noreferrer" className="text-accent-DEFAULT underline">WhatsApp: +52 965 138 6865</a></li>
              <li>📸 <a href="https://www.instagram.com/JERSEYS_RAW" target="_blank" rel="noopener noreferrer" className="text-accent-DEFAULT underline">@JERSEYS_RAW</a></li>
            </ul>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
