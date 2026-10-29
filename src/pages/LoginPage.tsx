import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { AuthShell } from '@/components/shell/AuthShell';
import { loginRequest, meRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { safeInternalPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

interface LocationState {
  from?: string;
  reason?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const destination = safeInternalPath(state.from);

  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Escribe un correo válido';
    }
    if (!password) {
      next.password = 'La contraseña es obligatoria';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const tokens = await loginRequest({
        email: email.trim(),
        password,
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        setUser(await meRequest());
      } catch {
        // A /me failure should not block sign-in; the next request will retry.
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="UpPing"
      subtitle="Inicia sesión para guardar tus pruebas"
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link
            to="/register"
            state={{ from: destination, reason: state.reason }}
            className="font-semibold text-teal transition-opacity hover:opacity-80"
          >
            Crear una
          </Link>
        </>
      }
    >
      {state.reason === 'save' && (
        <div className="mb-5 rounded-control border border-border bg-tint px-4 py-3">
          <AppText variant="caption" className="block text-secondary">
            Inicia sesión y guardaremos tu última prueba automáticamente.
          </AppText>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.com"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Icon name="user" size={18} />}
        />

        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errors.form && (
          <div
            role="alert"
            className="rounded-control bg-danger-soft px-3.5 py-3"
          >
            <AppText variant="caption" className="block text-danger">
              {errors.form}
            </AppText>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/dashboard"
          className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Volver a la app sin iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}
