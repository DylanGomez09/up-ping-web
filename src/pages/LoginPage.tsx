import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { AuthShell } from '@/components/shell/AuthShell';
import { loginRequest, meRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { demoUser, isDemoEnabled } from '@/lib/demo';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Password is required';
    }
    return next;
  };

  const establishSession = async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    try {
      setUser(await meRequest());
    } catch {
      // A /me failure should not block sign-in; the next request will retry.
    }
    navigate('/dashboard', { replace: true });
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
      await establishSession(tokens.access_token, tokens.refresh_token);
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : 'Could not sign in. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setDemoLoading(true);
    setErrors({});
    setTokens('uppping.demo.access', 'uppping.demo.refresh');
    setUser(demoUser());
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell
      title="UpPing"
      subtitle="Sign in to run network diagnostics"
      footer={
        <>
          No account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-teal transition-opacity hover:opacity-80"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@workshop.local"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Icon name="user" size={18} />}
        />

        <Field
          label="Password"
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
          Sign in
        </Button>
      </form>

      {isDemoEnabled() && (
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <AppText variant="caption" className="text-muted">
              or
            </AppText>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="mt-5"
            loading={demoLoading}
            onClick={handleDemo}
          >
            Enter demo mode
          </Button>

          <AppText variant="caption" className="mt-3 block text-center text-muted">
            Loads a read-only workshop dataset. No account needed.
          </AppText>
        </div>
      )}
    </AuthShell>
  );
}