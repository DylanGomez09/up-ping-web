# UpPing — Web Application Build Prompt

> **What this document is.** A self-contained specification for building **UpPing Web**, a
> browser-only version of an existing React Native (Expo) application. It contains every design
> token, API contract, data contract and screen spec needed to reproduce the product on the web
> with pixel-level visual fidelity — plus the source of every module that can be ported verbatim.
>
> **How to use it.** Paste this entire document to the coding agent that will build the project.
> It is written to be acted on directly. Do not summarise it, and do not ask clarifying questions
> about anything stated here — it is complete by design, including the verbatim source of every
> module that ports over unchanged.

---

## 1. Your role and objective

You are a senior frontend engineer. You will build a complete, production-quality, **web-only**
single-page application called **UpPing** from scratch.

UpPing is a network diagnostics tool: it measures latency, packet loss and ping-test history
from the user's machine against a FastAPI backend. It has a login flow, five main sections, a
diagnostics toolkit with a downloadable PDF report, and a fully functional offline demo mode.

### Source of truth

A working implementation already exists as a React Native / Expo SDK 57 app. This document is a
faithful, complete transcription of that app's design system, data layer and screen behaviour.
**Reuse everything specified here verbatim.** When this document and your instinct disagree,
this document wins.

### Target project

| Item            | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Directory       | `C:\Users\gomez\up-ping-web`                            |
| Package name    | `up-ping-web`                                           |
| Type            | Browser-only. **No mobile, no Electron, no native.**    |
| Repo status     | New, empty, independent. Not a fork of the Expo app.    |

### Stack — mandatory, do not substitute

| Concern         | Choice                                          |
| --------------- | ----------------------------------------------- |
| Build tool      | Vite 7                                          |
| Framework       | React 19 (function components + hooks only)     |
| Language        | TypeScript, `strict: true`                      |
| Routing         | `react-router-dom` v7 (`createBrowserRouter`)   |
| Server state    | `@tanstack/react-query` v5                      |
| Client state    | `zustand` v5 (`persist` middleware)             |
| Styling         | Tailwind CSS v4 (CSS-first config, `@theme`)   |
| Charts          | Hand-written inline SVG (no chart library)      |
| PDF             | `jspdf`                                         |
| Fonts           | `@fontsource-variable/manrope`, `@fontsource-variable/jetbrains-mono` |

### Hard prohibitions

Do **not** install, import, or reference any of the following. This is a browser-only app and
none of these are acceptable substitutes for a browser-native implementation:

- `expo`, `expo-router`, `expo-secure-store`, `expo-font`, `expo-splash-screen`,
  `expo-constants`, `expo-network`, `expo-linear-gradient`, `expo-status-bar`, or any other
  `expo-*` package
- `react-native`, `react-native-web`, `react-native-safe-area-context`, `react-native-svg`
- Any UI kit: MUI, Chakra, Ant Design, Mantine, shadcn, Radix, Headless UI, Bootstrap
- Any chart library: Recharts, Chart.js, visx, Victory, D3, Nivo
- Any state library other than Zustand
- Any data-fetching library other than TanStack Query

`StyleSheet`, `View`, `Text`, `Pressable`, `Animated`, `PanResponder`, `SafeAreaView` and
`Platform` do not exist in this project. Do not shim them.

### Non-negotiable engineering rules

1. **No hardcoded colours outside the token system.** Every colour in every component resolves
   through a CSS custom property backed by the tokens in §3. No hex literals, no
   `text-[#4FA095]`, no inline `style={{ color: '#fff' }}`. The only permitted raw colour values
   live inside `src/index.css` and the PDF palette constants in §11.
2. **No monospace for prose.** JetBrains Mono is used *exclusively* for data values — IPs, MACs,
   latencies, ports, versions, percentages, counts. Manrope is used for every label, heading and
   sentence. Enforce with a single `<Text>` component (§4.2) rather than ad-hoc `className`.
3. **Tinted surfaces, not hard outlines.** Cards are tinted surfaces with a soft shadow. Borders
   are hairline-only and only in dark mode. Do not add 1px solid borders to cards in light mode.
4. **The demo layer is not optional.** §8 must work with no backend running. Every screen must
   be fully explorable offline.
5. **Copy-paste fidelity on all logic modules.** Where this document says "verbatim", reproduce
   the code as given, changing only import specifiers. Do not refactor, rename, modernise or
   "improve" it.
6. **Do not invent features.** If it is not in this document, do not build it. No dark-mode
   auto-detection, no service worker, no i18n framework, no analytics.
7. **Accessibility is part of the spec**, not an afterthought: roles, labels, states, focus
   rings, `prefers-reduced-motion`, keyboard operability of every interactive element.

### Environment variables

Create `.env.example` and support exactly these three:

```
# FastAPI base URL. No secrets.
VITE_API_URL=http://localhost:8000

# Set to true to skip login entirely and run against in-memory demo data.
VITE_DEMO_MODE=false

# Shown in Profile. Injected from package.json version at build time.
VITE_APP_VERSION=1.0.0
```

`VITE_API_URL` and `VITE_DEMO_MODE` are inlined at build time. Read them through
`src/lib/config.ts`; never read `import.meta.env` directly from a component.

**Demo mode must be reachable both ways**, exactly as in the original:
- `VITE_DEMO_MODE=true` → the app boots straight into the Dashboard with a fake session, skipping login.
- On the Login screen, a secondary button *"Continue with a demo account"* enters the same fake session on demand.

---

## 2. Architecture

### Directory layout — create exactly this

```
up-ping-web/
├─ index.html                     # <html data-theme="light">, title "UpPing — Network Diagnostics"
├─ vite.config.ts                 # react + @tailwindcss/vite plugins, alias @ -> src
├─ tsconfig.json                  # strict, paths { "@/*": ["./src/*"] }
├─ package.json
├─ .env.example
├─ README.md
└─ src/
   ├─ main.tsx                    # QueryClientProvider > ThemeProvider > RouterProvider
   ├─ index.css                   # Tailwind @import, @theme inline, [data-theme] blocks
   ├─ lib/
   │  ├─ config.ts                # API_URL, IS_DEMO_ENABLED, APP_VERSION
   │  ├─ queryClient.ts
   │  ├─ navigation.ts
   │  ├─ theme/
   │  │  ├─ tokens.ts             # ThemeTokens interface + lightTheme + darkTheme
   │  │  └─ ThemeProvider.tsx
   │  ├─ api/{client.ts, auth.ts, tests.ts, diagnostics.ts}
   │  ├─ demo/{index.ts, diagnostics.ts}
   │  ├─ pdf/generateDiagnosticsPdf.ts
   │  └─ utils/{download.ts, format.ts, mediaQuery.ts}
   ├─ hooks/
   │  ├─ useTheme.ts, useMediaQuery.ts
   │  ├─ useAuth.ts, useMe.ts
   │  ├─ useLivePing.ts, useTests.ts, useDiagnostics.ts, useNetwork.ts
   ├─ store/{authStore.ts, authStore.selectors.ts, themeStore.ts, settingsStore.ts}
   ├─ components/
   │  ├─ AppShell.tsx             # sidebar/tabbar switcher (§5.2)
   │  ├─ ProtectedRoute.tsx
   │  ├─ AppText.tsx, Card.tsx, Button.tsx, Field.tsx, Toggle.tsx, Slider.tsx
   │  ├─ StatCard.tsx, InfoChip.tsx, TestCard.tsx, Icon.tsx
   │  ├─ Skeleton.tsx, EmptyState.tsx, ErrorState.tsx
   │  ├─ Sidebar.tsx, TabBar.tsx, AuthShell.tsx
   │  ├─ charts/{PingChart.tsx, LatencySparkline.tsx, LossDonut.tsx}
   │  └─ diagnostics/
   │     ├─ DiagnosticCard.tsx, DiagnosticSummary.tsx
   │     ├─ ArpScanCard.tsx, TracerouteCard.tsx, PortScanCard.tsx
   │     └─ BandwidthCard.tsx, PdfReportCard.tsx
   ├─ pages/
   │  ├─ Login.tsx, Register.tsx, NotFound.tsx
   │  ├─ Dashboard.tsx, Diagnostics.tsx, History.tsx, Settings.tsx, Profile.tsx
   └─ types/{api.ts, auth.ts, diagnostics.ts, network.ts, test.ts, user.ts}
```

### Routing

```
/              RootRedirect   → "/dashboard" if authenticated, else "/login"
/login         Login          → if authenticated, redirect to /dashboard
/register      Register       → if authenticated, redirect to /dashboard
/dashboard     Dashboard      ┐
/diagnostics   Diagnostics    │ ProtectedRoute + AppShell
/history       History        │
/settings      Settings       │
/profile       Profile        ┘
*              NotFound
```

`RootRedirect` must call `createDemoSession()` exactly once (guarded by a ref) when
`IS_DEMO_ENABLED && !isAuthenticated`, then redirect — mirroring the original bootstrap.

### Providers (order matters)

1. `QueryClientProvider` with the client from §7.1
2. `ThemeProvider` — resolves tokens, applies `data-theme` on `<html>`, blocks first paint
   until Zustand rehydration completes (flash-of-wrong-theme guard)
3. `RouterProvider`

`AppShell` applies `backgroundColor: var(--color-bg)` to the page root and sets
`document.documentElement.dataset.theme` on every theme change.

---

## 3. Design system — tokens

### 3.1 The twelve tokens, verbatim

```ts
// src/lib/theme/tokens.ts
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
```

### 3.2 Tailwind v4 wiring

Tailwind v4 is CSS-first. Colours are *runtime-switchable*, so do **not** put raw hex in
`@theme` — put the CSS variables in `@theme inline` and define the two palettes in
`[data-theme]` blocks:

```css
@import "tailwindcss";

@theme inline {
  --color-bg:            var(--c-bg);
  --color-surface:       var(--c-surface);
  --color-tint:          var(--c-tint);
  --color-border:        var(--c-border);
  --color-primary:       var(--c-text-primary);
  --color-secondary:     var(--c-text-secondary);
  --color-muted:         var(--c-text-muted);
  --color-mint:          var(--c-mint);
  --color-teal:          var(--c-teal);
  --color-teal-deep:     var(--c-teal-deep);
  --color-deep:          var(--c-deep);
  --color-danger:        var(--c-danger);

  /* extensions beyond the original 12 tokens — see §3.5 */
  --color-warning:       var(--c-warning);
  --color-danger-soft:   var(--c-danger-soft);

  --font-sans:  "Manrope Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono:  "JetBrains Mono Variable", ui-monospace, monospace;

  --radius-card:   16px;
  --radius-chip:   14px;
  --radius-control: 12px;
  --radius-mark:   9px;
  --radius-badge:  999px;
}

[data-theme="light"] {
  --c-bg: #FCFBF2;
  --c-surface: #FFFFFF;
  --c-tint: #F2F2DC;
  --c-border: #E9E9D6;
  --c-text-primary: #1C2A20;
  --c-text-secondary: #64735F;
  --c-text-muted: #9BA895;
  --c-mint: #8FD6C4;
  --c-teal: #4FA095;
  --c-teal-deep: #33756B;
  --c-deep: #16324D;
  --c-danger: #C8574A;
  --c-warning: #D99A3D;
  --c-danger-soft: rgba(200, 87, 74, 0.10);
}

[data-theme="dark"] {
  --c-bg: #000000;
  --c-surface: #0C120F;
  --c-tint: #141D18;
  --c-border: #1E2D25;
  --c-text-primary: #EAF2ED;
  --c-text-secondary: #98AEA4;
  --c-text-muted: #5D7369;
  --c-mint: #8FD6C4;
  --c-teal: #57B3A6;
  --c-teal-deep: #86D9C7;
  --c-deep: #000000;
  --c-danger: #E2887C;
  --c-warning: #D99A3D;
  --c-danger-soft: rgba(226, 136, 124, 0.12);
}
```

