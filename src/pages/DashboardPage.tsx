import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AccountUpsell } from '@/components/AccountUpsell';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { Skeleton, SkeletonGroup } from '@/components/Skeleton';
import { StatCard } from '@/components/StatCard';
import { LatencySparkline } from '@/components/charts/LatencySparkline';
import { LossDonut, LossLegend } from '@/components/charts/LossDonut';
import { PingChart } from '@/components/charts/PingChart';
import { getTests, saveTest } from '@/lib/api/tests';
import {
  clearPendingTest,
  readPendingTest,
  savePendingTest,
} from '@/lib/pendingTest';
import { buildLatency24h, buildLossSlices } from '@/lib/utils/aggregate';
import { usePingTest } from '@/hooks/usePingTest';
import { useAuthStore } from '@/store/authStore';
import type { LossSlice } from '@/types/diagnostics';
import type { TestResult } from '@/types/test';

const DEFAULT_TARGET = 'dns.google';

type PendingStatus = 'idle' | 'saving' | 'saved' | 'error';

interface LocationState {
  target?: string;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s._hydrated);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const initialTarget = (location.state as LocationState | null)?.target?.trim();
  const [target, setTarget] = useState(initialTarget ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const test = usePingTest();

  const [pendingStatus, setPendingStatus] = useState<PendingStatus>('idle');
  const [pendingError, setPendingError] = useState<string | null>(null);
  const pendingRunning = useRef(false);

  const saveMutation = useMutation({
    mutationFn: saveTest,
  });

  const testsQuery = useQuery({
    queryKey: ['tests', 'recent'],
    queryFn: () => getTests(null, 100),
    // Guests can measure, but there is no history to fetch yet.
    enabled: Boolean(accessToken),
  });

  const savedTests = testsQuery.data?.items ?? [];
  const latencyPoints = useMemo(
    () => buildLatency24h(savedTests),
    [savedTests]
  );
  const lossSlices = useMemo(() => buildLossSlices(savedTests), [savedTests]);

  const savePending = useCallback(
    async (pending: TestResult) => {
      setPendingStatus('saving');
      setPendingError(null);
      try {
        await saveTest(pending);
        clearPendingTest();
        await queryClient.invalidateQueries({ queryKey: ['tests'] });
        setPendingStatus('saved');
      } catch (err) {
        setPendingStatus('error');
        setPendingError(
          err instanceof Error
            ? err.message
            : 'No se pudo guardar la prueba pendiente.'
        );
      }
    },
    [queryClient]
  );

  // Arriving from the landing hero means the visitor already asked to measure
  // this target. Start on the next tick so StrictMode's mount/cleanup/mount
  // cycle schedules exactly one run, then clear the router state so a refresh
  // or back-navigation does not fire another test.
  useEffect(() => {
    if (!initialTarget) {
      return;
    }

    const timer = window.setTimeout(() => {
      test.start(initialTarget);
      navigate(location.pathname, { replace: true, state: null });
    }, 0);

    return () => window.clearTimeout(timer);
    // Runs once for the target carried in from the landing page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A guest can park a finished run before signing in. Save it as soon as the
  // session is hydrated so the redirect back from /login never loses it.
  useEffect(() => {
    if (!hydrated || !accessToken || pendingRunning.current) {
      return;
    }

    const pending = readPendingTest();
    if (!pending) {
      return;
    }

    pendingRunning.current = true;
    void savePending(pending).finally(() => {
      pendingRunning.current = false;
    });
  }, [accessToken, hydrated, savePending]);

  const handleSave = async () => {
    const result = test.toTestResult();
    if (!result) {
      setSaveError('Ejecuta al menos una sonda antes de guardar el resultado.');
      return;
    }

    if (!accessToken) {
      savePendingTest(result);
      navigate('/login', {
        state: { from: '/dashboard', reason: 'save' },
      });
      return;
    }

    setSaveError(null);
    try {
      await saveMutation.mutateAsync(result);
      await queryClient.invalidateQueries({ queryKey: ['tests'] });
      test.reset();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el resultado. Inténtalo de nuevo.'
      );
    }
  };

  const retryPending = () => {
    const pending = readPendingTest();
    if (pending) {
      void savePending(pending);
    }
  };

  const discardPending = () => {
    clearPendingTest();
    setPendingStatus('idle');
    setPendingError(null);
  };

  const running = test.status === 'running';

  const statusLabel = running
    ? 'Midiendo'
    : test.samples.length > 0
      ? `${test.samples.length} sondas`
      : accessToken
        ? 'Listo'
        : 'Invitado';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user ? `Hola, ${user.name}` : 'Panel'}
        subtitle="Mide latencia y pérdida de sondas desde este navegador."
        action={<InfoChip variant={running ? 'highlight' : 'neutral'}>{statusLabel}</InfoChip>}
      />

      {!accessToken && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-tint p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-mark bg-surface text-teal"
            >
              <Icon name="shield" size={18} />
            </span>
            <div className="min-w-0">
              <AppText variant="label" className="block text-primary">
                Estás como invitado
              </AppText>
              <AppText variant="caption" className="mt-0.5 block text-secondary">
                Medir es libre. Crea una cuenta solo para guardar el historial y
                exportar CSV.
              </AppText>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/register', { state: { from: '/dashboard' } })}
            >
              Crear cuenta
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/login', { state: { from: '/dashboard' } })}
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      )}

      {pendingStatus === 'saving' && (
        <div className="rounded-control border border-border bg-tint px-4 py-3">
          <AppText variant="caption" className="block text-secondary">
            Guardando la prueba que dejaste pendiente…
          </AppText>
        </div>
      )}

      {pendingStatus === 'saved' && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-control border border-border bg-tint px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <AppText variant="caption" className="block text-secondary">
            Tu última prueba se guardó automáticamente en tu cuenta.
          </AppText>
          <div className="flex gap-3">
            <Link
              to="/history"
              className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
            >
              Ver historial
            </Link>
            <button
              type="button"
              onClick={() => setPendingStatus('idle')}
              className="text-[12px] font-semibold text-secondary transition-colors hover:text-primary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {pendingStatus === 'error' && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {pendingError ?? 'No se pudo guardar la prueba pendiente.'}
          </AppText>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={retryPending}>
              Reintentar
            </Button>
            <Button size="sm" variant="secondary" onClick={discardPending}>
              Descartar
            </Button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Latencia media"
          unit="ms"
          value={test.avgLatencyMs || '—'}
          hint={
            test.samples.length > 0
              ? `${test.samples.length} sondas enviadas`
              : 'Lanza una prueba para ver datos'
          }
          mark={<Icon name="activity" size={20} />}
          loading={running && test.samples.length === 0}
        />
        <StatCard
          label="Pérdida de sondas"
          unit="%"
          value={test.samples.length > 0 ? test.lossPercent.toFixed(1) : '—'}
          hint="Sondas sin respuesta"
          mark={<Icon name="wifi" size={20} />}
          loading={running && test.samples.length === 0}
        />
        <StatCard
          label="Intervalo"
          unit="s"
          value={test.intervalS}
          hint="Entre sondas"
          mark={<Icon name="clock" size={20} />}
        />
        <StatCard
          label="Tiempo límite"
          unit="s"
          value={test.timeoutS}
          hint="Por sonda"
          mark={<Icon name="radar" size={20} />}
        />
      </section>

      <Card
        title="Prueba de ping"
        subtitle={
          running
            ? `Sondeando ${test.target} cada ${test.intervalS} s`
            : 'Mide el tiempo de ida y vuelta a un host o IP'
        }
        action={
          <Button variant="secondary" size="sm" onClick={test.reset} disabled={test.status === 'idle'}>
            Limpiar
          </Button>
        }
      >
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            if (running) {
              return;
            }
            setSaveError(null);
            // An empty field measures the default host instead of erroring.
            test.start(target.trim() || DEFAULT_TARGET);
          }}
        >
          <Field
            label="Host o IP de destino"
            containerClassName="min-w-0 flex-1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="dns.google o 1.1.1.1"
            hint="Si lo dejas vacío se mide dns.google. Los hosts públicos usan https://; los de la LAN, http:// (solo desde localhost)."
            autoComplete="off"
            spellCheck={false}
            disabled={running}
            error={test.error}
          />

          {/* 22px = the field label (16px line) plus its 6px margin, so the
              controls line up with the input instead of its hint. */}
          <div className="flex flex-wrap gap-2 sm:pt-[22px]">
            {running ? (
              <Button type="button" variant="danger" onClick={test.stop}>
                <Icon name="stop" size={16} />
                Detener
              </Button>
            ) : (
              <Button type="submit">
                <Icon name="play" size={16} />
                Iniciar prueba
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSave()}
              disabled={test.status !== 'finished' || saveMutation.isPending}
              loading={saveMutation.isPending}
            >
              Guardar resultado
            </Button>
          </div>
        </form>

        {!accessToken && (
          <AppText variant="caption" className="mt-2 block text-muted">
            Guardar requiere una cuenta. Te llevaremos al acceso y la guardaremos
            automáticamente al volver.
          </AppText>
        )}

        {saveError && (
          <div role="alert" className="mt-4 rounded-control bg-danger-soft px-4 py-3">
            <AppText variant="caption" className="block text-danger">
              {saveError}
            </AppText>
          </div>
        )}

        <div className="mt-5">
          {test.samples.length > 0 || test.status === 'running' ? (
            <PingChart
              samples={test.samples}
              averageMs={test.avgLatencyMs || undefined}
              running={running}
            />
          ) : (
            <EmptyState
              mark={<Icon name="chart-bars" size={26} />}
              title="Aún no hay sondas"
              description="Inicia una prueba para dibujar el tiempo de ida y vuelta de cada sonda. Las pérdidas aparecen como cruces rojos en la base del gráfico."
            />
          )}
        </div>

        <AppText variant="caption" className="mt-4 block text-muted">
          Las sondas del navegador cronometran una petición HTTP real (DNS + TCP +
          TLS + respuesta). El navegador no puede enviar ICMP, así que los valores
          suelen ser algo más altos que `ping`.
        </AppText>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Desglose de pérdida" subtitle="Entregadas frente a perdidas en las pruebas guardadas">
          {accessToken ? (
            <LossPanel
              slices={lossSlices}
              loading={testsQuery.isLoading}
              error={testsQuery.isError}
              onRetry={() => void testsQuery.refetch()}
            />
          ) : (
            <AccountUpsell
              bare
              title="Tu pérdida, con perspectiva"
              description="Con una cuenta acumulamos todas tus sondas y comparamos entregadas frente a perdidas."
            />
          )}
        </Card>

        <Card title="Últimas 24 horas" subtitle="Latencia media por hora de las pruebas guardadas">
          {!accessToken ? (
            <AccountUpsell
              bare
              title="Mira tu tendencia"
              description="El historial dibuja cómo cambia la latencia a lo largo del día."
            />
          ) : testsQuery.isError ? (
            <ErrorState
              message="No se pudieron cargar tus pruebas guardadas."
              onRetry={() => void testsQuery.refetch()}
            />
          ) : testsQuery.isLoading ? (
            <SkeletonGroup label="Cargando la tendencia de las últimas 24 horas">
              <Skeleton className="aspect-[320/56] w-full" />
            </SkeletonGroup>
          ) : latencyPoints.length < 2 ? (
            <EmptyState
              mark={<Icon name="activity" size={26} />}
              title="Aún no hay suficiente historial"
              description="Guarda al menos dos pruebas en las últimas 24 horas para dibujar la tendencia."
            />
          ) : (
            <LatencySparkline points={latencyPoints} />
          )}
        </Card>
      </div>

      <div className="flex justify-center">
        <Link
          to="/diagnostics"
          className="text-[14px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Abrir diagnóstico completo →
        </Link>
      </div>
    </div>
  );
}

