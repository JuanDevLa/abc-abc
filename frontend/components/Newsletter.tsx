import Link from 'next/link';

const Newsletter = () => (
  <section className="bg-zinc-800 py-16 px-6 overflow-hidden">
    <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">

      {/* Lado izquierdo — hashtag */}
      <div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-8xl font-sans font-extrabold uppercase text-[#F8C37C] leading-tight tracking-tight">
          #ÚNETEALCLUB
        </h2>
      </div>

      {/* Lado derecho — formulario */}
      <div className="space-y-5">
        {/* Input + botón */}
        <div className="flex items-stretch">
          <input
            type="email"
            placeholder="Correo *"
            className="flex-grow bg-transparent border border-gray-600 px-4 h-12 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F8C37C] transition-colors"
          />
          <button className="bg-[#F8C37C] text-black font-bold uppercase text-sm px-4 sm:px-8 h-12 hover:bg-[#e0b06d] transition-colors tracking-wider whitespace-nowrap">
            Suscribirte
          </button>
        </div>

        {/* Checkbox 1 — Aviso de privacidad */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 accent-[#F8C37C] w-4 h-4 flex-shrink-0" />
          <span className="text-gray-400 text-xs leading-relaxed">
            Al registrarme acepto el{' '}
            <Link href="/aviso-de-privacidad" className="text-white underline hover:text-[#F8C37C] transition-colors">
              Aviso de Privacidad
            </Link>{' '}
            y el tratamiento de los datos personales.
          </span>
        </label>

        {/* Checkbox 2 — Términos y condiciones */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 accent-[#F8C37C] w-4 h-4 flex-shrink-0" />
          <span className="text-gray-400 text-xs leading-relaxed">
            Al registrarme acepto los{' '}
            <Link href="/terminos-y-condiciones" className="text-white underline hover:text-[#F8C37C] transition-colors">
              Términos y Condiciones
            </Link>.
          </span>
        </label>
      </div>
    </div>
  </section>
);

export default Newsletter;
