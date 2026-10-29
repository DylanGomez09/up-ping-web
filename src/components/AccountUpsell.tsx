import { useLocation, useNavigate } from 'react-router-dom';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

export interface AccountUpsellProps {
  title?: string;
  description?: string;
  /** Removes the outer surface when the block already lives inside a card. */
  bare?: boolean;
  /** Where the visitor returns after signing in. Defaults to the current route. */
  returnTo?: string;
}

/**
 * The single account prompt used wherever a guest hits a feature that needs
 * saved history. Measurement itself never requires an account.
 */
export function AccountUpsell({
  title = 'Guarda tus pruebas en tu cuenta',
  description = 'Crea una cuenta gratis para conservar el historial, exportar CSV y ver tendencias. Medir sigue siendo libre para invitados.',
  bare = false,
  returnTo,
}: AccountUpsellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = returnTo ?? location.pathname;

  const go = (path: string) => navigate(path, { state: { from } });

  return (
    <div
      className={[
        'flex flex-col items-start gap-4 text-left',
        bare
          ? ''
          : 'rounded-card border border-border bg-surface p-6 shadow-card sm:p-7',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-mark bg-tint text-teal"
        >
          <Icon name="shield" size={22} />
        </span>
        <div className="min-w-0">
          <AppText variant="subtitle" className="block text-primary">
            {title}
          </AppText>
          <AppText variant="caption" className="mt-1 block text-secondary">
            {description}
          </AppText>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => go('/register')}>
          Crear cuenta gratis
        </Button>
        <Button variant="secondary" size="sm" onClick={() => go('/login')}>
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
