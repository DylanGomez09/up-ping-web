/**
 * Shared date formatters. Kept in one place because the same string appears in
 * the History list and the Profile details card.
 */

const LOCALE = 'es-ES';

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(LOCALE);
}

const LICENSE_NAMES: Record<string, string> = {
  free: 'Gratis',
  basic: 'Básica',
  pro: 'Pro',
  professional: 'Profesional',
  enterprise: 'Empresa',
  workshop: 'Taller',
};

/** "professional" -> "Licencia Profesional" */
export function licenseLabel(tier: string): string {
  const key = tier.trim().toLowerCase();
  if (LICENSE_NAMES[key]) {
    return `Licencia ${LICENSE_NAMES[key]}`;
  }

  const base = key
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `Licencia ${base}`;
}
