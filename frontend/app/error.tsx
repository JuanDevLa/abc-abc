'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col bg-[#0D0D0D] text-[#F2F2F2]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[#F8C37C] text-sm uppercase tracking-[0.4em] font-bold mb-4">
          Algo salió mal
        </p>
        <h1 className="font-heading text-[8rem] leading-none text-[#F2F2F2] mb-2">
          500
        </h1>
        <p className="text-[#A0A0A0] text-lg mb-10 max-w-md">
          Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 bg-[#F8C37C] text-[#0D0D0D] font-bold uppercase tracking-widest text-sm hover:bg-[#e6b06a] transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-8 py-3 border border-[#F8C37C] text-[#F8C37C] font-bold uppercase tracking-widest text-sm hover:bg-[#F8C37C]/10 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
