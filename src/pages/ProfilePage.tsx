import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { APP_VERSION } from '@/lib/config';
import { isDemoSession } from '@/lib/demo';
import { formatLongDate, licenseLabel } from '@/lib/utils/format';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();

  const initials = (user?.name ?? 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        subtitle="Your account details and preferences."
        action={<InfoChip>v{APP_VERSION}</InfoChip>}
      />

      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:text-left">
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-badge gradient-brand text-[22px] font-bold text-deep"
          >
            {initials}
          </span>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <AppText variant="title" className="block truncate text-primary">
              {user?.name ?? 'Unknown user'}
            </AppText>
            <AppText variant="body" mono className="mt-0.5 block text-secondary">
              {user?.email ?? '—'}
            </AppText>
            {user?.license_tier && (
              <InfoChip variant="highlight" className="mt-3">
                {licenseLabel(user.license_tier)}
              </InfoChip>
            )}
          </div>
        </div>
      </Card>

      <Card title="Account details">
        <dl className="flex flex-col gap-4">
          <Row label="User ID" value={user?.id ?? '—'} mono />
          <Row label="Email" value={user?.email ?? '—'} mono />
          <Row label="License tier" value={user?.license_tier ?? '—'} mono />
          <Row
            label="Member since"
            value={user?.created_at ? formatLongDate(user.created_at) : '—'}
          />
        </dl>
      </Card>

      <Card title="Preferences">
        <div className="flex items-center justify-between gap-4">
          <AppText variant="body" className="font-medium">
            Theme
          </AppText>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (theme === 'dark' ? setTheme('light') : setTheme('dark'))}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
        </div>
      </Card>

      {isDemoSession() && (
        <div className="rounded-control border border-border bg-tint px-4 py-3">
          <AppText variant="caption" className="block text-secondary">
            You are in demo mode. Data is synthetic and nothing is sent to a server.
          </AppText>
        </div>
      )}

      <Button variant="danger" onClick={logout}>
        <Icon name="logout" size={16} />
        Sign out
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <dt>
        <AppText variant="body" className="text-secondary">
          {label}
        </AppText>
      </dt>
      <dd className="min-w-0 text-right">
        <AppText variant="body" mono={mono} className="break-all text-primary">
          {value}
        </AppText>
      </dd>
    </div>
  );
}