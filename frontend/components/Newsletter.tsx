'use client';

import Link from 'next/link';
import { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Campo invisible para bots
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: si está lleno, es un bot
    if (honeypot.trim() !== '') {
      // Silencio: finge éxito pero no envía nada
      setStatus('success');
      setEmail('');
      setHoneypot('');
      setPrivacy(false);
      setTerms(false);
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (!privacy || !terms) {
      setErrorMsg('Debes aceptar el aviso de privacidad y los términos.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setEmail('');
      setHoneypot('');
      setPrivacy(false);
      setTerms(false);
    } catch {
      setStatus('error');
      setErrorMsg('Ocurrió un error. Intenta de nuevo.');
    }
  };

  return (
    <section className="bg-zinc-800 py-16 px-6 overflow-hidden">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">

        {/* Lado izquierdo — hashtag */}
        <div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-8xl font-sans font-extrabold uppercase text-[#F8C37C] leading-tight tracking-tight">
            #ÚNETEALCLUB
          </h2>
        </div>

        {/* Lado derecho — formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Honeypot — Campo invisible para atrapar bots */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            name="phone"
            aria-label="Phone number"
            style={{ display: 'none' }}
            autoComplete="off"
            tabIndex={-1}
          />

          {/* Aviso de éxito */}
          {status === 'success' && (
            <div className="bg-[#F8C37C]/10 border border-[#F8C37C]/40 text-[#F8C37C] text-sm px-4 py-3 rounded">
              ¡Te has suscrito exitosamente! Bienvenido al club.
            </div>
          )}

          {/* Input + botón */}
          <div className="flex items-stretch">
            <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo *"
              required
              disabled={status === 'loading' || status === 'success'}
              className="flex-grow bg-transparent border border-gray-600 px-4 h-12 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F8C37C] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="bg-[#F8C37C] text-black font-bold uppercase text-sm px-4 sm:px-8 h-12 hover:bg-[#e0b06d] transition-colors tracking-wider whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : 'Suscribirte'}
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="text-red-400 text-xs">{errorMsg}</p>
          )}

          {/* Checkbox 1 — Aviso de privacidad */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-1 accent-[#F8C37C] w-4 h-4 flex-shrink-0"
            />
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
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 accent-[#F8C37C] w-4 h-4 flex-shrink-0"
            />
            <span className="text-gray-400 text-xs leading-relaxed">
              Al registrarme acepto los{' '}
              <Link href="/terminos-y-condiciones" className="text-white underline hover:text-[#F8C37C] transition-colors">
                Términos y Condiciones
              </Link>.
            </span>
          </label>

        </form>
      </div>
    </section>
  );
};

export default Newsletter;