Imports, at the top of `src/index.css`, before `@import "tailwindcss"`:

```css
@import "@fontsource-variable/manrope";
@import "@fontsource-variable/jetbrains-mono";
```

Note on dark mode: the base is **pure black** (`#000000`), not a dark grey. Surfaces are near-black
with a green/teal cast. Preserve this exactly — it is the defining characteristic of the dark theme.

### 3.3 Gradient

Two components use a diagonal mint→teal gradient (top-left to bottom-right). Express it as a
Tailwind utility on a shared class so it appears once:

```css
@utility gradient-brand {
  background-image: linear-gradient(135deg, var(--c-mint) 0%, var(--c-teal) 100%);
}
```

Used by: the highlighted `InfoChip`, `DiagnosticSummary`, the Profile avatar. Text on the
gradient is always `#FFFFFF`, at 80% opacity for labels.

### 3.4 Radii, spacing, shadows

| Element        | Radius   | Notes                                  |
| -------------- | -------- | -------------------------------------- |
| Card           | 16px     |                                        |
| InfoChip, StatCard | 14px |                                     |
| Button, Field input, sub-panels | 12px |                       |
| Logo mark      | 9px      | 26px square in nav, 30px in auth shell |
| Status badge   | 999px    | pill                                   |

| Spacing | Value  | Where                                          |
| ------- | ------ | ---------------------------------------------- |
| Page padding-x     | 16px  | every screen                                    |
| Page padding-y     | 24px  | every screen                                    |
| Content max-width  | 720px | Dashboard, History, Settings, Profile           |
| Content max-width  | 1000px| Diagnostics (needs 2-column card grid)          |
| Section gap        | 28px  | between Diagnostics sections                   |
| Card grid gap      | 16px  | between diagnostic cards                        |
| Element gap        | 8 / 10 / 12 / 16px | the working vocabulary                   |
| Auth page padding-x| 24px  |                                                |

**Shadows.** Light theme only. Dark theme has no shadow; it uses a 1px hairline border instead.

```css
--shadow-card: 0 4px 14px rgba(22, 50, 77, 0.05);   /* Card */
--shadow-raised: 0 3px 10px rgba(22, 50, 77, 0.04);/* TestCard */
```

The shadow colour is `deep` (`#16324D`) — a blue-grey, not black. Never use a black shadow.

**Hairline borders.** `border: 1px` on cards **only in dark theme**. Light theme cards have
`border-width: 0`. Implement as `dark:border dark:border-border`.

### 3.5 Two token extensions (documented additions)

The original had exactly 12 tokens but hardcoded two more values inline. Promote them to
tokens so rule 1 holds:

- `warning: #D99A3D` — amber, used for "Duplicate IP" status and `verdict: 'warning'`.
- `danger-soft: rgba(200, 87, 74, 0.10)` in light / `rgba(226, 136, 124, 0.12)` in dark — the
  tinted alert background for high packet loss and critical bandwidth alerts.

One more value is genuinely one-off and stays local to the Traceroute card: `#3D2B2B` (a dark
maroon) is the background of the "path breaks in the provider" banner. Keep it as a named local
constant with a comment.

---

## 4. Typography and primitives

### 4.1 Fonts

| Role | Family        | Weights used                        |
| ---- | ------------- | ----------------------------------- |
| UI   | Manrope       | 400, 500, 600, 700                   |
| Data | JetBrains Mono| 400, 600                            |

With the variable fonts, `font-weight: 500/600/700` on Manrope and `400/600` on Mono reproduce
the original exactly. Manrope is the `font-sans` default; Mono must be opted into per element.

### 4.2 The `<Text>` component — the type scale

Every piece of text in the app goes through this component. It is the enforcement mechanism for
rule 2 (mono only for data). Props: `variant`, `mono`, `className`, plus native span props.

| Variant    | Weight | Size  | Letter-spacing | Line-height | Transform | Typical use                        |
| ---------- | ------ | ----- | -------------- | ----------- | --------- | ---------------------------------- |
| `title`    | 700    | 28px  | -0.5px         | 34px        | —         | page title, "UpPing" wordmark (22px) |
| `subtitle` | 500    | 14px  | —              | 20px        | —         | page subtitle                      |
| `body`     | 400    | 15px  | —              | 22px        | —         | descriptions, list labels           |
| `section`  | 700    | 13px  | 0.6px          | —           | uppercase | section headings ("Network discovery"), card titles 16px/600 override |
| `label`    | 600    | 12px  | —              | 16px        | —         | field labels, button labels, chip labels |
| `caption`  | 400    | 12px  | —              | 16px        | —         | secondary/help/meta text            |
| `data`     | 600    | 20px  | -0.3px         | 24px        | —         | metric values (24px inside StatCard) |
| `chip`     | 500    | 13px  | —              | 18px        | —         | InfoChip values (-0.2px)            |

Weight fallback when `mono` is set: weights 600/700 use the Mono 600 face; 400/500 use Mono 400.

Where a nested unit belongs to the same number — e.g. `24` in "24 ms", `512` in "512 Mb/s ↓",
`96` in "96%" — render the number in `variant="data"` mono and the unit in `variant="caption"`
mono at `text-muted`, nested inside the value. This pattern appears in StatCard-less metrics,
TestCard, BandwidthCard, PortScanCard and the chart scale labels.

### 4.3 Icon set — 19 icons, path data is verbatim

Icons are hand-drawn 24×24 stroke icons. **Do not swap in an icon library.** Port this exactly:

Common props: `size = 24`, `strokeWidth = 1.8`, `stroke-linecap="round"`,
`stroke-linejoin="round"`, `fill="none"`, `stroke={color}`.

| Name           | SVG body                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chart-bars`   | `<path d="M5 20V10"/><path d="M12 20V4"/><path d="M19 20V14"/>`                                                                                                     |
| `clock`        | `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`                                                                                                            |
| `gear`         | `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>`              |
| `user`         | `<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>`                                                                                        |
| `play`         | `<path d="M8 5.5v13l11-6.5z" fill={color}/>` — **filled, not stroked**                                                                                                 |
| `stop`         | `<path d="M6 6h12v12H6z" fill={color}/>` — **filled**                                                                                                                 |
| `trash`        | `<path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>`                                                                                     |
| `download`     | `<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>`                                                                                                             |
| `logout`       | `<path d="M14 4H6v16h8"/><path d="M10 12h10M17 8l4 4-4 4"/>`                                                                                                       |
| `wifi`         | `<path d="M2 9.5a14 14 0 0 1 20 0M5.5 13a9 9 0 0 1 13 0M9 16.5a4.5 4.5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill={color} stroke="none"/>` |
| `moon`         | `<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>`                                                                                               |
| `sun`          | `<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>` |
| `check`        | `<path d="M5 13l4 4L19 7"/>`                                                                                                                                         |
| `chevron-right`| `<path d="M9 6l6 6-6 6"/>`                                                                                                                                           |
| `radar`        | `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l5-5"/>`                                                                            |
| `activity`     | `<path d="M3 12h4l3-8 4 16 3-8h4"/>`                                                                                                                                |
| `server`       | `<path d="M4 4h16v7H4zM4 13h16v7H4z"/><path d="M8 7.5h.01M8 16.5h.01" stroke-width="2.2"/>`                                                                      |
| `shield`       | `<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>`                                                                                                       |
| `file`         | `<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>`                                                                                                                |

Icon sizes used in the app: 20px in nav links and card headers, 18px in buttons, 22px in tab bar,
38px (stroke 1.6) for the Profile avatar, 24px default.

### 4.4 Primitive components

**`Card`** — `rounded-card`, `bg-surface`, shadow in light / `dark:border dark:border-border` in
dark, `overflow-hidden`, `p-4` by default with a `padded` escape hatch. Inner content `gap-4`.

**`Button`** — variants `primary | secondary | ghost | danger`; `min-height: 44px`,
`min-width: 44px`, `rounded-control`, `px-4`, inline icon + label with `gap-2`, label 14px/600.
Palette (resolve from tokens):

| Variant    | Background         | Foreground          | Active/pressed    |
| ---------- | ------------------ | ------------------- | ----------------- |
| `primary`  | `teal`             | `#FFFFFF`           | opacity 0.9       |
| `secondary`| `tint`             | `text-primary`      | `border`          |
| `ghost`    | transparent        | `text-secondary`    | `tint`            |
| `danger`   | transparent        | `danger`            | `tint`            |

Disabled or loading → `opacity: 0.55`. Loading shows a spinner in place of the content, sized to
the foreground colour. `disabled` when `disabled || loading`.

**`Field`** — `label` (variant `label`, `text-secondary`) above a 46px-min-height input,
`rounded-control`, `bg-surface`, `border border-border`, `px-3.5`, 15px, `placeholder` in
`text-muted`. A `mono` prop switches the input font to JetBrains Mono (used for every IP/host
field). Maps native props: `secureTextEntry`→`type="password"`, `keyboardType="email-address"`→
`type="email"`, `autoCapitalize="none"`→`autoCapitalize="off"`, `editable={false}`→`readOnly`.

**`Toggle`** — a row: label (`body`, 15px) + optional description (`caption`, `text-muted`) on
the left, switch on the right. Switch: 48×28px, `rounded-badge`, 1px border, thumb 22×22px white
with a subtle shadow, slides 22px. Track animates `border` → `teal` over 200ms `easeOutCubic`.
The whole row is the hit target (`role="switch"`, `aria-checked`), min-height 48px.
Respect `prefers-reduced-motion`.

