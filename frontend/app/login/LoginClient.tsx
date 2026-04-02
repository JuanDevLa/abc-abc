'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LoginClient() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const reset = searchParams.get('reset');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-th-primary">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl tracking-widest uppercase text-[#F8C37C] mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-th-secondary">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-[#F8C37C] hover:underline font-medium">
                Regístrate gratis
              </Link>
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-theme-card border border-th-border rounded-2xl p-8 space-y-5 shadow-lg"
          >
            {reset && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                Contraseña actualizada correctamente. Ya puedes iniciar sesión.
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
              />
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs text-[#F8C37C] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-th-border" />
              <span className="text-xs text-th-secondary">o</span>
              <div className="flex-1 h-px bg-th-border" />
            </div>

            <GoogleAuthButton
              label="Continuar con Google"
              disabled={loading}
              onSuccess={async (accessToken) => {
                setError('');
                setLoading(true);
                try {
                  await loginWithGoogle(accessToken);
                  router.push(redirect);
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => setError('Error al iniciar sesión con Google')}
            />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
