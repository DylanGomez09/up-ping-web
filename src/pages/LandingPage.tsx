import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  {
    icon: 'activity' as const,
    title: 'Latencia de ida y vuelta',
    body: 'Cada sonda es una petición HTTP cronometrada de verdad, con DNS, TCP, TLS y respuesta incluidos.',
  },
  {
    icon: 'wifi' as const,
    title: 'Pérdida de sondas',
    body: 'Si una petición falla o supera el tiempo límite, cuenta como perdida. Sin medias maquilladas.',
  },
  {
    icon: 'clock' as const,
    title: 'Historial y tendencias',
    body: 'Guarda cada prueba en tu cuenta, consulta las últimas 24 horas y exporta todo a CSV.',
  },
];

const STEPS = [
  {
    title: 'Elige un destino',
    body: 'Un host público como dns.google o 1.1.1.1. Si abres UpPing en localhost, también una IP de tu red local.',
  },
  {
    title: 'Lanza la prueba',
    body: 'UpPing envía sondas reales desde este navegador y dibuja cada respuesta mientras llega.',
  },
  {
    title: 'Guarda si quieres',
    body: 'Medir es libre. Crea una cuenta solo cuando quieras conservar el historial y exportarlo.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { theme, toggleTheme } = useTheme();
  const [target, setTarget] = useState('');

  const start = (event: FormEvent) => {
    event.preventDefault();
    navigate('/dashboard', {
      state: { target: target.trim() || undefined },
    });
  };

  const goToApp = () => navigate('/dashboard');

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="UpPing, inicio">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-mark gradient-brand text-deep"
            >
              <Icon name="activity" size={20} strokeWidth={2.2} />
            </span>
            <AppText variant="subtitle" className="font-bold text-primary">
              UpPing
            </AppText>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex" aria-label="Secciones">
            <a
              href="#funciones"
              className="text-[14px] font-medium text-secondary transition-colors hover:text-primary"
            >
              Funciones
            </a>
            <a
              href="#como-funciona"
              className="text-[14px] font-medium text-secondary transition-colors hover:text-primary"
            >
              Cómo funciona
            </a>
            <a
              href="#transparencia"
              className="text-[14px] font-medium text-secondary transition-colors hover:text-primary"
            >
              Transparencia
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
              }
              className="flex size-9 items-center justify-center rounded-mark border border-border bg-surface text-secondary transition-colors hover:bg-tint hover:text-primary"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            {accessToken ? (
              <Button size="sm" onClick={goToApp}>
                Ir al panel
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden px-2 text-[14px] font-semibold text-secondary transition-colors hover:text-primary sm:block"
                >
                  Iniciar sesión
                </Link>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Crear cuenta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <InfoChip variant="highlight">Medición real desde el navegador</InfoChip>

            <h1 className="mt-5 max-w-2xl text-[36px] leading-[42px] font-bold tracking-[-1px] text-primary sm:text-[48px] sm:leading-[54px] lg:text-[56px] lg:leading-[62px]">
              Mide tu red sin instalar nada.
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-secondary">
              Latencia, pérdida de sondas y velocidad de descarga medidas de
              verdad desde esta pestaña. Empieza como invitado y crea una cuenta
              solo cuando quieras guardar tu historial.
            </p>

            <form
              onSubmit={start}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <Field
                label="Destino"
                containerClassName="w-full sm:max-w-sm"
                placeholder="dns.google o 1.1.1.1"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                hint="Host público (HTTPS) o LAN desde localhost. También puedes elegirlo dentro del panel."
              />
              <Button type="submit" size="lg" className="sm:mb-6">
                <Icon name="play" size={16} />
                Medir ahora
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <InfoChip>Sin instalar</InfoChip>
              <InfoChip>Sin ICMP</InfoChip>
              <InfoChip>Datos reales</InfoChip>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-[24px] bg-tint"
            />
            <Card className="overflow-hidden">
              <div className="mb-5 h-1.5 w-full rounded-badge gradient-brand" />
              <AppText variant="section" className="block text-secondary">
                Lo que se mide
              </AppText>

              <ul className="mt-4 flex flex-col gap-4">
                {[
                  {
                    icon: 'activity' as const,
                    title: 'Latencia',
                    body: 'Tiempo de ida y vuelta por sonda',
                  },
                  {
                    icon: 'wifi' as const,
                    title: 'Pérdida',
                    body: 'Sondas sin respuesta o agotadas',
                  },
                  {
                    icon: 'download' as const,
                    title: 'Velocidad',
                    body: 'Descarga y subida contra Cloudflare',
                  },
                ].map((row) => (
                  <li key={row.title} className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-mark gradient-brand text-deep"
                    >
                      <Icon name={row.icon} size={19} />
                    </span>
                    <div className="min-w-0">
                      <AppText variant="label" className="block text-primary">
                        {row.title}
                      </AppText>
                      <AppText variant="caption" className="block text-muted">
                        {row.body}
                      </AppText>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-control bg-tint px-4 py-3">
                <AppText variant="caption" className="block text-secondary">
                  Las mediciones ocurren en tu navegador. El servidor solo
                  guarda el resumen cuando tú lo pides.
                </AppText>
              </div>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section
          id="funciones"
          className="scroll-mt-20 border-y border-border bg-surface/60"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <AppText variant="section" className="block text-teal">
                Funciones
              </AppText>
              <h2 className="mt-2 text-[28px] leading-[34px] font-bold tracking-[-0.6px] text-primary sm:text-[34px] sm:leading-10">
                Lo importante, medido bien
              </h2>
              <p className="mt-3 text-[15px] leading-[22px] text-secondary">
                Sin gráficas decorativas ni resultados de ejemplo. UpPing solo
                muestra lo que puede medir desde un navegador.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-mark bg-tint text-teal"
                  >
                    <Icon name={feature.icon} size={22} />
                  </span>
                  <AppText
                    variant="subtitle"
                    className="mt-4 block font-semibold text-primary"
                  >
                    {feature.title}
                  </AppText>
                  <AppText variant="caption" className="mt-1.5 block text-secondary">
                    {feature.body}
                  </AppText>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="como-funciona" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <AppText variant="section" className="block text-teal">
                Cómo funciona
              </AppText>
              <h2 className="mt-2 text-[28px] leading-[34px] font-bold tracking-[-0.6px] text-primary sm:text-[34px] sm:leading-10">
                Tres pasos, cero instalación
              </h2>
              <p className="mt-3 text-[15px] leading-[22px] text-secondary">
                Puedes medir ahora mismo. La cuenta solo añade memoria: historial,
                tendencias y exportación.
              </p>
              <Button className="mt-6" onClick={goToApp}>
                Abrir el panel
                <Icon name="chevron-right" size={16} />
              </Button>
            </div>

            <ol className="flex flex-col gap-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-card border border-border bg-surface p-5 shadow-raised"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-badge bg-tint font-mono text-[13px] font-semibold text-teal"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <AppText variant="label" className="block text-primary">
                      {step.title}
                    </AppText>
                    <AppText variant="caption" className="mt-1 block text-secondary">
                      {step.body}
                    </AppText>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Guest / transparency */}
        <section
          id="transparencia"
          className="scroll-mt-20 border-t border-border bg-surface/60"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
            <div className="rounded-card border border-border bg-tint p-6 sm:p-8">
              <AppText variant="section" className="block text-teal">
                Empieza como invitado
              </AppText>
              <h2 className="mt-2 text-[24px] leading-8 font-bold tracking-[-0.4px] text-primary">
                Mide primero. Regístrate después.
              </h2>
              <p className="mt-3 text-[15px] leading-[22px] text-secondary">
                No pedimos correo para probar la app. Si una prueba te interesa,
                pulsa guardar: te llevaremos al registro y la guardaremos
                automáticamente al volver.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => navigate('/register')}>
                  Crear cuenta gratis
                </Button>
                <Button variant="secondary" onClick={goToApp}>
                  Probar sin cuenta
                </Button>
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-mark bg-tint text-teal"
              >
                <Icon name="shield" size={22} />
              </span>
              <h2 className="mt-4 text-[24px] leading-8 font-bold tracking-[-0.4px] text-primary">
                Transparencia por delante
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  'El navegador no puede enviar ICMP: usamos peticiones HTTP cronometradas.',
                  'ARP, traceroute y escaneo de puertos necesitan un agente local; no mostramos resultados falsos.',
                  'Una página HTTPS no puede sondear hosts HTTP de la LAN; eso solo funciona ejecutando UpPing en localhost.',
                  'La velocidad se mide contra speed.cloudflare.com, no contra nuestros servidores.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="mt-0.5 text-teal">
                      <Icon name="check" size={16} strokeWidth={2.2} />
                    </span>
                    <AppText variant="caption" className="text-secondary">
                      {line}
                    </AppText>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="relative overflow-hidden rounded-card border border-border bg-surface px-6 py-10 text-center shadow-card sm:px-10 sm:py-14">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 gradient-brand"
            />
            <h2 className="text-[26px] leading-9 font-bold tracking-[-0.5px] text-primary sm:text-[32px] sm:leading-10">
              ¿Cómo está tu red ahora mismo?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-[22px] text-secondary">
              Abre el panel, elige un destino y mira los resultados reales en
              segundos.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button size="lg" onClick={goToApp}>
                <Icon name="play" size={16} />
                Empezar prueba
              </Button>
              {!accessToken && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/register')}
                >
                  Crear cuenta
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-mark gradient-brand text-deep"
            >
              <Icon name="activity" size={17} strokeWidth={2.2} />
            </span>
            <AppText variant="caption" className="text-secondary">
              UpPing · Diagnóstico de red desde el navegador
            </AppText>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
            >
              Panel
            </Link>
            <Link
              to="/diagnostics"
              className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
            >
              Diagnóstico
            </Link>
            <Link
              to="/login"
              className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
            >
              Acceder
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