**`Slider`** — header row with label (`body` 15px) left and current value right (`data` mono,
`teal`, 20px, with the unit as a nested `caption` in `text-muted`). Track: 8px tall,
`rounded`, 1px `border`, background `tint` in light / `#000000` in dark. Fill: `teal`, from left,
proportional. Thumb: 22×18px, `rounded`, 2px `teal` border, `bg-surface`, centred vertically
(5px above the track's top edge). `clampValue` rounds to the nearest step and clamps to min/max.
Must be fully keyboard-operable: `role="slider"`, `aria-valuemin/max/now/text`, arrow keys ±step,
Home/End to min/max, and a 44px-tall invisible hit area.

**`StatCard`** — `flex-1`, `rounded-chip`, `bg-surface`, `px-3.5 py-3`, `gap-1`. Value is
`data` mono **24px**, label is `label` `text-muted`. Value turns `danger` when `danger` is set.

**`InfoChip`** — `flex-1`, `min-height: 56px`, `rounded-chip`, `px-3.5 py-2.5`, `gap-0.5`. Default:
`bg-tint` with label `text-muted` and value `chip` mono `text-primary`. With `highlight`: the
brand gradient, label at 80% white, value `#FFFFFF`. Missing value renders `—` (em dash).
`aria-label` is always `"<label>: <value or 'unavailable'>"`.

**`Skeleton`** — `bg-tint` block pulsing between opacity 0.4 and 0.85, 700ms each way,
`easeInOut`. Props `width` (`number | 'n%'`), `height` (16), `radius` (8). `SkeletonList`
renders `count` (5) groups of three: 40%×14 r6, 90%×16 r6, 30%×12 r6, `gap-3` within a group and
`gap-8` between groups. `aria-hidden="true"` plus a single visually-hidden "Loading…".

**`EmptyState`** — centred, `py-8 px-6 gap-2.5`. A 48×48 `rounded-badge` `bg-tint` square, then
`title` (`body`, 15px, centred), optional `description` (`caption`, `text-muted`, centred), then
optional `action`. `role="status"`.

**`ErrorState`** — centred, `py-7 px-6 gap-2`. `title` default `"Something went wrong"`,
`body` 15px in `danger`; optional `message` (`caption`, `text-secondary`); if `onRetry` is given,
a secondary `"Try again"` button. `role="alert"`.

---

## 5. Layout and navigation

### 5.1 Breakpoint

**768px.** At or above → fixed sidebar. Below → bottom tab bar. Implement with a
`useMediaQuery('(min-width: 768px)')` hook built on `matchMedia` with a `change` listener and
SSR-safe initial value. Do not read `window.innerWidth` on render.

### 5.2 `AppShell`

```
root            bg-bg, min-h-screen
└─ isWide
   ├─ yes → flex row
   │  ├─ aside   w-[232px] shrink-0, border-r border-border dark:border-border
   │  │           (hairline; light too — the sidebar divider is the one border that
   │  │            exists in both themes in the original; keep it hairline)
   │  │  └─ Sidebar
   │  └─ main   flex-1, min-w-0     ← overflow-x lives here, not on body
   └─ no  → flex column, min-h-screen
      ├─ main   flex-1
      └─ footer TabBar (sticky bottom)
```

### 5.3 `Sidebar`

Width 232px, own scroll container, padding 16px, `pt-7`.

- **Logo row**: 26×26 `rounded-mark` `bg-mint` square, `gap-2.5`, wordmark "UpPing" at 22px
  weight 700, `pb-7` below it.
- **Links**: `NAV_ITEMS` in order, each 44px tall, `rounded-control`, `px-3.5`, `gap-3`, `mb-1`,
  icon 20px + label 14px/600.
  - Active: `bg-teal`, white icon and label.
  - Inactive: transparent background, `text-secondary` icon and label.
  - Hover (inactive only): `bg-tint`.
  - `aria-current="page"` on the active link.
- Clicking navigates with react-router `<NavLink>`; no imperative router calls.

### 5.4 `TabBar` (below 768px only)

`flex-row`, `bg-surface`, `pt-2 pb-2 px-1`, `border-t border-border dark:border-border`.
Five items, each `flex-1`, `min-height: 48px`, centred, `gap-0.5`, `rounded-control`.
Icon 22px + label 11px. Active → `teal`; inactive → `text-muted`. `aria-current="page"` on active.

### 5.5 Navigation items — verbatim

```ts
// src/lib/navigation.ts
export interface NavItem {
  route: '/dashboard' | '/diagnostics' | '/history' | '/settings' | '/profile';
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { route: '/dashboard',  label: 'Dashboard',  icon: 'chart-bars' },
  { route: '/diagnostics',label: 'Diagnostics',icon: 'radar' },
  { route: '/history',    label: 'History',    icon: 'clock' },
  { route: '/settings',   label: 'Settings',   icon: 'gear' },
  { route: '/profile',    label: 'Profile',    icon: 'user' },
];
```

Routes render without path prefixes — flat URLs: `/dashboard`, not `/tabs/dashboard`.

---

## 6. Types — verbatim, complete

`src/types/`. These mirror the backend Pydantic schemas. Copy exactly.

```ts
// user.ts
export type LicenseTier = 'free' | 'professional' | string;

export interface User {
  id: string;
  email: string;
  name: string;
  license_tier: LicenseTier;
  created_at: string;
}
```

```ts
// api.ts
export interface ApiEnvelope<T> { data: T; }

export interface ApiErrorDetail { detail: string; }

export type ApiErrorPayload = ApiErrorDetail | ApiErrorDetail[];

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}
```

```ts
// auth.ts
export interface LoginRequest { email: string; password: string; }

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface RefreshRequest { refresh_token: string; }

export interface RefreshResponse { access_token: string; }
```

```ts
// test.ts
export interface TestRangeValues {
  interval_s: number;
  timeout_s: number;
}

export interface PingSample {
  seq: number;
  target: string;
  rtt_ms: number | null;
  timestamp: number;
}

export interface TestResult {
  id: string;
  target: string;
  started_at: string;
  duration_ms?: number;
  avg_latency_ms: number;
  packet_count: number;
  loss_percent: number;
  rtts: PingSample[];
}
```

```ts
// network.ts
export interface NetworkInfo {
  ssid: string | null;
  localIp: string | null;
  gateway: string | null;
}
```

```ts
// diagnostics.ts
export interface ArpEntry {
  ip: string;
  mac: string;
  hostname?: string;
  vendor?: string;
  /** Device recognized in the workshop inventory. */
  known?: boolean;
}

export interface ArpScanResult {
  scanned_subnet: string;
  entries: ArpEntry[];
  /** IPs that appear on more than one MAC (duplicate IP scenario). */
  duplicated_ips: string[];
  /** Devices detected but not authorized in the workshop. */
  unauthorized: ArpEntry[];
  scanned_at: string;
}

export interface TracerouteHop {
  ttl: number;
  ip: string | null;
  hostname?: string;
  /** null = no reply at this hop. */
  rtt_ms: number | null;
  timed_out: boolean;
  /** Communication cut at this hop (gateway/router). */
  gateway_break?: boolean;
}

export interface TracerouteResult {
  target: string;
  hops: TracerouteHop[];
  broke_at_hop?: number;
  /** Where the path broke: local network vs ISP/provider. */
  cause: 'local' | 'provider' | 'unknown';
  finished_at: string;
}

export interface PortScanEntry {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'blocked';
}

export interface PortScanResult {
  host: string;
  ports: PortScanEntry[];
  scanned_at: string;
}

export interface BandwidthSnapshot {
  downlink_mbps?: number;
  uplink_mbps?: number;
  activity: 'idle' | 'download' | 'upload' | 'saturated';
  measured_at: string;
}

export interface LatencyBandwidthCorrelation {
  avg_latency_ms: number;
  bandwidth: BandwidthSnapshot;
  verdict: 'ok' | 'warning' | 'critical';
  message: string;
}

export interface PdfReportRef {
  report_id: string;
  title: string;
  generated_at: string;
  /** Download URL served by the backend once available. */
  url?: string;
}

/** Data points rendered client-side for the live 24h latency preview. */
export interface LatencyPoint {
  label: string;
  ms: number;
}

export interface LossSlice {
  label: string;
  value: number;
  color: string;
}
```

---

## 7. Data layer

### 7.1 Query client — verbatim

```ts
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 7.2 API client — verbatim

Port exactly. Only the `API_URL` line changes (see the note under the code).

```ts
// src/lib/api/client.ts
import { useAuthStore } from '@/store/authStore';
import { isDemoSession } from '@/lib/demo';
import type { RefreshResponse } from '@/types/auth';

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the Authorization header. Defaults to true. */
  auth?: boolean;
  /** Internal: already attempted a token refresh for this request. */
  _retried?: boolean;
}

interface RequestSuccess<T> { ok: true; value: T; }
interface RequestFailure { ok: false; error: ApiError; }
type RequestResult<T> = RequestSuccess<T> | RequestFailure;

/** Shared across concurrent 401s so the refresh endpoint is hit once. */
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    if (isDemoSession()) {
      // Demo sessions never hit the refresh endpoint.
      return 'uppping.demo.access';
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401);
    }

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed: clear the session.
      useAuthStore.getState().logout();
      throw new ApiError('Session expired', res.status);
    }

    const data = (await res.json()) as RefreshResponse;
    useAuthStore.getState().setAccessToken(data.access_token);
    return data.access_token;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function extractErrorMessage(
  status: number,
  payload: unknown,
  fallback: string
): string {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.detail === 'string') {
      return p.detail;
    }
    if (Array.isArray(p.detail)) {
      const messages = p.detail
        .map((d) =>
          d && typeof d === 'object'
            ? String((d as Record<string, unknown>).msg ?? JSON.stringify(d))
            : String(d)
        )
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
  }
  if (status === 401) {
    return 'Not authorized';
  }
  return fallback;
}

async function rawFetch<T>(path: string, options: RequestOptions): Promise<RequestResult<T>> {
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: buildHeaders(options),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return { ok: false, error: new ApiError('Network request failed', 0) };
  }

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (res.ok) {
    return { ok: true, value: payload as T };
  }

  return {
    ok: false,
    error: new ApiError(
      extractErrorMessage(res.status, payload, `Request failed (${res.status})`),
      res.status,
      payload
    ),
  };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const attempt = async (opts: RequestOptions): Promise<RequestResult<T>> =>
    rawFetch<T>(path, opts);

  let result = await attempt(options);

  // 401 + auth'd request + not already retried -> try refreshing the token once.
  if (
    result.ok === false &&
    result.error.status === 401 &&
    options.auth !== false &&
    !options._retried &&
    useAuthStore.getState().refreshToken
  ) {
    const originalError = result.error;
    try {
      await refreshAccessToken();
      result = await attempt({ ...options, _retried: true });
    } catch {
      // refreshAccessToken already called logout() on failure.
      return Promise.reject(originalError);
    }
  }

  if (!result.ok) {
    return Promise.reject(result.error);
  }
  return result.value;
}

/** GET convenience wrapper. */
export function apiGet<T>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

/** POST convenience wrapper. */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body });
}

/** DELETE convenience wrapper. */
export function apiDelete<T>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
```

At the top of that file, replace the Expo env read with:

```ts
import { API_URL } from '@/lib/config';
```

`src/lib/config.ts`:

```ts
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
```

### 7.3 Backend contract

Base URL `VITE_API_URL`. Authenticated calls send `Authorization: Bearer <access_token>`.

| Method   | Path               | Body / result                                        |
| -------- | ------------------ | ---------------------------------------------------- |
| `POST`   | `/auth/login`      | `{email, password}` → `TokenResponse` (no auth hdr)  |
| `POST`   | `/auth/register`   | `{email, password, name?}` → `TokenResponse`         |
| `POST`   | `/auth/refresh`    | `{refresh_token}` → `{access_token}`                 |
| `GET`    | `/me`              | `User`                                                |
| `GET`    | `/tests?cursor=`   | `CursorPage<TestResult>`                              |
| `POST`   | `/tests`           | `TestResult` → `TestResult`                          |
| `DELETE` | `/tests/{id}`      | —                                                     |
| `GET`    | `/tests/export`    | CSV text (auth header required, raw `fetch` + `.text()`) |

The diagnostics endpoints below are **not implemented in the backend yet**. Call them anyway, and
fall back to demo data on failure so the UI stays explorable:

| Method | Path                        | Result                        |
| ------ | --------------------------- | ----------------------------- |
| `GET`  | `/diagnostics/arp`          | `ArpScanResult`               |
| `POST` | `/diagnostics/traceroute`   | `{target}` → `TracerouteResult` |
| `POST` | `/diagnostics/portscan`     | `{host}` → `PortScanResult`   |
| `GET`  | `/diagnostics/bandwidth`    | `LatencyBandwidthCorrelation` |
| `GET`  | `/diagnostics/latency-24h`  | `LatencyPoint[]`              |
| `GET`  | `/diagnostics/loss-slices`  | `LossSlice[]`                 |
| `POST` | `/diagnostics/pdf-report`   | `PdfReportRef`                |

### 7.4 `src/lib/api/diagnostics.ts` — verbatim

```ts
import { apiGet, apiPost } from '@/lib/api/client';
import {
  demoArpScan, demoBandwidthCorrelation, demoLatency24h, demoLossSlices,
  demoPdfReport, demoPortScan, demoTraceroute, isDemoSession,
} from '@/lib/demo';
import type {
  ArpScanResult, LatencyBandwidthCorrelation, LatencyPoint,
  PdfReportRef, PortScanResult, TracerouteResult,
} from '@/types/diagnostics';

// Each endpoint is stubbed to demo data while a demo session is active; the
// real calls below kick in once the FastAPI backend implements the contract.
// While the backend endpoints are still missing, a failed real call falls back
// to demo data so the UI stays testable.

async function withFallback<T>(real: () => Promise<T>, demo: () => T): Promise<T> {
  try {
    return await real();
  } catch (err) {
    console.warn(`[diagnostics] backend unavailable, using demo data: ${err}`);
    return demo();
  }
}

export async function getArpScan(): Promise<ArpScanResult> {
  if (isDemoSession()) return demoArpScan();
  return withFallback(() => apiGet<ArpScanResult>('/diagnostics/arp'), demoArpScan);
}

