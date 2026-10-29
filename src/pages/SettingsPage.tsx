import { useState } from 'react';
import { AccountUpsell } from '@/components/AccountUpsell';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { Slider } from '@/components/Slider';
import { Toggle } from '@/components/Toggle';
import { useTheme } from '@/hooks/useTheme';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { APP_VERSION } from '@/lib/config';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { signOut, signingOut } = useSignOut();

  const intervalS = useSettingsStore((s) => s.intervalS);
  const timeoutS = useSettingsStore((s) => s.timeoutS);
  const setIntervalS = useSettingsStore((s) => s.setIntervalS);
  const setTimeoutS = useSettingsStore((s) => s.setTimeoutS);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    void signOut();
  };

  const handleCopyEmail = async () => {
    if (!user?.email) {
      return;
    }
    try {
      await navigator.clipboard.writeText(user.email);
      setCopyState('done');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      // Clipboard blocked by the browser — the address is still visible above.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajustes"
        subtitle="Ajusta cómo se comportan las pruebas y cómo se ve la interfaz."
        action={<InfoChip>v{APP_VERSION}</InfoChip>}
      />

      <Card title="Valores de prueba" subtitle="Se aplican a cada nueva prueba de ping">
        <div className="flex flex-col gap-6">
          <Slider
            label="Intervalo"
            value={intervalS}
            min={1}
            max={10}
            step={1}
            valueLabel={`${intervalS} s`}
            onChange={setIntervalS}
          />
          <Slider
            label="Tiempo límite"
            value={timeoutS}
            min={1}
            max={10}
            step={1}
            valueLabel={`${timeoutS} s`}
            onChange={setTimeoutS}
          />
        </div>
        <AppText variant="caption" className="mt-4 block text-muted">
          Se guardan en este navegador, incluso si aún no tienes cuenta.
        </AppText>
      </Card>

      <Card
        title="Apariencia"
        subtitle="UpPing siempre empieza en modo claro; no sigue el tema del sistema."
      >
        <Toggle
          label="Tema oscuro"
          description="Cambia toda la interfaz, incluidos los gráficos, a la paleta oscura."
          checked={theme === 'dark'}
          onChange={(next) => setTheme(next ? 'dark' : 'light')}
        />
      </Card>

      <Card title="Cuenta" subtitle={user?.email ?? 'Estás usando UpPing como invitado'}>
        {accessToken ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                void handleCopyEmail();
              }}
            >
              <Icon name="check" size={16} />
              {copyState === 'done' ? 'Copiado' : 'Copiar correo'}
            </Button>

            {confirmLogout ? (
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={handleLogout} loading={signingOut}>
                  Confirmar salida
                </Button>
                <Button variant="secondary" onClick={() => setConfirmLogout(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmLogout(true)}>
                <Icon name="logout" size={16} />
                Cerrar sesión
              </Button>
            )}
          </div>
        ) : (
          <AccountUpsell
            bare
            title="Guarda tu progreso"
            description="Los ajustes ya son tuyos. Una cuenta añade historial, tendencias y exportación."
            returnTo="/settings"
          />
        )}
      </Card>

      <Card title="Acerca de" subtitle="UpPing · diagnóstico de red">
        <dl className="flex flex-col gap-3">
          <Row label="Versión" value={APP_VERSION} />
          <Row label="Plataforma" value="Web (Vite + React)" />
          <Row label="Modo de ping" value="Sonda HTTP real (navegador)" />
          <Row label="Destinos" value="Los nombres se resuelven a IP al guardar" />
        </dl>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt>
        <AppText variant="body" className="text-secondary">
          {label}
        </AppText>
      </dt>
      <dd>
        <AppText variant="body" mono className="text-primary">
          {value}
        </AppText>
      </dd>
    </div>
  );
}
