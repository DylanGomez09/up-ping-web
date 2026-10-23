export type ThemeName = 'light' | 'dark';

export interface ThemeTokens {
  bg: string;
  surface: string;
  tint: string;
  border: string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  mint: string;
  teal: string;
  'teal-deep': string;
  deep: string;
  danger: string;
}

export const lightTheme: ThemeTokens = {
  bg: '#FCFBF2',
  surface: '#FFFFFF',
  tint: '#F2F2DC',
  border: '#E9E9D6',
  'text-primary': '#1C2A20',
  'text-secondary': '#64735F',
  'text-muted': '#9BA895',
  mint: '#8FD6C4',
  teal: '#4FA095',
  'teal-deep': '#33756B',
  deep: '#16324D',
  danger: '#C8574A',
};

export const darkTheme: ThemeTokens = {
  bg: '#000000',
  surface: '#0C120F',
  tint: '#141D18',
  border: '#1E2D25',
  'text-primary': '#EAF2ED',
  'text-secondary': '#98AEA4',
  'text-muted': '#5D7369',
  mint: '#8FD6C4',
  teal: '#57B3A6',
  'teal-deep': '#86D9C7',
  deep: '#000000',
  danger: '#E2887C',
};

export const themes: Record<ThemeName, ThemeTokens> = {
  light: lightTheme,
  dark: darkTheme,
};