export async function runTraceroute(target: string): Promise<TracerouteResult> {
  if (isDemoSession()) { void target; return demoTraceroute(); }
  return withFallback(
    () => apiPost<TracerouteResult>('/diagnostics/traceroute', { target }),
    () => demoTraceroute()
  );
}

export async function runPortScan(host: string): Promise<PortScanResult> {
  if (isDemoSession()) { void host; return demoPortScan(); }
  return withFallback(
    () => apiPost<PortScanResult>('/diagnostics/portscan', { host }),
    () => demoPortScan()
  );
}

export async function getBandwidthCorrelation(): Promise<LatencyBandwidthCorrelation> {
  if (isDemoSession()) return demoBandwidthCorrelation();
  return withFallback(
    () => apiGet<LatencyBandwidthCorrelation>('/diagnostics/bandwidth'),
    demoBandwidthCorrelation
  );
}

export async function getLatency24h(): Promise<LatencyPoint[]> {
  if (isDemoSession()) return demoLatency24h();
  return withFallback(() => apiGet<LatencyPoint[]>('/diagnostics/latency-24h'), demoLatency24h);
}

export async function getLossSlices(): Promise<LossSlice[]> {
  if (isDemoSession()) return demoLossSlices();
  return withFallback(() => apiGet<LossSlice[]>('/diagnostics/loss-slices'), demoLossSlices);
}

export async function generatePdfReport(): Promise<PdfReportRef> {
  if (isDemoSession()) return demoPdfReport();
  return withFallback(() => apiPost<PdfReportRef>('/diagnostics/pdf-report'), demoPdfReport);
}
```

### 7.5 `src/lib/api/auth.ts` and `tests.ts` — verbatim

```ts
// auth.ts
import { apiGet, apiPost } from '@/lib/api/client';
import { demoUser, isDemoSession } from '@/lib/demo';
import type { LoginRequest, RegisterRequest, TokenResponse } from '@/types/auth';
import type { User } from '@/types/user';

const DEMO_TOKENS: TokenResponse = {
  access_token: 'uppping.demo.access',
  refresh_token: 'uppping.demo.refresh',
  token_type: 'bearer',
};

export async function loginRequest(body: LoginRequest): Promise<TokenResponse> {
  if (isDemoSession()) { void body; return DEMO_TOKENS; }
  return apiPost<TokenResponse>('/auth/login', body, { auth: false });
}

export async function registerRequest(body: RegisterRequest): Promise<TokenResponse> {
  if (isDemoSession()) { void body; return DEMO_TOKENS; }
  return apiPost<TokenResponse>('/auth/register', body, { auth: false });
}

export async function meRequest(): Promise<User> {
  if (isDemoSession()) return demoUser();
  return apiGet<User>('/me');
}
```

```ts
// tests.ts
import { API_URL, apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { getAccessToken } from '@/store/authStore.selectors';
import { useAuthStore } from '@/store/authStore';
import { demoDeleteTest, demoExportCsv, demoSaveTest, demoTestsPage, isDemoSession } from '@/lib/demo';
import type { CursorPage } from '@/types/api';
import type { TestResult } from '@/types/test';

export async function getTests(cursor?: string | null): Promise<CursorPage<TestResult>> {
  if (isDemoSession()) return demoTestsPage(cursor);
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiGet<CursorPage<TestResult>>(`/tests${query}`);
}

export async function saveTest(test: TestResult): Promise<TestResult> {
  if (isDemoSession()) return demoSaveTest(test);
  return apiPost<TestResult>('/tests', test);
}

export async function deleteTest(id: string): Promise<unknown> {
  if (isDemoSession()) { demoDeleteTest(id); return { ok: true }; }
  return apiDelete<unknown>(`/tests/${encodeURIComponent(id)}`);
}

async function getAccessTokenOrThrow(): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    // Force session teardown so the app redirects to login.
    useAuthStore.getState().logout();
    throw new Error('Not signed in');
  }
  return token;
}

/** Fetches the CSV export body. Callers decide how to deliver it (download/share). */
export async function exportTests(): Promise<string> {
  if (isDemoSession()) return demoExportCsv();
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_URL}/tests/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  return res.text();
}
```

### 7.6 Hooks

`useAuth` — `login` / `register` mutations each: request tokens → `setTokens` → `meRequest()` →
`setUser` → return user. `logout` clears the auth store **and** calls `queryClient.clear()`.
Returns `{ isAuthenticated, user, login, register, logout }`.

`useMe` — `useQuery(['me'], …)` whose `queryFn` calls `meRequest()` and writes the result into
the auth store; returns `{ ...query, user }` with `user` read from the store.

`useTests` — verbatim, including the optimistic update + rollback pattern:

```ts
// src/hooks/useTests.ts
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { deleteTest, exportTests, getTests, saveTest as saveTestRequest } from '@/lib/api/tests';
import type { CursorPage } from '@/types/api';
import type { TestResult } from '@/types/test';

const TESTS_QUERY_KEY = ['tests'] as const;

interface TestsInfiniteData {
  pages: CursorPage<TestResult>[];
  pageParams: (string | null)[];
}

