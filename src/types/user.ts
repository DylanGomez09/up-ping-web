export type LicenseTier = 'free' | 'professional' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  license_tier: LicenseTier;
  created_at: string;
}