function LossPanel({
  slices,
  loading,
  error,
  onRetry,
}: {
  slices: LossSlice[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <ErrorState message="No se pudo cargar el desglose de pérdida." onRetry={onRetry} />
    );
  }

  if (loading) {
    return (
      <SkeletonGroup
        label="Cargando el desglose de pérdida"
        className="flex items-center gap-5"
      >
        <Skeleton className="size-[120px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-2.5">
              <Skeleton className="size-2.5 shrink-0 rounded-full" />
              <Skeleton className="h-[18px] w-24 max-w-full" />
              <Skeleton className="ml-auto h-[18px] w-12 shrink-0" />
            </div>
          ))}
        </div>
      </SkeletonGroup>
    );
  }

  if (slices.length === 0) {
    return (
      <EmptyState
        mark={<Icon name="wifi" size={26} />}
        title="Aún no hay sondas guardadas"
        description="Ejecuta una prueba de ping y guárdala para ver entregadas frente a perdidas."
      />
    );
  }

  const lost = slices.find((slice) => slice.label === 'Perdidos')?.value ?? 0;

  return (
    <div className="flex items-center gap-5">
      <LossDonut
        slices={slices}
        centerLabel="Pérdida"
        centerValue={`${lost.toFixed(1)}%`}
      />
      <div className="min-w-0 flex-1">
        <LossLegend
          rows={slices.map((slice) => ({
            label: slice.label,
            value: `${slice.value.toFixed(1)}%`,
            color: slice.color,
          }))}
        />
      </div>
    </div>
  );
}
