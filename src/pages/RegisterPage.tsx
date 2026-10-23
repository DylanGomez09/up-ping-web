import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { AuthShell } from '@/components/shell/AuthShell';
import { meRequest, registerRequest } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

/** Single meter shown under the password fields. */
function strengthOf(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
  return { score, label: labels[score] };
}

const METER_BAR = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-teal', 'bg-teal'];
const METER_TEXT = ['text-danger', 'text-danger', 'text-warning', 'text-warning', 'text-teal', 'text-teal'];

export function RegisterPage() {
  const navigate = useNavigate();
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
      next.name = 'Name is required';
    }
    if (!email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (password.length < 8) {
      next.password = 'Use at least 8 characters';
    }
    if (confirm !== password) {
      next.confirm = 'Passwords do not match';
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
      const tokens = await registerRequest({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        setUser(await meRequest());
      } catch {
        // Registration already succeeded; a /me failure is not fatal here.
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : 'Could not create the account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start diagnosing your network in minutes"
      footer={
        <>
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-teal transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
          icon={<Icon name="user" size={18} />}
        />

        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@workshop.local"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
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
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}