export function useTests() {
  const queryClient = useQueryClient();

  const infinite = useInfiniteQuery({
    queryKey: TESTS_QUERY_KEY,
    queryFn: ({ pageParam }) => getTests(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: CursorPage<TestResult>) => lastPage.next_cursor,
  });

  const saveTest = useMutation({
    mutationFn: (test: TestResult) => saveTestRequest(test),
    onMutate: async (test: TestResult) => {
      await queryClient.cancelQueries({ queryKey: TESTS_QUERY_KEY });
      const previous = queryClient.getQueryData<TestsInfiniteData>(TESTS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<TestsInfiniteData>(TESTS_QUERY_KEY, {
          ...previous,
          pages: previous.pages.map((page, index) =>
            index === 0 ? { ...page, items: [test, ...page.items] } : page
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _test, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TESTS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
    },
  });

  const removeTest = useMutation({
    mutationFn: (id: string) => deleteTest(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: TESTS_QUERY_KEY });
      const previous = queryClient.getQueryData<TestsInfiniteData>(TESTS_QUERY_KEY);
      queryClient.setQueryData<TestsInfiniteData>(TESTS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== id),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TESTS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
    },
  });

  const exportCsv = useMutation({ mutationFn: () => exportTests() });

  return { ...infinite, saveTest, removeTest, exportCsv };
}
```

`useDiagnostics` — one hook per tool, query keys exactly:

```ts
useArpScan()              useQuery(['diagnostics', 'arp'], getArpScan)
useTraceroute()           useMutation(runTraceroute)   // variables: target: string
usePortScan()             useMutation(runPortScan)     // variables: host: string
useBandwidthCorrelation() useQuery(['diagnostics', 'bandwidth'], getBandwidthCorrelation)
useLatency24h()           useQuery(['diagnostics', 'latency-24h'], getLatency24h)
useLossSlices()           useQuery(['diagnostics', 'loss-slices'], getLossSlices)
usePdfReport()            useMutation(generatePdfReport)
```

---

## 8. Demo mode — verbatim

Two files. This is what makes the app fully explorable with no backend. Copy the data literals
exactly; they are the demo's visual signature.

### 8.1 `src/lib/demo/index.ts`

```ts
import { useAuthStore } from '@/store/authStore';
import type { CursorPage } from '@/types/api';
import type { User } from '@/types/user';
import type { TestResult } from '@/types/test';

/**
 * Demo mode — lets you explore the app without a backend.
 *
 * Enabled either globally (VITE_DEMO_MODE=true, skips login) or on demand
 * from the login screen ("Continue with a demo account").
 *
 * The demo flag is handled at the API layer so hooks and screens are untouched:
 * they receive real-looking data from an in-memory store instead of the network.
 */
export const IS_DEMO_ENABLED = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_ACCESS_TOKEN = 'uppping.demo.access';
const DEMO_REFRESH_TOKEN = 'uppping.demo.refresh';

/**
 * True when the current session is a demo session — either because demo mode
 * is enabled via env, or because the user entered via the "demo account"
 * button on the login screen. Evaluated at call time (not module load).
 */
export function isDemoSession(): boolean {
  if (IS_DEMO_ENABLED) {
    return true;
  }
  return useAuthStore.getState().accessToken === DEMO_ACCESS_TOKEN;
}

export interface DemoSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export function createDemoSession(): DemoSession {
  const session: DemoSession = {
    accessToken: DEMO_ACCESS_TOKEN,
    refreshToken: DEMO_REFRESH_TOKEN,
    user: demoUser(),
  };
  useAuthStore.getState().setTokens(session.accessToken, session.refreshToken);
  useAuthStore.getState().setUser(session.user);
  return session;
}

export function demoUser(): User {
  return {
    id: 'demo-user',
    email: 'demo@uppping.app',
    name: 'Demo Runner',
    license_tier: 'professional',
    created_at: '2025-03-14T09:24:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// In-memory test database
// ---------------------------------------------------------------------------

let demoSequence = 0;

function seedTest(
  target: string,
  avgMs: number,
  packetCount: number,
  lossPercent: number,
  startMinutesAgo: number,
  variation: (number | null)[]
): TestResult {
  demoSequence += 1;
  const startedAt = new Date(Date.now() - startMinutesAgo * 60_000);
  const rtts = variation.map((ms, i) => ({
    seq: i,
    target,
    rtt_ms: ms,
    timestamp: startedAt.getTime() + i * 1000,
  }));
  return {
    id: `demo-${demoSequence}`,
    target,
    started_at: startedAt.toISOString(),
    duration_ms: variation.length * 1000,
    avg_latency_ms: avgMs,
    packet_count: packetCount,
    loss_percent: lossPercent,
    rtts,
  };
}

let demoTests: TestResult[] = [
  seedTest('8.8.8.8', 24, 20, 0, 12, [22, 21, 24, 26, 23, 25, 22, 21, 24, 26, 23, 25, 22, 21, 24, 26, 23, 25, 22, 24]),
  seedTest('1.1.1.1', 12, 20, 0, 45, [11, 12, 13, 11, 12, 14, 12, 11, 13, 12, 11, 12, 13, 12, 11, 12, 14, 11, 12, 13]),
  seedTest('192.168.1.254', 3, 10, 20, 1_320, [2, 2, 3, 4, 3, 2, null, 3, 2, null]),
];

const PAGE_SIZE = 20;

export function demoTestsPage(cursor: string | null | undefined): CursorPage<TestResult> {
  const sorted = [...demoTests].sort((a, b) => b.started_at.localeCompare(a.started_at));
  const startIndex = cursor ? Number(cursor) : 0;
  if (Number.isNaN(startIndex) || startIndex >= sorted.length) {
    return { items: [], next_cursor: null };
  }
  const items = sorted.slice(startIndex, startIndex + PAGE_SIZE);
  const nextIndex = startIndex + items.length;
  return { items, next_cursor: nextIndex < sorted.length ? String(nextIndex) : null };
}

export function demoSaveTest(test: TestResult): TestResult {
  demoSequence += 1;
  const saved: TestResult = { ...test, id: `demo-${demoSequence}` };
  demoTests = [saved, ...demoTests];
  return saved;
}

export function demoDeleteTest(id: string): void {
  demoTests = demoTests.filter((t) => t.id !== id);
}

export function demoExportCsv(): string {
  const header = 'id,started_at,target,avg_latency_ms,packet_count,loss_percent';
  const rows = demoTests.map((t) =>
    [t.id, t.started_at, t.target, t.avg_latency_ms, t.packet_count, t.loss_percent].join(',')
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Diagnostics demo data
// ---------------------------------------------------------------------------

export {
  demoArpScan,
  demoTraceroute,
  demoPortScan,
  demoBandwidthCorrelation,
  demoLatency24h,
  demoLossSlices,
  demoPdfReport,
} from '@/lib/demo/diagnostics';
```

### 8.2 `src/lib/demo/diagnostics.ts`

```ts
import type {
  ArpScanResult,
  LatencyBandwidthCorrelation,
  LatencyPoint,
  PdfReportRef,
  PortScanResult,
  TracerouteResult,
} from '@/types/diagnostics';

/**
 * Realistic in-memory data for the Diagnostics screen in demo mode.
 * These simulate what the backend diagnostics endpoints will return.
 */

const now = () => new Date().toISOString();

export function demoArpScan(): ArpScanResult {
  return {
    scanned_subnet: '192.168.1.0/24',
    entries: [
      { ip: '192.168.1.1',  mac: '00:1A:2B:3C:4D:01', hostname: 'gateway-router', vendor: 'TP-Link',  known: true },
      { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:10', hostname: 'pc-lab-01',     vendor: 'Lenovo',   known: true },
      { ip: '192.168.1.11', mac: 'AA:BB:CC:DD:EE:11', hostname: 'pc-lab-02',     vendor: 'Lenovo',   known: true },
      { ip: '192.168.1.20', mac: 'AA:BB:CC:DD:EE:10', hostname: 'pc-lab-01',     vendor: 'Lenovo',   known: true },
      { ip: '192.168.1.30', mac: '11:22:33:44:55:30', hostname: 'plc-main',       vendor: 'Siemens',  known: true },
      { ip: '192.168.1.40', mac: '11:22:33:44:55:40', hostname: 'switch-a',       vendor: 'Cisco',    known: true },
      { ip: '192.168.1.50', mac: '11:22:33:44:55:50', hostname: 'printer-shop',   vendor: 'HP',       known: true },
      { ip: '192.168.1.60', mac: '11:22:33:44:55:60', hostname: 'nas-server',     vendor: 'Synology', known: true },
      { ip: '192.168.1.99', mac: 'FF:00:00:00:00:99', hostname: 'unknown-device', vendor: 'Espressif', known: false },
    ],
    duplicated_ips: ['192.168.1.10 / 192.168.1.20'],
    unauthorized: [
      { ip: '192.168.1.99', mac: 'FF:00:00:00:00:99', hostname: 'unknown-device', vendor: 'Espressif', known: false },
    ],
    scanned_at: now(),
  };
}

export function demoTraceroute(): TracerouteResult {
  return {
    target: '8.8.8.8',
    hops: [
      { ttl: 1, ip: '192.168.1.1',  hostname: 'gateway-router', rtt_ms: 2,  timed_out: false, gateway_break: true },
      { ttl: 2, ip: '10.0.0.1',     hostname: 'isp-pe',          rtt_ms: 12, timed_out: false },
      { ttl: 3, ip: null,                                              rtt_ms: null, timed_out: true },
      { ttl: 4, ip: null,                                              rtt_ms: null, timed_out: true },
      { ttl: 5, ip: '72.14.215.142', hostname: 'goo-1',           rtt_ms: 84, timed_out: false },
      { ttl: 6, ip: '8.8.8.8',      hostname: 'dns.google',      rtt_ms: 22, timed_out: false },
    ],
    broke_at_hop: 3,
    cause: 'provider',
    finished_at: now(),
  };
}

export function demoPortScan(): PortScanResult {
  return {
    host: '192.168.1.30',
    ports: [
      { port: 53,  service: 'DNS',   state: 'open' },
      { port: 80,  service: 'HTTP',  state: 'blocked' },
      { port: 443, service: 'HTTPS', state: 'open' },
    ],
    scanned_at: now(),
  };
}

let bwTick = 0;

export function demoBandwidthCorrelation(): LatencyBandwidthCorrelation {
  bwTick += 1;
  // Alternate between an idle and a saturated snapshot for a lively demo.
  const saturated = bwTick % 3 === 0;
  return {
    avg_latency_ms: saturated ? 800 : 28,
    bandwidth: {
      downlink_mbps: saturated ? 512 : 4,
      uplink_mbps: saturated ? 96 : 0.8,
      activity: saturated ? 'saturated' : 'idle',
      measured_at: now(),
    },
    verdict: saturated ? 'critical' : 'ok',
    message: saturated
      ? 'Latencia crítica (800ms) debido a tráfico de descarga local elevado'
      : 'Banda ancha y latencia dentro de rangos normales',
  };
}

export function demoLatency24h(): LatencyPoint[] {
  const points: LatencyPoint[] = [];
  for (let i = 23; i >= 0; i -= 1) {
    const h = new Date(Date.now() - i * 3600_000).getHours();
    points.push({ label: `${String(h).padStart(2, '0')}:00`, ms: 15 + Math.round(Math.abs(Math.sin(i) * 60)) });
  }
  return points;
}

export function demoLossSlices(): LossSlice[] {
  return [
    { label: 'Packets OK', value: 96, color: '#4FA095' },
    { label: 'Lost',       value: 4,  color: '#C8574A' },
  ];
}

export function demoPdfReport(): PdfReportRef {
  return {
    report_id: 'rpt-0001',
    title: 'UpPing Diagnostic Report',
    generated_at: now(),
  };
}
```

> **Note on the two Spanish strings.** `demoBandwidthCorrelation` returns Spanish messages in
> the original app while the rest of the UI is English. Reproduce them verbatim for parity, and
> leave a `// TODO(i18n)` comment. Do not silently "fix" them and do not build a translation layer.

---

## 9. State — Zustand stores

### 9.1 `authStore`

Shape: `accessToken: string | null`, `refreshToken: string | null`, `user: User | null`,
`_hydrated: boolean`, and actions `setTokens`, `setAccessToken`, `setUser`, `logout`
(logout nulls tokens and user).

Persist with `createJSONStorage`, key **`uppping.auth`**, `partialize` to
`{ accessToken, refreshToken, user }`, and `onRehydrateStorage` that sets `_hydrated: true`.
The web equivalent of `expo-secure-store` is `localStorage`, so `createJSONStorage` receives
`localStorage` directly. **Do not keep the async `getItem/setItem/removeItem` storage adapter from
the original** — it existed to bridge SecureStore's promise API; `localStorage` is synchronous and
the async adapter adds nothing. Guard access in try/catch for private-mode browsers where
`localStorage` throws.

### 9.2 `themeStore`

`theme: ThemeName` (default `'light'`), `_hydrated: false`, `setTheme`, `toggleTheme`.
Key **`uppping.theme`**, `partialize` to `{ theme }`, same rehydrate flag.

Note the product decision this encodes: the app starts in **light** mode and does **not** follow
`prefers-color-scheme`. The Settings copy says so explicitly: *"Manual switch — the app does not
follow the system theme"*. Preserve it. Setting `VITE_DEMO_MODE` does not change it.

### 9.3 `settingsStore`

`intervalS: 1`, `timeoutS: 3`, `autoSaveCsv: false`, plus `setIntervalS`, `setTimeoutS`,
`setAutoSaveCsv`. Key **`uppping.settings`**, persist all fields. No `_hydrated` flag (nothing
gates rendering on it).

### 9.4 `authStore.selectors`

```ts
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}
```

### 9.5 `ThemeProvider`

React context exposing `{ theme, tokens, isDark, setTheme, toggleTheme }`, reading from
`themeStore`. `tokens = themes[theme]`. Throw on use outside the provider. Also applies
`document.documentElement.dataset.theme = theme` in an effect.

Expose a `useTheme()` hook re-exporting the context.

---

## 10. The live ping engine

**This is the heart of the app. Port it verbatim** — only the module path changes.

```ts
// src/hooks/useLivePing.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PingSample } from '@/types/test';

export interface LivePingStats {
  packetCount: number;
  lossPercent: number;
  avgLatencyMs: number | null;
}

interface UseLivePingOptions {
  intervalMs: number;
  timeoutMs: number;
  target: string | null;
}

function normalizeTarget(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

/**
 * Measures round-trip latency against a target using a timed HTTP request.
 * ICMP ping is not available to JS runtimes on any platform, so this is the
 * cross-platform equivalent: a packet is considered lost when the request
 * fails or exceeds the configured timeout.
 */
function timeRequest(url: string, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const startedAt = Date.now();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // 'no-cors' lets us measure cross-origin reachability without CORS checks.
    const init: RequestInit = { signal: controller.signal, mode: 'no-cors' };

    fetch(url, init)
      .then(() => resolve(Date.now() - startedAt))
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

export function useLivePing({ intervalMs, timeoutMs, target }: UseLivePingOptions) {
  const [samples, setSamples] = useState<PingSample[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [snapshot, setSnapshot] = useState<LivePingStats>({
    packetCount: 0,
    lossPercent: 0,
    avgLatencyMs: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const samplesRef = useRef<PingSample[]>([]);
  const optionsRef = useRef({ intervalMs, timeoutMs, target });
  optionsRef.current = { intervalMs, timeoutMs, target };

  const recalculate = useCallback((all: PingSample[]) => {
    const rtts = all
      .map((s) => s.rtt_ms)
      .filter((v): v is number => v !== null);
    const loss = all.length > 0 ? (all.length - rtts.length) / all.length : 0;
    const sum = rtts.reduce((acc, v) => acc + v, 0);
    setSnapshot({
      packetCount: all.length,
      lossPercent: Number((loss * 100).toFixed(1)),
      avgLatencyMs: rtts.length > 0 ? Math.round(sum / rtts.length) : null,
    });
  }, []);

  const tick = useCallback(async () => {
    const { timeoutMs, target: t } = optionsRef.current;
    if (!runningRef.current || !t) {
      return;
    }
    const url = normalizeTarget(t);
    if (!url) {
      return;
    }
    const rtt = await timeRequest(url, timeoutMs);
    if (!runningRef.current) {
      return;
    }
    const sample: PingSample = { seq: samplesRef.current.length, target: t, rtt_ms: rtt, timestamp: Date.now() };
    const next = [...samplesRef.current, sample];
    samplesRef.current = next;
    setSamples(next);
    recalculate(next);
  }, [recalculate]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!optionsRef.current.target) {
      return;
    }
    stop();
    runningRef.current = true;
    setIsRunning(true);
    const { intervalMs } = optionsRef.current;
    void tick();
    intervalRef.current = setInterval(() => void tick(), intervalMs);
  }, [stop, tick]);

  const reset = useCallback(() => {
    stop();
    samplesRef.current = [];
    setSamples([]);
    setSnapshot({ packetCount: 0, lossPercent: 0, avgLatencyMs: null });
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { samples, isRunning, snapshot, start, stop, reset };
}
```

One deliberate simplification, since this app is browser-only: the original branched on
`typeof window !== 'undefined'` before adding `mode: 'no-cors'`. Drop that branch — it is always
true here.

Consequences worth understanding rather than "fixing":
- `mode: 'no-cors'` makes the request opaque, so latency reflects reachability, not payload.
- Browsers aggressively cache and throttle background tabs, so latencies will read higher and
  jitter more than on a server. That is expected.
- A single failed/aborted request counts as one lost packet.

---

## 11. Screens

Common page frame: `px-4 py-6`, `gap-4`, and on wide viewports
`mx-auto w-full max-w-[720px]` — **except Diagnostics, which is `max-w-[1000px]`** because it
runs a two-column card grid. Every page starts with a header block: `title` variant (28px) plus
an optional `subtitle` (14px, `text-secondary`), `gap-0.5 mb-1`.

### 11.1 `/login`

`AuthShell` wrapper (`title="Welcome back"`, `subtitle="Sign in to sync your ping history"`).

AuthShell anatomy: centred column, `min-h-screen`, `px-6`, `pt-12`, `pb-6`. Logo row: 30×30
`rounded-mark` `bg-mint` + "UpPing" at 24px/700, `gap-2.5 mb-8`. Page title 30px/700,
`mt-1.5` subtitle. Then a `Card` with `mt-7 gap-4` containing the children.

Body:
1. `Field` **Email** — placeholder `you@example.com`, `type="email"`, `autocomplete="email"`.
2. `Field` **Password** — `type="password"`, placeholder `••••••••`, `autocomplete="current-password"`.
3. `ErrorState` when the login mutation errors — `title="Login failed"`, message from the error.
4. `Button` **"Sign in"**, icon `play`, primary, `disabled` unless both fields are non-empty,
   `mt-1`.
5. Centred row, `gap-1.5 pt-2`: caption `text-muted` "Don't have an account?" + a link to
   `/register` styled as `label` in `teal`.
6. Hairline divider (`border-border`, 1px, `my-1`).
7. `Button` **"Continue with a demo account"**, `secondary`, `mt-1`.

On success → navigate to `/dashboard`, replacing history. The demo button calls
`createDemoSession()` then navigates to `/dashboard`.

### 11.2 `/register`

`AuthShell` with `title="Create account"`, `subtitle="Set up your UpPing profile"`.

Fields, in order: **Name** (placeholder "Your name", `autocomplete="name"`), **Email**,
**Password**, **Confirm password**. Submit is enabled only when email and password are non-empty
and the two passwords match. On mismatch, show an inline `caption` in `danger`: "Passwords don't
match" — and clear it automatically once the confirm field equals the password again.

`Button` **"Create account"**, icon `check`, primary. Mutation error → `ErrorState`
`title="Registration failed"`. Footer row, centred: "Already have an account?" + link to
`/login` labelled "Sign in" in `teal`.

Send `{ email, password, name: name.trim() || undefined }` — omit the name when blank.

### 11.3 `/dashboard` — "Live network telemetry"

Order top to bottom, `gap-4`:

1. **Header**: title "Dashboard", subtitle "Live network telemetry".
2. **Info chip row** — three `InfoChip`s, `gap-2.5`: **SSID** (`highlight`), **Local IP**,
   **Gateway**. See §12 for what these show on the web. `InfoChip` shows `—` when unknown.
3. **Target field** — `Field` labelled **"Target IP"**, mono, placeholder `8.8.8.8`,
   `autocomplete="off"`, `spellCheck={false}`. Read-only while a test is running. Submitting
   (Enter) starts the test.
4. **Controls row** — `gap-2.5`. `Button` **"Start Test"** (icon `play`, primary, `flex-1`,
   `mt-1`, disabled when the target is blank or a test is running). While running, also render
   `Button` **"Stop"** (icon `stop`, `danger`, `flex-1`, `mt-1`).
5. **Chart card** — `Card` with `padded={false}`, `overflow-hidden`:
   - inner `p-4` holds `<PingChart samples={livePing.samples} live={isRunning} />`
   - a stats strip below it, separated by a `border-t border-border` hairline, `p-4 gap-2.5`,
     holding three `StatCard`s: **Avg ms** (`avgLatencyMs === null ? '—' : String(avgLatencyMs)`),
     **Packets**, **Loss %** (`lossPercent.toFixed(1)`, `danger` when > 5).
6. **High-loss banner** — rendered when `lossPercent > 5 && !isRunning`:
   `bg-danger-soft`, `border-l-[3px] border-danger`, `rounded-control`, `p-3`, `gap-3`, row
   layout. Left: `label` in `danger` — `High packet loss detected (X.X%)` — over a `caption` in
   `text-secondary` — "Run a traceroute to find where the link breaks." Right: `Button`
   **"Diagnose"**, `danger`, icon `activity`, which navigates to `/diagnostics`.
7. **Performance Mode toggle** — inside a `Card` (`px-4`): label "Performance Mode", description
   "Prioritize throughput measurements over jitter smoothing". Component-local state, not
   persisted.

**Test lifecycle.** `useLivePing` is fed `intervalMs: Math.max(200, intervalS * 1000)`,
`timeoutMs: timeoutS * 1000`, `target: target.trim() || null` — `intervalS`/`timeoutS` come from
`settingsStore`.

`MAX_PACKETS = 100`: an effect calls the same stop handler as soon as the count is reached while
running, so a test always terminates on its own.

On stop, if there are samples, build and save the result:

```
id            = `local-${Date.now()}`
target        = target.trim()
started_at    = new Date(samples[0]?.timestamp ?? Date.now()).toISOString()
duration_ms   = samples.length > 0 ? Date.now() - samples[0].timestamp : 0
avg_latency_ms= round(mean of non-null rtt_ms)   // 0 when none
packet_count  = samples.length
loss_percent  = ((total - nonNull) / total * 100).toFixed(1)
rtts          = samples
```

Then `saveTest.mutate(test, { onSuccess: () => { if (autoSaveCsv) exportCsv.mutate(); } })`.

Keep the stop handler in a ref assigned during render, as the original does — it is called from
inside an effect and must not retrigger the effect.

### 11.4 `/diagnostics` — "Advanced network troubleshooting tools"

`max-w-[1000px]`, vertical `gap-7`.

**`DiagnosticSummary`** (full width, above the sections): the brand gradient, `rounded-card`,
`p-4 gap-3`.
- Top row: "All systems nominal" or "Attention needed" — `body` 15px/600 in white — plus a
  10px white dot at 90% opacity on the right.
- Attention is required when `unauthorized > 0 || verdict === 'critical' || duplicates > 0`.
- Metric row, `gap-3`, `justify-between` when wide: four `data` mono 20px white values over
  `caption` at 80% white labels — **Hosts**, **Duplicates**, **Unauthorized**, **Bandwidth**.
  Bandwidth reads `Nominal` / `Watch` / `Critical` for `ok` / `warning` / `critical`.

**Sections.** Each has a `section`-variant heading (13px, uppercase, `letter-spacing: 0.06em`) in
`text-muted`, then a `gap-4` container. When wide, sections are two equal columns.

| Section heading         | Column 1              | Column 2        |
| ----------------------- | --------------------- | --------------- |
| `Network discovery`     | `ArpScanCard`         | `PortScanCard`  |
| `Path & performance`    | `TracerouteCard`      | `BandwidthCard` |
| `Report`                | `PdfReportCard` (full width, single column)          |

### 11.5 `/history`

`useTests()` drives everything.

- **Header row** — `justify-between`, `mb-4`: title "History" on the left; `Button`
  **"Export CSV"** (`secondary`, icon `download`, `loading` while pending) on the right.
- **List** — flatten `data.pages`. Wire infinite scroll to an `IntersectionObserver` on a
  sentinel element (or the equivalent) with a 0.4 threshold, guarded by
  `hasNextPage && !isFetchingNextPage`. Do **not** implement a scroll listener by hand.
- **States**, in priority order when the list is empty:
  - loading → `<SkeletonList count={5} />`
  - error → `<ErrorState message="Could not load your ping history" onRetry={refetch} />`
  - otherwise → `<EmptyState title="No tests yet" description="Run your first ping from the Dashboard and it will show up here." />`
- **Footer** — a teal spinner while fetching the next page.
- **Export** — on success, download the CSV through a `Blob` + object URL:
  `type: 'text/csv;charset=utf-8'`, filename **`uppping-history.csv`**, revoke the URL after
  clicking. The original branched on `Platform.OS` to use the native share sheet on mobile —
  web only needs the download path.
- **Rows** — `<TestCard>` (§12.4), separated by 12px, delete via `removeTest.mutate(item.id)`.

### 11.6 `/settings`

Four sections, `gap-2`, `max-w-[720px]`. Each section heading is the `section` variant in
`text-secondary`, `mt-3 mb-1.5`.

| Heading       | Card contents                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------- |
| `Ping test`   | `Slider` **Ping Interval** (unit `s`, min 0.5, max 10, step 0.5) · hairline divider (`my-3`) · `Slider` **Timeout** (unit `s`, min 1, max 10, step 0.5) |
| `Storage`     | `Toggle` **Auto-save to CSV** — "Write the full test run into the server-side CSV export"       |
| `Appearance`  | `Toggle` **Dark theme** — "Manual switch — the app does not follow the system theme"            |
| `Account`     | `Button` **Log out** (`danger`, icon `logout`), full width                                     |

Divider is 1px `bg-border`, `my-3`. Cards use `px-4` only (vertical padding comes from the
sliders/toggles). Logging out clears the session and replaces the route with `/login`.

### 11.7 `/profile`

`max-w-[720px]`, `gap-4`.

- Header: title "Profile".
- **Loading** → a `Card` with `Skeleton` 88×88 r44, then 55%×20 r6 `mt-3.5`, then 35%×14 r6 `mt-2`.
- **Error or no user** → `<ErrorState message="Could not load your profile" onRetry={refetch} />`.
- **Profile card** — centred, `py-7 gap-1`:
  - avatar: 88×88 `rounded-badge` with the brand gradient containing a `user` icon at 38px,
    stroke 1.6, white; `mb-2.5`
  - name (`user.name || user.email`), `data` variant at 22px, truncated
  - badge: `rounded-badge bg-tint px-3 py-1 mt-2.5` containing the license label in `label`
    12px, `text-teal-deep`, letter-spacing 0.2px
- **Details card** — `padded={false} px-4`, rows separated by 1px `bg-border` dividers.
  Each row: `py-3.5`, `justify-between`, `gap-4`; label `body` `text-secondary`; value `body`
  `text-primary`, truncated, right-aligned, max 60% width, `flex-shrink: 0`. Values are mono
  where they are data:
  - Email → `user.email` (not mono)
  - App version → `APP_VERSION` (mono)
  - License → `licenseLabel(user.license_tier)` (not mono)
  - Member since → `formatDate(user.created_at)`, i.e.
    `toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })` (not mono)

`licenseLabel` title-cases each `_`/`-` separated segment: `"professional"` → `"Professional license"`.

### 11.8 `*` — Not found

A `Card` with title "Page not found", a `caption` in `text-secondary` explaining the URL does not
exist, and a primary `Button` "Go to Dashboard".

---

## 12. Component specs

### 12.1 The network chips — the one genuine mobile↔web gap

The mobile app used `expo-network` to read the SSID, the local IP and the default gateway.
**Browsers deliberately expose none of that**: `navigator.onLine` is the only reliable signal,
and even that is coarse. Do not fake it, and do not leave the chips blank-looking without an
explanation.

`useNetwork()` returns `{ info: NetworkInfo, status, refresh }` where `info.ssid` is a **label,
never a real SSID**. Implement:

1. `navigator.onLine` via online/offline event listeners → feed connectivity.
2. If `navigator.connection` exists (Chrome/Edge: `NetworkInformation`), use
   `effectiveType` to label the chip — `4g` → "4G", `3g` → "3G", `2g` → "2G", `slow-2g` → "Slow 2G",
   and `wifi`/unknown → "Wi-Fi". This is a **connection-class hint, not a network name**: put a
   comment saying so.
3. `localIp` and `gateway` → `null`, rendering as `—`. Provide an optional backend call
   `GET /network-info` returning `NetworkInfo`; if it succeeds use it, and if it fails fall back to
   `null`. Wrap in try/catch and never let it block first paint.
4. When offline, set the SSID chip value to "Offline".

This is a deliberate product decision, not a stub: the chips must remain present and meaningful
so the dashboard layout is unchanged.

### 12.2 `DiagnosticCard` — shared anatomy

Every diagnostics card uses this shell.

```
Card  (gap-3.5)
├─ header row        (flex, items-start, gap-3)
│  ├─ icon wrap      40×40, rounded-control, bg-tint, icon 20px in teal, centred
│  └─ header text    (flex-1, gap-0.5)
│     ├─ title       body variant, font-size 16px, weight 600
│     └─ description caption variant, text-muted
├─ body              (gap-2.5)
│  ├─ loading  → <SkeletonList count={3} />
│  ├─ error    → <ErrorState title="Could not load" message={error.message} onRetry={onRetry} />
│  └─ else     → children
└─ action row        (flex, justify-end) — only when `action` is provided
```

Loading shows only when there is no data yet (`isPending && !data`).

### 12.3 The five tool cards

**`ArpScanCard`** — icon `radar`, title "Topology Discovery", description "Layer-2 ARP scan of
the local subnet (duplicate IPs & unauthorized devices)". Action: `Button` "Run ARP Scan"
(icon `radar`).

Body when data exists:
- A `tint` summary strip, `p-2.5 rounded-[10px] gap-0.5`: `scanned_subnet` in `caption` mono
  `text-secondary`, then "N hosts · N duplicate(s) · N unauthorized" in `caption`
  `text-secondary` (singular/plural aware on "duplicate").
- Rows, `gap-1.5`: left block has IP then MAC, both `caption` mono (IP in `text-primary`, MAC in
  `text-muted`); right block, pushed to the end with `gap-2`: hostname (or vendor, or `—`) in
  `caption` `text-muted` truncating, then a pill badge.
- **Status badge** (`rounded-badge px-2 py-0.5`, label 10px white):
  - `Unauthorized` → `danger` background, when `!entry.known`
  - `Duplicate IP` → `warning` (`#D99A3D`) background
  - `Known` → `text-muted` background
- Duplicate detection: `duplicated_ips` entries are strings joined by `" / "`. Build the set with
  `new Set(duplicated.flatMap(d => d.split(' / ').map(s => s.trim())))` and test `dupSet.has(entry.ip)`.
  Unauthorized wins over duplicate when both apply.

**`TracerouteCard`** — icon `activity`, title "Traceroute", description "Incremental TTL path
trace — pinpoints where communication breaks". Body always contains a mono `Field` labelled
**"Target"**, default value **`8.8.8.8`**. Action: `Button` "Run Traceroute" (icon `activity`).

When a result exists, below the field:
- **Cause banner**, `p-2.5 rounded-[10px]`: label `text-secondary` on `bg-tint`, or `danger` on
  the local constant `#3D2B2B` when `cause === 'provider'`. Copy:
  - `local` → "Path breaks in the local network"
  - `provider` → "Path breaks in the ISP / provider"
  - `unknown` → "Path breaks in the unknown hop"
- **Hop rows**, `gap-1.5`: `#ttl` in `caption` mono `text-muted` at a fixed 26px column; then a
  `flex-1 gap-0.25` block with the IP in `caption` mono at 13px (`text-primary`, or `danger` on
  the break hop; falls back to `"timeout"` when `timed_out`, else `—`) and a `caption`
  `text-muted` line reading `"<hostname> · <rtt> ms"`, or just `"no reply"` when `rtt_ms === null`.
  The break hop also gets a `caption` in `danger`, italic: `"✕ break"`.

**`PortScanCard`** — icon `server`, title "TCP/UDP Service Audit", description "Silently probes
DNS, HTTP and HTTPS — a host can ping yet have a service down". Body always contains a mono
`Field` labelled **"Host"**, default **`192.168.1.30`**. Action: `Button` "Scan Ports"
(icon `server`).

Result body:
- `tint` summary strip, `p-2.5 rounded-[10px]`: `"<host> · <n> services probed"` in `caption`
  mono `text-secondary`.
- Rows, `gap-2`: a 42px-wide centred `bg-tint rounded-[8px] py-1` port badge (`caption` mono
  `text-primary`); the service name `body` 14px `text-secondary` at `flex-1`; a state pill
  (`rounded-badge px-2.5 py-1`, 11px white, capitalised) coloured `teal` for `open`, `danger` for
  `blocked`, `text-muted` for `closed`.

**`BandwidthCard`** — icon `activity`, title "Bandwidth vs. Latency", description
"Cross-correlates local traffic with latency to explain high pings". Action: `Button` "Refresh"
(`secondary`).

Result body:
- **Verdict alert**, `p-3 rounded-[10px] border-l-[3px]` with background `danger-soft` when
  critical and `bg-tint` otherwise; the left border and the label colour follow the verdict
  (`danger` / `warning` / `text-secondary`). The text is `verdict.message`.
- Three metrics, `gap-3`: **Latency** (`<avg> ms`, nested caption unit), **Downlink**
  (`<n> Mb/s ↓`, or `—` when absent), **Traffic** (the `activity` label — Idle / Downloading /
  Uploading / Saturated). Values are `data` mono 20px; latency turns `danger` when critical.
  Labels are `label` `text-muted`.

**`PdfReportCard`** — icon `file`, title "PDF Diagnostic Report", description "Downloads a PDF
with the 24h latency trend, packet-loss donut, and network tables". Action: `Button`
"Download PDF report" (icon `download`), disabled until both the latency and loss queries have
data.

Body: a caption in `text-muted` — "Generated client-side with jsPDF (temporary until the backend
provides it)." — then a **Preview** block (`section` heading "Preview" in `text-secondary`):
- `<LatencySparkline points={latency.data ?? []} />`
- A row (`gap-6`, vertically centred): `<LossDonut slices={loss.data ?? []} />` beside a legend
  (`gap-2`), each entry a 10px dot in the slice colour plus a `caption` `text-secondary`
  reading `"<label> · <value>%"`.
- While either preview query is loading, show a `caption` `text-muted` "Loading preview…".

On click, build the `PdfInput` (§13) from whatever data exists and generate the PDF client-side,
then download it as **`uppping-diagnostics-<timestamp>.pdf`**.

### 12.4 `TestCard`

`rounded-card p-4 gap-3`, `bg-surface`, shadow in light / `dark:border dark:border-border` in
dark. `aria-label`: `"Test to <target>, average <avg> ms, loss <loss>%"`.

- **Header row**, `justify-between gap-3`: the target in `body` mono, truncating; the start date
  in `caption` `text-muted`.
  Date format: `toLocaleDateString(undefined, { day: '2-digit', month: 'short', hour: '2-digit',
  minute: '2-digit' })`. If the string does not parse, render it unchanged.
- **Stats row**, `gap-4`, three `flex-1 gap-0.5` blocks — **Avg** (`<rounded avg>` + nested
  caption ` ms`), **Packets**, **Loss** (`<loss.toFixed(1)>%`). Loss text **and** its label turn
  `danger` when `loss_percent > 5`; the others are `text-primary` value / `text-muted` label.
- **Latency bar**: a 5px `rounded` track in `bg-tint` holding a fill in `teal` (or `danger` when
  loss is high) at `width: min(1, avg_latency_ms / 500) * 100%`. Expose it as
  `role="progressbar"` with `aria-valuenow` 0–100.

**Deletion.** The mobile card used a swipe gesture (`PanResponder`) to reveal delete. Swipe does
not exist on the web. Replace it with an explicit, discoverable control: a `trash` icon button at
the card's top-right (`aria-label="Delete test"`, 20px icon, `text-muted`, turning `danger` on
hover/focus), **plus** a `window.confirm("Delete this test?")` guard before calling `onDelete`.
This is a required substitution, not an optional improvement — do not ship a card with no way
to delete.

### 12.5 Charts — all hand-written SVG

No chart library. Each is a component taking data and returning an `<svg>` with a fixed `viewBox`
and `width="100%"`, so it scales with the container.

**`PingChart`** — the live latency plot.

```
viewBox "0 0 320 130"   W=320  H=130  PAD=14  MAX_VISIBLE=40
PLOT_W = W - PAD*2 = 292      PLOT_H = H - PAD*2 = 102
```

- Header row above the SVG, `justify-between mb-1`: a `caption` `text-muted` reading
  `"Latency · last <n> packets"` where `n = min(samples.length, 40)` (0 when empty). When
  running with data, a live row on the right (`gap-1.5`): an 8px `rounded-badge` `bg-teal` dot
  pulsing between opacity 0.35 and 1 over 800ms each way, plus `caption` `text-secondary` "live".
- Only the **last 40** samples are plotted.
- Vertical scale: `scaleMax = Math.max(maxRtt, 20)` — never below 20ms, so a fast link still
  fills the plot.
- `toPoint(i, count, rtt, scaleMax)`: `x = count <= 1 ? W/2 : PAD + (i / (count - 1)) * PLOT_W`;
  `y = PAD + max(0, PLOT_H - (rtt / scaleMax) * PLOT_H)`.
- Elements, in order:
  1. baseline `<line>` from `(PAD, PAD+PLOT_H)` to `(PAD+PLOT_W, PAD+PLOT_H)`,
     stroke `border`, width 1
  2. when running with **no** samples yet: a dashed centre line at `y = H/2`, stroke
     `text-muted`, width 1.4, `stroke-dasharray="4 6"`
  3. a `<polyline>` of all non-null points, `fill="none"`, stroke `teal`, width **2.2**,
     `stroke-linejoin/linecap="round"`
  4. a `<circle r="2.6">` in `teal` on **every** non-null point
  5. when running and there is a last point: a halo `<circle r="7">` in `teal` pulsing between
     opacity 0.1 and 0.6
- Below the SVG, an absolutely-centred `caption` `text-muted` "Waiting for packets…" when
  running with no data.
- Scale labels, `flex justify-between mt-0.5`: "0 ms" left, `"<scaleMax> ms"` right — both
  `caption` mono `text-muted`.

Lost packets (`rtt_ms === null`) are skipped entirely — they are gaps in the line, not zero-valued
points. Do not plot them as 0.

**`LatencySparkline`** — the 24h trend preview.

```
viewBox "0 0 320 110"   H=110   PAD = { top: 12, bottom: 18, left: 30, right: 8 }
PLOT_W = 282      PLOT_H = 80
```

- Empty points → a `caption` `text-muted` "No data", nothing else.
- Normalise against the actual min/max of the series, `span = Math.max(max - min, 1)`, so the line
  always uses the full height:
  `x = PAD.left + (len <= 1 ? 0 : (i / (len - 1)) * PLOT_W)`,
  `y = PAD.top + PLOT_H - ((ms - min) / span) * PLOT_H`.
- baseline `<line>` in `border` width 1; `<polyline>` stroke `teal` width 2, round joins/caps.
- Labels below, `flex justify-between`: "0 ms" and `"<max> ms"`, `caption` mono `text-muted`.
  (The labels are nominal, as in the original — the geometry is min/max-normalised.)

**`LossDonut`** — packet-loss ring. Props `slices`, `size = 120`, `thickness = 14`.

```
r = (size - thickness) / 2      cx = cy = size / 2
total = sum(values) || 1
```

- Track: a full `<circle>` with `fill="none"`, stroke `tint`, width `thickness`.
- Slices with `value > 0`, drawn in order. Each is an arc path starting at 12 o'clock:

  ```ts
  function polar(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx, cy, r, startDeg, endDeg) {
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const s = polar(cx, cy, r, startDeg);
    const e = polar(cx, cy, r, Math.min(endDeg, startDeg + 359.99));
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }
  ```

  `start = (cursor / total) * 360`, then `cursor += value`, `end = (cursor / total) * 360`.
  Stroke is the slice's own colour, width `thickness`, `stroke-linecap="round"`, `fill="none"`.
- Centre: the total as `data` mono `text-primary`, absolutely positioned over the ring.
- With the demo data this renders 96% teal / 4% danger.

---

## 13. PDF report

`src/lib/pdf/generateDiagnosticsPdf.ts`, using `jspdf`. The original drew tables by hand because
the Expo-bundled `jspdf` build lacked `getY()`/`setY()`. That constraint is **gone on the web** —
`jspdf-autotable` is a normal dependency here and is the recommended way to build the tables.
Falling back to manual drawing is acceptable if you must stay on one dependency, but do not
reproduce the manual cursor-tracking machinery out of habit.

### 13.1 Geometry and palette

```
unit: 'mm', format: 'a4'     PAGE_W 210   PAGE_H 297   MARGIN 14

TEAL      = [79, 160, 149]     // #4FA095
TEAL_DARK = [51, 117, 107]     // #33756B
WARNING   = [217, 154, 61]     // #D99A3D
DANGER    = [200, 87, 74]      // #C8574A
MUTED     = [110, 130, 122]
INK       = [28, 44, 38]
```

### 13.2 `PdfInput`

```ts
export interface PdfInput {
  generated_at: string;
  summary?: {
    hosts: number;
    duplicates: number;
    unauthorized: number;
    verdict: 'ok' | 'warning' | 'critical';
  };
  latency: LatencyPoint[];
  loss: { label: string; value: number; color: string }[];
  arp?: ArpScanResult;
  traceroute?: TracerouteResult;
  portScan?: PortScanResult;
  bandwidth?: LatencyBandwidthCorrelation;
}
```

### 13.3 Document structure — exact order

1. **Header band** — a filled `TEAL_DARK` rectangle from `(0,0)` spanning the full page width,
   32mm tall. Inside, white text: `"UpPing Diagnostic Report"` in bold 20pt at `y = 15`, and
   `Generated <toLocaleString() of generated_at>` in regular 10pt at `y = 23`. Content starts
   at `y = 40`.
2. **Risk summary** (only if `summary` is present) — a 2×8mm filled rectangle at `x = MARGIN`,
   in `DANGER` for `critical`, `WARNING` for `warning`, else `TEAL`. To its right at
   `x = MARGIN + 6`: bold 12pt text in the same colour reading
   `Risk: All systems nominal` / `Risk: Watch` / `Risk: Critical — attention needed`, then
   regular 9pt `MUTED` text 6mm lower:
   `"<hosts> hosts detected · <duplicates> duplicate IP[s] · <unauthorized> unauthorized"`.
   Advance 16mm.
3. **Section heading** — uppercase, bold 13pt, `TEAL`, with a 0.4mm `TEAL` rule 1.2mm beneath
   spanning the content width. Advance 22mm if it would overflow the page, and 7mm otherwise.
4. **`LATENCY — LAST 24H`** — a sparkline 150mm wide × 34mm tall drawn in `TEAL` at 1mm line
   width with round joins over a `MUTED` 0.2mm baseline, min/max-normalised, plus a filled 1.2mm
   teal dot on the final point. Below it, 8pt `MUTED` labels: "0 ms" at `x = MARGIN` and
   `"<max> ms"` at `x = MARGIN + 150`.
5. **`PACKET LOSS`** — only if `loss.length > 0`. A donut of radius 12mm centred at
   `x = 32`, drawn as `setLineWidth(5)` strokes: 360 segments per full circle, at least 2 per
   slice, starting at -90°, each stroke in the slice's hex colour (default `#4FA095`). Beside it
   at `x = 50`, a legend: a 5×5mm filled square in the slice colour at
   `y = donutCy - 6 + i*8`, and the label `"<label>: <value>%"` in `INK` 9pt at `x = 59`.
6. **`BANDWIDTH VS LATENCY`** — only if `bandwidth` is present. Regular 10pt `INK`:
   `"Avg latency <n> ms · Down <n|—> Mb/s · Up <n|—> Mb/s"`, then italic 9pt `MUTED` with
   `message` 6mm below.
7. **`TOPOLOGY DISCOVERY — <scanned_subnet>`** — only if `arp` is present. Table columns
   `IP | MAC | Hostname | Vendor | Status`, widths `30, 38, 34, 30, 40` mm. Status is
   `Unauthorized` when `!known`, else `Duplicate IP` when the IP is in the split set, else `Known`.
8. **`TRACEROUTE — <target>`** — only if `traceroute` is present. Columns
   `TTL | IP | Hostname | RTT (ms) | Status`, widths `20, 40, 45, 28, 39` mm. Status is `timeout`
   when `timed_out`, else `break` at `broke_at_hop`, else `ok`.
9. **`SERVICE AUDIT — <host>`** — only if `portScan` is present. Columns
   `Port | Service | State`, widths `40, 60, 40` mm.

**Table styling:** header row filled `TEAL` with white bold 8pt text; body rows regular 8pt
`INK` with a 0.15mm `RGB(220,225,220)` rule under each; 2mm cell padding, 6mm rows, 7mm header.
Repeat the header when a table spans a page break, and start a new page rather than overflowing
the bottom margin.

### 13.4 Output and download

```ts
export function generateDiagnosticsPdf(input: PdfInput): Blob;
export function downloadPdfBlob(blob: Blob, filename: string);
```

`generateDiagnosticsPdf` returns `doc.output('blob')`. `downloadPdfBlob` creates an object URL,
creates an `<a>`, appends it to `document.body`, clicks it, removes it, then revokes the URL.

The mobile app fell back to the `POST /diagnostics/report` backend mutation on native. **Web
only: always generate client-side.** Remove that branch.

---

## 14. Build order

Follow this order. Each step is verifiable on its own.

1. **Scaffold** — Vite React-TS, Tailwind v4 via `@tailwindcss/vite`, `@` alias, fonts, `index.css`
   with the full token block, `ThemeProvider` + `themeStore`, base `AppText`/`Card`/`Button`/
   `Icon`. Verify: the app renders "UpPing" in Manrope with the correct palette and the theme
   toggle repaints everything.
2. **Stores + API + demo** — §8, §7, §9. Verify: with no backend, nothing throws and
   `isDemoSession()` returns true in demo mode.
3. **Router + AppShell** — Sidebar, TabBar, `useMediaQuery`, `ProtectedRoute`, `RootRedirect`,
   `NotFound`. Verify: resizing across 768px swaps sidebar and tab bar; unauthenticated users
   bounce to `/login`.
4. **Auth screens** — §11.1, §11.2. Verify: demo button enters the app; real login against a live
   backend stores tokens and lands on the Dashboard.
5. **Ping engine + Dashboard** — §10, §11.3, `PingChart`. Verify: run a test against `8.8.8.8`,
   see samples stream in, watch the 100-packet auto-stop, confirm the row lands in History.
6. **History + Settings + Profile** — §11.5–11.7, `TestCard`. Verify: infinite scroll, CSV
   download, delete, sliders persisting across reload, profile rendering the demo user.
7. **Diagnostics** — §11.4, §12.2, §12.3. Verify: all five cards render demo data and the
   summary banner flips to "Attention needed" for the duplicated/unauthorized ARP data.
8. **PDF** — §13. Verify: download a real `.pdf` with the header band, sparkline, donut and
   three tables.

---

## 15. Definition of done

- [ ] `npm run build` completes with zero TypeScript errors, `strict: true`, no `any` in
      application code
- [ ] `tsc --noEmit` is clean
- [ ] `npm run dev` serves the app and **all seven routes** render without console errors
- [ ] With `VITE_DEMO_MODE=true` and **no backend running**, the app boots into the Dashboard and
      every screen is fully populated — including History, Diagnostics, Profile, the CSV export
      and the PDF download
- [ ] With a real backend at `VITE_API_URL`, login → Dashboard → run a test → History shows the
      row → reload keeps the session → a 401 triggers exactly one refresh and one retry
- [ ] Theme toggle persists across reload; the dark background is pure `#000000`
- [ ] Resizing from 1200px to 600px swaps the sidebar for the tab bar without a reload
- [ ] Every interactive element is reachable and operable by keyboard alone, with a visible
      focus ring
- [ ] No hardcoded colour outside `index.css` and the PDF constants — verify with
      `grep -rE "#[0-9A-Fa-f]{6}" src/`
- [ ] JetBrains Mono appears only on data values, never on prose
- [ ] `prefers-reduced-motion: reduce` disables the skeleton pulse, the chart pulse and the
      toggle animation
- [ ] The PDF opens in a standard viewer and contains every section in §13.3
- [ ] `README.md` documents setup, the env vars, demo mode and the scripts

Scripts: `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit`).

---

## 16. Optional web-only enhancements

Not required. Implement only if they do not compromise §15. Each is a genuine web affordance the
mobile app could not have.

1. **Keyboard shortcuts** — `Enter` in the target field starts a test (already required),
   `Ctrl/Cmd+K` to focus the target field, `Esc` to stop a running test.
2. **`prefers-reduced-motion`** — mandatory, see §15.
3. **Focus management on navigation** — move focus to the page `<h1>` and announce the route
   change via a polite live region. Screen-reader users otherwise get no signal that the view
   changed.
4. **Document meta** — `<title>UpPing</title>`, description, theme-color meta that follows the
   active theme, and an SVG favicon reusing the mint rounded-square logo mark.
5. **Backend-hosted deep links** — the ping test measures the *browser's* network, not the
   server's. Expose an optional `POST /tests/run` so a backend-initiated test exists for users
   behind restrictive corporate proxies. Out of scope for this build; just leave the seam.
6. **`navigator.onLine`** in the dashboard chips (§12.1) — worth doing, low cost.

Do **not** add: a service worker / PWA manifest, a router-mode toggle (hash vs browser),
client-side routing animation libraries, a form library, a toast library, or a global error
boundary that swallows errors silently.

---

## Appendix A — Quick reference

| Constant                | Value                                    |
| ----------------------- | ---------------------------------------- |
| Wide breakpoint         | `768px`                                  |
| Page max-width (most)   | `720px`                                  |
| Page max-width (Diags)  | `1000px`                                 |
| Sidebar width           | `232px`                                  |
| Max packets per test    | `100`                                    |
| Chart visible window    | last `40` samples                        |
| Min ping interval       | `200ms` (`max(200, intervalS * 1000)`)   |
| Loss danger threshold   | `> 5%`                                   |
| Latency bar full scale  | `500ms`                                  |
| History page size       | `20`                                     |
| CSV filename (history)  | `uppping-history.csv`                    |
| CSV filename (PDF)      | `uppping-diagnostics-<ts>.pdf`           |
| Storage keys            | `uppping.auth`, `uppping.theme`, `uppping.settings` |
| Query stale time        | `30_000`                                 |

## Appendix B — Substitutions from the mobile original

Every deliberate difference, in one place, so nothing looks accidental:

| Original (RN/Expo)            | Web replacement                                  |
| ----------------------------- | ------------------------------------------------ |
| `expo-router` file routing    | `react-router-dom` v7 `createBrowserRouter`       |
| `StyleSheet.create`           | Tailwind utilities + tokens in `index.css`        |
| `View` / `Text`               | `<div>` / `<Text>` (§4.2)                         |
| `Pressable`                   | `<button>` / `<a>` with `focus-visible` rings     |
| `ScrollView` / `FlatList`     | scroll containers; **IntersectionObserver** for pagination |
| `useWindowDimensions()`       | `useMediaQuery('(min-width: 768px)')`             |
| `SafeAreaView` / insets       | CSS `min-height` + padding; no notch handling     |
| `Animated` pulse / loop       | CSS `@keyframes`; disabled under reduced motion   |
| `PanResponder` (slider)       | `<input type="range">` styled to spec, + keyboard |
| `PanResponder` (swipe delete) | explicit trash button + `window.confirm`          |
| `expo-secure-store`           | `localStorage` (synchronous, try/catch guarded)   |
| `expo-linear-gradient`        | CSS `linear-gradient(135deg, mint, teal)`         |
| `expo-font`                   | `@fontsource-variable/*`                          |
| `expo-splash-screen`          | render-blocking until rehydration in `ThemeProvider` |
| `expo-status-bar`             | `<meta name="theme-color">` following the theme    |
| `expo-constants` version      | `VITE_APP_VERSION` / `package.json`               |
| `expo-network`                | `navigator.onLine` + `navigator.connection` (§12.1) |
| `react-native-svg`            | native `<svg>` elements                           |
| `expo-network` SSID           | connection-class hint, explicitly labelled as such |
| `Share.share()` for CSV       | `Blob` + object URL + synthetic `<a>` click       |
| `process.env.EXPO_PUBLIC_*`   | `import.meta.env.VITE_*` via `lib/config.ts`      |
| `@` alias → repo root         | `@` alias → `src/`                                 |