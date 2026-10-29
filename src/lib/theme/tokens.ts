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
  'text-muted': '#68765F',
  mint: '#8FD6C4',
  teal: '#357F74',
  'teal-deep': '#2C6B62',
  deep: '#16324D',
  danger: '#B94A3E',
};

export const darkTheme: ThemeTokens = {
  bg: '#000000',
  surface: '#0C120F',
  tint: '#141D18',
  border: '#1E2D25',
  'text-primary': '#EAF2ED',
  'text-secondary': '#A3B8AE',
  'text-muted': '#849A90',
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