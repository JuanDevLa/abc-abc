import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Aviso de Privacidad | Jerseys Raw",
  description: "Aviso de privacidad de Jerseys Raw conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
  alternates: { canonical: "https://jerseysraw.com/aviso-de-privacidad" },
};

export default function AvisoPrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-th-secondary mb-2">Última actualización: marzo 2026</p>
        <h1 className="font-heading text-5xl mb-8">Aviso de Privacidad</h1>

        <div className="prose prose-sm max-w-none space-y-8 text-th-secondary leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">1. Responsable del tratamiento</h2>
            <p>
              Juan Carlos Lara Clemente, persona física con actividad empresarial, con domicilio en
              Tuxtla Gutiérrez, Chiapas, México, es el responsable del tratamiento de tus datos
              personales a través del sitio web <strong>jerseysraw.com</strong> (en adelante «Jerseys Raw»,
              «nosotros» o «nuestro»).
            </p>
            <p className="mt-3">
              Para cualquier consulta o ejercicio de derechos puedes contactarnos en:
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li>📧 <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">ayuda@jerseysraw.com</a></li>
              <li>💬 <a href="https://wa.me/529651386865" target="_blank" rel="noopener noreferrer" className="text-accent-DEFAULT underline">WhatsApp: +52 965 138 6865</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">2. Datos personales que recopilamos</h2>
            <p>Recopilamos los siguientes datos personales:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Datos de identificación:</strong> nombre completo y correo electrónico.</li>
              <li><strong>Datos de contacto:</strong> número de teléfono y dirección de envío (calle, número, colonia, ciudad, estado, código postal).</li>
              <li><strong>Datos de compra:</strong> historial de pedidos, productos adquiridos y método de envío seleccionado.</li>
              <li><strong>Datos de pago:</strong> procesados exclusivamente por <strong>Stripe, Inc.</strong> No almacenamos datos de tarjetas de crédito o débito en nuestros servidores.</li>
              <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, dispositivo y páginas consultadas, recopilados de forma anónima para mejorar la experiencia.</li>
              <li><strong>Correo electrónico de suscripción:</strong> si te suscribes a nuestro boletín, guardamos únicamente tu correo electrónico.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">3. Finalidades del tratamiento</h2>
            <p><strong>Finalidades primarias</strong> (necesarias para la relación comercial):</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Procesar y gestionar tus pedidos y pagos.</li>
              <li>Coordinar el envío y entrega de tus productos.</li>
              <li>Enviarte confirmaciones de compra, actualizaciones de envío y recibos.</li>
              <li>Atender dudas, aclaraciones y solicitudes de devolución.</li>
              <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>
            <p className="mt-4"><strong>Finalidades secundarias</strong> (puedes oponerte en cualquier momento):</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Enviarte promociones, novedades y ofertas especiales por correo electrónico.</li>
              <li>Realizar análisis internos de comportamiento de compra para mejorar nuestro catálogo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">4. Transferencia de datos</h2>
            <p>
              Tus datos personales podrán ser compartidos con los siguientes terceros exclusivamente
              para cumplir las finalidades descritas:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Stripe, Inc.</strong> — procesamiento seguro de pagos.</li>
              <li><strong>Brevo (Sendinblue)</strong> — envío de correos transaccionales y notificaciones.</li>
              <li><strong>Correos de México</strong> — servicio de paquetería y logística.</li>
              <li><strong>Proveedores dropshipping</strong> — para surtir pedidos que no tenemos en inventario local.</li>
            </ul>
            <p className="mt-3">
              No vendemos, rentamos ni cedemos tus datos personales a terceros con fines comerciales propios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">5. Derechos ARCO</h2>
            <p>
              Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento
              de tus datos personales (derechos ARCO), así como a revocar tu consentimiento.
            </p>
            <p className="mt-3">Para ejercer tus derechos envía una solicitud a:</p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li>📧 <a href="mailto:ayuda@jerseysraw.com" className="text-accent-DEFAULT underline">ayuda@jerseysraw.com</a></li>
            </ul>
            <p className="mt-3">Tu solicitud debe incluir:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nombre completo y correo electrónico registrado.</li>
              <li>Descripción clara del derecho que deseas ejercer.</li>
              <li>Documentos que acrediten tu identidad (INE u oficial con foto).</li>
            </ul>
            <p className="mt-3">
              Responderemos en un plazo máximo de <strong>20 días hábiles</strong> conforme a la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">6. Cookies y tecnologías de seguimiento</h2>
            <p>
              Nuestro sitio utiliza cookies técnicas necesarias para el funcionamiento del carrito de
              compras y la sesión de usuario. También podemos utilizar cookies analíticas anónimas para
              medir el tráfico del sitio. Puedes deshabilitar las cookies desde la configuración de tu
              navegador, aunque esto puede afectar algunas funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">7. Seguridad de los datos</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo
              cifrado HTTPS, contraseñas hasheadas con bcrypt y acceso restringido a bases de datos.
              Los datos de pago son procesados por Stripe bajo los estándares PCI-DSS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">8. Modificaciones al aviso</h2>
            <p>
              Nos reservamos el derecho de actualizar este aviso de privacidad en cualquier momento.
              Cualquier cambio será publicado en esta página con la fecha de actualización. Te
              recomendamos revisarlo periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-th-primary mb-3">9. Autoridad competente</h2>
            <p>
              Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes acudir
              ante el <strong>Instituto Nacional de Transparencia, Acceso a la Información y Protección
              de Datos Personales (INAI)</strong> en{" "}
              <a href="https://www.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-accent-DEFAULT underline">
                www.inai.org.mx
              </a>.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
