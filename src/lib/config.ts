/**
 * Runtime configuration. Everything env-driven is read here — once — so no
 * component ever touches `import.meta.env` directly.
 *
 * These values are inlined at build time by Vite.
 */

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const APP_VERSION: string =
  import.meta.env.VITE_APP_VERSION ?? '1.0.0';
