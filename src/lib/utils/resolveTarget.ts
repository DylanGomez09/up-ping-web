/**
 * The UpPing backend stores `PingTestCreate.target_ip` as an IP address
 * (`IPvAnyAddress`), while the UI lets people ping hostnames. Before saving we
 * resolve the hostname to an address with DNS-over-HTTPS — both Google and
 * Cloudflare serve it with `Access-Control-Allow-Origin: *`, so this works from
 * the browser without a backend change.
 */

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
}

const DNS_TIMEOUT_MS = 8_000;

function isIpv4(value: string): boolean {
  const parts = value.split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function isIpv6(value: string): boolean {
  return value.includes(':') && /^[0-9a-f:.]+$/i.test(value);
}

/** Extracts the hostname from a target that may include a scheme, path or port. */
export function extractHostname(target: string): string {
  const trimmed = target.trim();
  if (!trimmed) {
    return '';
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  try {
    return new URL(withScheme).hostname
      .replace(/^\[|\]$/g, '')
      .replace(/\.$/, '')
      .toLowerCase();
  } catch {
    return trimmed
      .replace(/^\[|\]$/g, '')
      .split('/')[0]
      .toLowerCase();
  }
}

async function queryDoh(
  endpoint: string,
  name: string,
  type: 'A' | 'AAAA'
): Promise<string | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DNS_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`,
      {
        headers: { Accept: 'application/dns-json' },
        cache: 'no-store',
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as DohResponse;
    if (data.Status !== 0 || !Array.isArray(data.Answer)) {
      return null;
    }

    const record = data.Answer.find((answer) =>
      type === 'A' ? answer.type === 1 : answer.type === 28
    );

    if (!record) {
      return null;
    }

    const value = record.data.trim();
    return type === 'A' ? (isIpv4(value) ? value : null) : isIpv6(value) ? value : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Resolves a target to an IP address suitable for `POST /tests`.
 *
 * @throws when the host cannot be resolved; the caller should show the message
 * and skip the save rather than storing a wrong address.
 */
export async function resolveToIp(target: string): Promise<string> {
  const host = extractHostname(target);

  if (!host) {
    throw new Error('Escribe un host o una IP antes de guardar.');
  }

  if (isIpv4(host) || isIpv6(host)) {
    return host;
  }

  const endpoints = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
  ];

  for (const endpoint of endpoints) {
    const ipv4 = await queryDoh(endpoint, host, 'A');
    if (ipv4) {
      return ipv4;
    }

    const ipv6 = await queryDoh(endpoint, host, 'AAAA');
    if (ipv6) {
      return ipv6;
    }
  }

  throw new Error(
    `No se pudo resolver "${host}" a una IP. El servidor guarda una IP, así que prueba a escribirla directamente (por ejemplo 8.8.8.8).`
  );
}
