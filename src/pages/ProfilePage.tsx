import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { APP_VERSION } from '@/lib/config';
import { formatLongDate, licenseLabel } from '@/lib/utils/format';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { signOut, signingOut } = useSignOut();
  const { theme, setTheme } = useTheme();

  const initials = (user?.name ?? 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfil"
        subtitle="Los datos de tu cuenta y tus preferencias."
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
              {user?.name ?? 'Usuario desconocido'}
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

      <Card title="Datos de la cuenta">
        <dl className="flex flex-col gap-4">
          <Row label="ID de usuario" value={user?.id ?? '—'} mono />
          <Row label="Correo" value={user?.email ?? '—'} mono />
          <Row label="Licencia" value={user?.license_tier ?? '—'} mono />
          <Row
            label="Miembro desde"
            value={user?.created_at ? formatLongDate(user.created_at) : '—'}
          />
        </dl>
      </Card>

      <Card title="Preferencias">
        <div className="flex items-center justify-between gap-4">
          <AppText variant="body" className="font-medium">
            Tema
          </AppText>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (theme === 'dark' ? setTheme('light') : setTheme('dark'))}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </Button>
        </div>
      </Card>

      <Button variant="danger" onClick={() => void signOut()} loading={signingOut}>
        <Icon name="logout" size={16} />
        Cerrar sesión
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
