'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'form' | 'verify';

export default function RegisterClient() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const [step, setStep]         = useState<Step>('form');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');

  /* ── Paso 1: Registro ── */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', { email, password, name: name || undefined });
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  /* ── Paso 2: Verificar código ── */
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/verify-email', { email, code });
      setSuccess('¡Cuenta verificada! Redirigiendo al login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al verificar');
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
              {step === 'form' ? 'Crear Cuenta' : 'Verifica tu Correo'}
            </h1>
            {step === 'form' && (
              <p className="text-sm text-th-secondary">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-[#F8C37C] hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            )}
            {step === 'verify' && (
              <p className="text-sm text-th-secondary">
                Enviamos un código de 6 dígitos a{' '}
                <span className="text-[#F8C37C] font-medium">{email}</span>
              </p>
            )}
          </div>

          <div className="bg-theme-card border border-th-border rounded-2xl p-8 space-y-5 shadow-lg">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            {/* ── Paso 1: Formulario de registro ── */}
            {step === 'form' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
                  />
                </div>

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
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F8C37C] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-th-border" />
                  <span className="text-xs text-th-secondary">o</span>
                  <div className="flex-1 h-px bg-th-border" />
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (res) => {
                      if (!res.credential) return;
                      setError('');
                      setLoading(true);
                      try {
                        await loginWithGoogle(res.credential);
                        router.push('/account');
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Error al registrarse con Google');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={() => setError('Error al registrarse con Google')}
                    text="signup_with"
                    shape="rectangular"
                  />
                </div>
              </form>
            )}

            {/* ── Paso 2: Verificación de código ── */}
            {step === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-th-secondary">
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-theme-bg border border-th-border rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-[#F8C37C] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-[#F8C37C] text-black font-bold uppercase tracking-widest rounded-xl py-3 text-sm hover:bg-[#f0b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); setCode(''); }}
                  className="w-full text-th-secondary text-sm hover:text-th-primary transition-colors"
                >
                  ← Volver y corregir datos
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
