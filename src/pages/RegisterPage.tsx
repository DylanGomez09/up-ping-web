import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { AuthShell } from '@/components/shell/AuthShell';
import { loginRequest, meRequest, registerRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { safeInternalPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

interface LocationState {
  from?: string;
  reason?: string;
}

/** Single meter shown under the password fields. */
function strengthOf(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Muy corta', 'Débil', 'Aceptable', 'Buena', 'Fuerte', 'Fuerte'];
  return { score, label: labels[score] };
}

const METER_BAR = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-teal', 'bg-teal'];
const METER_TEXT = ['text-danger', 'text-danger', 'text-warning', 'text-warning', 'text-teal', 'text-teal'];

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const destination = safeInternalPath(state.from);

  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const meter = useMemo(() => strengthOf(password), [password]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) {
      next.name = 'El nombre es obligatorio';
    }
    if (!email.trim()) {
      next.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Escribe un correo válido';
    }
    if (password.length < 8) {
      next.password = 'Usa al menos 8 caracteres';
    }
    if (confirm !== password) {
      next.confirm = 'Las contraseñas no coinciden';
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
      // Registration returns the profile, not tokens; sign in right after.
      await registerRequest({
        email: email.trim(),
        password,
        display_name: name.trim(),
      });
      const tokens = await loginRequest({
        email: email.trim(),
        password,
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        setUser(await meRequest());
      } catch {
        // Registration already succeeded; a /me failure is not fatal here.
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : 'No se pudo crear la cuenta. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Guarda tu historial y vuelve a tus pruebas cuando quieras"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            state={{ from: destination, reason: state.reason }}
            className="font-semibold text-teal transition-opacity hover:opacity-80"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      {state.reason === 'save' && (
        <div className="mb-5 rounded-control border border-border bg-tint px-4 py-3">
          <AppText variant="caption" className="block text-secondary">
            Crea la cuenta y guardaremos tu última prueba automáticamente.
          </AppText>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Nombre"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
          icon={<Icon name="user" size={18} />}
        />

        <Field
          label="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Field
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Al menos 8 caracteres"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {password && (
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={[
                      'h-1 flex-1 rounded-badge',
                      i < meter.score ? METER_BAR[meter.score] : 'bg-border',
                    ].join(' ')}
                  />
                ))}
              </div>
              <AppText
                variant="caption"
                className={`shrink-0 ${METER_TEXT[meter.score]}`}
              >
                {meter.label}
              </AppText>
            </div>
          )}
        </div>

        <Field
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Vuelve a escribirla"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          Crear cuenta
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/dashboard"
          className="text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Volver a la app sin registrarme
        </Link>
      </div>
    </AuthShell>
  );
}
