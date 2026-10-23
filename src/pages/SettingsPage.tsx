import { useState } from 'react';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { Slider } from '@/components/Slider';
import { Toggle } from '@/components/Toggle';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { APP_VERSION } from '@/lib/config';
import { isDemoSession } from '@/lib/demo';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const intervalS = useSettingsStore((s) => s.intervalS);
  const timeoutS = useSettingsStore((s) => s.timeoutS);
  const autoSaveCsv = useSettingsStore((s) => s.autoSaveCsv);
  const setIntervalS = useSettingsStore((s) => s.setIntervalS);
  const setTimeoutS = useSettingsStore((s) => s.setTimeoutS);
  const setAutoSaveCsv = useSettingsStore((s) => s.setAutoSaveCsv);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle');

  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    logout();
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
        title="Settings"
        subtitle="Tune how tests behave and how the interface looks."
        action={<InfoChip>v{APP_VERSION}</InfoChip>}
      />

      <Card title="Test defaults" subtitle="Applied to every new ping run">
        <div className="flex flex-col gap-6">
          <Slider
            label="Interval"
            value={intervalS}
            min={1}
            max={10}
            step={1}
            valueLabel={`${intervalS} s`}
            onChange={setIntervalS}
          />
          <Slider
            label="Timeout"
            value={timeoutS}
            min={1}
            max={10}
            step={1}
            valueLabel={`${timeoutS} s`}
            onChange={setTimeoutS}
          />
        </div>
      </Card>

      <Card title="Exports" subtitle="How results leave the app">
        <Toggle
          label="Auto-save CSV"
          description="Download a CSV of every probe as soon as a test finishes."
          checked={autoSaveCsv}
          onChange={setAutoSaveCsv}
        />
      </Card>

      <Card
        title="Appearance"
        subtitle="UpPing always starts in light mode — it does not follow your system setting."
      >
        <Toggle
          label="Dark theme"
          description="Switch the whole interface, including charts, to the dark palette."
          checked={theme === 'dark'}
          onChange={(next) => setTheme(next ? 'dark' : 'light')}
        />
      </Card>

      <Card title="Account" subtitle={user?.email ?? 'Not signed in'}>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              void handleCopyEmail();
            }}
          >
            <Icon name="check" size={16} />
            {copyState === 'done' ? 'Copied' : 'Copy email'}
          </Button>

          {confirmLogout ? (
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={handleLogout}>
                Confirm sign out
              </Button>
              <Button variant="secondary" onClick={() => setConfirmLogout(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmLogout(true)}>
              <Icon name="logout" size={16} />
              Sign out
            </Button>
          )}
        </div>

        {isDemoSession() && (
          <AppText variant="caption" className="mt-4 block text-muted">
            Demo sessions never contact the backend and are not persisted.
          </AppText>
        )}
      </Card>

      <Card title="About" subtitle="UpPing · network diagnostics workshop">
        <dl className="flex flex-col gap-3">
          <Row label="Version" value={APP_VERSION} />
          <Row label="Platform" value="Web (Vite + React)" />
          <Row label="Ping mode" value="Simulated in the browser" />
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