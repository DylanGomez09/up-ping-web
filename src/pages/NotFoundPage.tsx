import { Link } from 'react-router-dom';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';

export function NotFoundPage() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-center">
      <div
        aria-hidden="true"
        className="mb-6 flex size-16 items-center justify-center rounded-mark gradient-brand text-deep"
      >
        <Icon name="radar" size={30} />
      </div>

      <AppText variant="title" mono className="block text-primary">
        404
      </AppText>
      <AppText variant="body" className="mt-2 max-w-sm text-secondary">
        Esta página no existe. Puede que haya cambiado de nombre o que el enlace
        esté incompleto.
      </AppText>

      <Link to={accessToken ? '/dashboard' : '/'} className="mt-6">
        <Button>{accessToken ? 'Volver al panel' : 'Volver al inicio'}</Button>
      </Link>
    </div>
  );
}
