# UpPing — Diagnóstico de Red (Web)

> Mide latencia, pérdida de paquetes y velocidad de conexión directamente desde tu navegador. Sin instalar nada.

![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10+-F69220?logo=pnpm&logoColor=white)

---

## 📋 Tabla de contenido

1. [Descripción](#-descripción)
2. [Stack tecnológico](#-stack-tecnológico)
3. [Requisitos previos](#-requisitos-previos)
4. [Instalación](#-instalación)
5. [Variables de entorno](#-variables-de-entorno)
6. [Scripts disponibles](#-scripts-disponibles)
7. [Modo demo (sin backend)](#-modo-demo-sin-backend)
8. [Estructura del proyecto](#-estructura-del-proyecto)
9. [Arquitectura](#-arquitectura)
10. [Routing](#-routing)
11. [Contrato con el backend (API)](#-contrato-con-el-backend-api)
12. [Build de producción y deploy](#-build-de-producción-y-deploy)
13. [Solución de problemas](#-solución-de-problemas)
14. [Licencia](#-licencia)

---

## 📖 Descripción

**UpPing Web** es una SPA (Single Page Application) de diagnóstico de red. Es la versión web de una aplicación React Native (Expo) preexistente, construida desde cero como proyecto independiente.

### Funcionalidades principales

- **Dashboard** — Test de ping en vivo contra un target configurable, gráfico de latencia en tiempo real, estadísticas (latencia promedio, pérdida de paquetes, cantidad de muestras).
- **Diagnósticos** — Test de velocidad (descarga/subida), generación de reportes PDF.
- **Historial** — Listado paginado (cursor-based) de tests pasados, exportación CSV, eliminación individual.
- **Configuración** — Tema (claro/oscuro), intervalo de ping, timeout, target por defecto.
- **Perfil** — Información del usuario, tier de licencia, cierre de sesión.
- **Modo demo completo** — Toda la app es explorable sin backend, con datos generados en memoria.

---

## 🛠 Stack tecnológico

| Área | Tecnología | Versión |
|---|---|---|
| Build tool | [Vite](https://vite.dev) | 7.x |
| Framework | [React](https://react.dev) | 19.x |
| Lenguaje | [TypeScript](https://www.typescriptlang.org) | ~5.9 (strict mode) |
| Routing | [React Router DOM](https://reactrouter.com) | 7.x |
| Estado del servidor | [TanStack React Query](https://tanstack.com/query) | 5.x |
| Estado del cliente | [Zustand](https://zustand.docs.pmnd.rs) | 5.x (con middleware `persist`) |
| Estilos | [Tailwind CSS](https://tailwindcss.com) | 4.x (configuración CSS-first) |
| Gráficos | SVG inline (sin librería de charts) | — |
| PDF | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | 3.x / 5.x |
| Tipografías | [@fontsource-variable/manrope](https://fontsource.org/fonts/manrope) + [@fontsource-variable/jetbrains-mono](https://fontsource.org/fonts/jetbrains-mono) | 5.x |
| Package manager | [pnpm](https://pnpm.io) | 10.x+ |

---

## ✅ Requisitos previos

Antes de clonar y correr el proyecto, asegurate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| **Node.js** | 20.x (recomendado: 22+ / 24+) | `node --version` |
| **pnpm** | 10.x | `pnpm --version` |
| **Git** | 2.x | `git --version` |

### Instalar Node.js

Descargá la versión LTS desde [nodejs.org](https://nodejs.org/) o usá un version manager:

```bash
# Con nvm (Linux/macOS)
nvm install 22
nvm use 22

# Con nvm-windows (Windows)
nvm install 22
nvm use 22

# Con fnm (multiplataforma)
fnm install 22
fnm use 22
```

### Instalar pnpm

```bash
# Opción 1: via corepack (incluido con Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# Opción 2: instalación standalone
npm install -g pnpm
```

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO> up-ping-web
cd up-ping-web

# 2. Instalar dependencias
pnpm install

# 3. Crear el archivo de configuración local
cp .env.example .env
#    En Windows (CMD):  copy .env.example .env
#    En Windows (PowerShell):  Copy-Item .env.example .env

# 4. (Opcional) Editar .env con tus valores — ver sección Variables de entorno

# 5. Levantar el servidor de desarrollo
pnpm dev
```

La app se abrirá en **http://localhost:5173** (o el puerto que Vite asigne).

---

## 🔑 Variables de entorno

Crear un archivo `.env` en la raíz del proyecto basándose en [`.env.example`](.env.example):

```dotenv
# URL base del backend FastAPI.
# En desarrollo local, es el servidor del backend de UpPing.
VITE_API_URL=http://localhost:8000

# Versión de la app. Se muestra en la página de Perfil.
VITE_APP_VERSION=1.0.0
```

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000` | URL base de la API REST (FastAPI). Todas las llamadas se hacen contra esta URL. |
| `VITE_APP_VERSION` | No | `1.0.0` | Versión mostrada en la pantalla de perfil del usuario. |

> [!IMPORTANT]
> Las variables con prefijo `VITE_` son inyectadas **en tiempo de build** por Vite. Si las cambiás, necesitás reiniciar el servidor de desarrollo o re-buildear.

> [!NOTE]
> La app nunca lee `import.meta.env` directamente desde componentes. Todo pasa por [`src/lib/config.ts`](src/lib/config.ts), que centraliza la lectura de configuración.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo de Vite (HMR habilitado). |
| `pnpm build` | Ejecuta TypeScript type-check (`tsc -b`) y genera el build de producción en `dist/`. |
| `pnpm preview` | Sirve el build de producción localmente para verificarlo antes de deployar. |
| `pnpm typecheck` | Ejecuta el type-check de TypeScript sin emitir archivos (`tsc --noEmit`). |

### Ejemplo completo (build + preview)

```bash
pnpm build
pnpm preview
# Abre http://localhost:4173
```

---

## 🎭 Modo demo (sin backend)

La app incluye un **modo demo completo** que permite explorar todas las pantallas sin necesidad de un backend corriendo. Se activa de dos formas:

### Desde la UI

En la pantalla de Login, hacé clic en el botón **"Continuar con cuenta demo"**. Esto genera una sesión falsa en memoria y te redirige al Dashboard con datos sintéticos.

### Desde la pantalla de Login

El botón de demo en la pantalla de login crea una sesión demo on-demand con tokens ficticios (`uppping.demo.access` / `uppping.demo.refresh`), un usuario falso y datos de ejemplo para todas las secciones (tests, diagnósticos, historial, etc.).

> [!TIP]
> El modo demo es ideal para **demos a clientes, testing de UI, o desarrollo front-end** cuando el backend aún no está disponible.

---

## 📁 Estructura del proyecto

```
up-ping-web/
├── index.html                          # HTML entry point (lang="es", data-theme="light")
├── vite.config.ts                      # Plugins: React + Tailwind CSS v4, alias @ → src
├── tsconfig.json                       # Referencias a tsconfig.app.json y tsconfig.node.json
├── tsconfig.app.json                   # Config TS para src/ (strict, paths @/*)
├── tsconfig.node.json                  # Config TS para vite.config.ts
├── package.json                        # Dependencias y scripts
├── pnpm-lock.yaml                      # Lockfile de pnpm
├── .env.example                        # Template de variables de entorno
├── .gitignore
├── PROMPT.md                           # Especificación original de la app
│
└── src/
    ├── main.tsx                        # Entry point React (StrictMode → App)
    ├── App.tsx                         # Providers + Router (Theme → QueryClient → BrowserRouter)
    ├── index.css                       # Tailwind imports, @theme tokens, [data-theme] paletas
    │
    ├── components/
    │   ├── AppText.tsx                 # Componente <Text> con type scale (title/body/data/etc.)
    │   ├── Button.tsx                  # primary | secondary | ghost | danger
    │   ├── Card.tsx                    # Superficie con sombra (light) / borde (dark)
    │   ├── Field.tsx                   # Input con label, soporte mono para IPs
    │   ├── Toggle.tsx                  # Switch animado con label
    │   ├── Slider.tsx                  # Control deslizable accesible (role="slider")
    │   ├── Icon.tsx                    # 19 iconos SVG inline (24×24, stroke)
    │   ├── StatCard.tsx               # Métrica con valor grande + label
    │   ├── InfoChip.tsx               # Chip con gradiente (highlight) o tinted
    │   ├── TestCard.tsx               # Tarjeta de resultado de test
    │   ├── Skeleton.tsx               # Loading placeholder con pulse animation
    │   ├── EmptyState.tsx             # Estado vacío con ícono + texto
    │   ├── ErrorState.tsx             # Estado de error con retry
    │   ├── AccountUpsell.tsx          # Prompt para crear cuenta
    │   │
    │   ├── charts/
    │   │   ├── PingChart.tsx          # Gráfico SVG de latencia en vivo
    │   │   ├── LatencySparkline.tsx   # Sparkline de 24h
    │   │   ├── LossDonut.tsx          # Donut de pérdida de paquetes
    │   │   └── SpeedChart.tsx         # Gráfico de velocidad
    │   │
    │   ├── diagnostics/
    │   │   ├── SpeedTestCard.tsx      # Card de test de velocidad
    │   │   ├── PdfExportCard.tsx      # Card de generación/descarga PDF
    │   │   ├── UnavailableToolsCard.tsx # Card para herramientas no disponibles
    │   │   └── tableParts.tsx         # Componentes reutilizables de tabla
    │   │
    │   └── shell/
    │       ├── AppShell.tsx           # Layout: sidebar (≥768px) | tabbar (<768px)
    │       ├── AppShellSkeleton.tsx   # Skeleton del shell durante carga
    │       ├── AuthShell.tsx          # Layout para login/register
    │       ├── Sidebar.tsx            # Navegación lateral (232px)
    │       └── TabBar.tsx             # Barra de navegación inferior (mobile)
    │
    ├── hooks/
    │   ├── usePingTest.ts             # Lógica del test de ping en vivo
    │   ├── useSpeedTest.ts            # Lógica del test de velocidad
    │   ├── useGeneratePdf.ts          # Generación de reporte PDF
    │   ├── useSignOut.ts              # Cierre de sesión
    │   └── useTheme.ts               # Lectura del tema actual
    │
    ├── lib/
    │   ├── config.ts                  # API_URL, APP_VERSION (centraliza import.meta.env)
    │   ├── navigation.ts             # NAV_ITEMS (rutas + íconos)
    │   ├── pendingTest.ts             # Gestión de test en progreso
    │   ├── queryClient.ts            # Instancia de QueryClient (staleTime: 30s)
    │   │
    │   ├── api/
    │   │   ├── client.ts             # Fetch wrapper con auth, refresh, error handling
    │   │   ├── auth.ts               # login, register, me (con fallback demo)
    │   │   ├── tests.ts              # CRUD de tests + export CSV
    │   │   └── bandwidth.ts          # API de ancho de banda
    │   │
    │   ├── pdf/
    │   │   └── diagnosticsPdf.ts     # Generación del PDF de diagnóstico (jsPDF)
    │   │
    │   ├── theme/
    │   │   ├── tokens.ts             # 12+2 tokens de color (light/dark)
    │   │   └── ThemeProvider.tsx      # Proveedor de tema + hidratación Zustand
    │   │
    │   └── utils/
    │       ├── aggregate.ts          # Funciones de agregación de datos
    │       ├── download.ts           # Descarga de archivos en el browser
    │       ├── format.ts             # Formateo de fechas, números, duración
    │       ├── latencyHealth.ts      # Clasificación de salud de latencia
    │       ├── mediaQuery.ts         # Hook useMediaQuery (matchMedia)
    │       └── resolveTarget.ts      # Resolución de target de ping
    │
    ├── pages/
    │   ├── LandingPage.tsx           # Redirect inicial (/ → /dashboard o /login)
    │   ├── LoginPage.tsx             # Login + botón de demo
    │   ├── RegisterPage.tsx          # Registro de cuenta
    │   ├── DashboardPage.tsx         # Dashboard principal con ping test
    │   ├── DiagnosticsPage.tsx       # Herramientas de diagnóstico
    │   ├── HistoryPage.tsx           # Historial de tests
    │   ├── SettingsPage.tsx          # Configuración (tema, intervalos)
    │   ├── ProfilePage.tsx           # Perfil del usuario
    │   └── NotFoundPage.tsx          # 404
    │
    ├── router/
    │   └── guards.tsx                # HydratedRoute, ProtectedRoute, PublicOnlyRoute
    │
    ├── store/
    │   ├── authStore.ts              # Zustand store (tokens, user, persist)
    │   ├── authStore.selectors.ts    # Selectores del auth store
    │   ├── settingsStore.ts          # Preferencias de ping (interval, timeout, target)
    │   └── themeStore.ts             # Tema seleccionado (persist)
    │
    └── types/
        ├── api.ts                    # ApiEnvelope, CursorPage
        ├── auth.ts                   # LoginRequest, TokenResponse, etc.
        ├── diagnostics.ts            # ArpScanResult, TracerouteResult, etc.
        ├── network.ts                # NetworkInfo
        ├── test.ts                   # PingSample, TestResult, TestRangeValues
        └── user.ts                   # User, LicenseTier
```

---

## 🏗 Arquitectura

### Diagrama de capas

```
┌──────────────────────────────────────────────────┐
│                    Páginas                        │
│  (Dashboard, Diagnostics, History, Settings, ...) │
├──────────────────────────────────────────────────┤
│              Componentes + Hooks                  │
│  (AppText, Card, Button, usePingTest, ...)       │
├──────────────────────────────────────────────────┤
│              Estado (Zustand stores)              │
│  authStore ─ themeStore ─ settingsStore           │
├──────────────────────────────────────────────────┤
│            Capa de datos (TanStack Query)         │
│  queryClient ─ useQuery ─ useMutation             │
├──────────────────────────────────────────────────┤
│               API Client (fetch)                  │
│  client.ts → auth/refresh automático + fallback   │
├──────────────────────────────────────────────────┤
│           Backend FastAPI (externo)               │
│      o Modo Demo (datos en memoria)               │
└──────────────────────────────────────────────────┘
```

### Sistema de temas

La app usa un sistema de **12 tokens de color** (+2 extensiones) definidos como CSS custom properties. El tema se cambia actualizando el atributo `data-theme` en `<html>`, y Tailwind v4 resuelve los colores en runtime vía `var()`.

- **Tema claro** — fondo warm off-white (`#FCFBF2`), superficies blancas con sombras sutiles.
- **Tema oscuro** — fondo pure black (`#000`), superficies near-black con cast verde/teal, bordes hairline.

El estado del tema persiste en `localStorage` vía Zustand `persist`.

### Breakpoint responsive

**768px** es el único breakpoint:
- **≥768px** → Sidebar fijo de 232px + contenido principal.
- **<768px** → Tab bar inferior con 5 ítems.

---

## 🗺 Routing

| Ruta | Página | Guard | Descripción |
|---|---|---|---|
| `/` | `LandingPage` | — | Redirect a `/dashboard` si autenticado, sino a `/login` |
| `/login` | `LoginPage` | `PublicOnlyRoute` | Login + acceso demo |
| `/register` | `RegisterPage` | `PublicOnlyRoute` | Registro de cuenta |
| `/dashboard` | `DashboardPage` | `HydratedRoute` + `AppShell` | Test de ping en vivo |
| `/diagnostics` | `DiagnosticsPage` | `HydratedRoute` + `AppShell` | Herramientas de diagnóstico |
| `/history` | `HistoryPage` | `HydratedRoute` + `AppShell` | Historial de tests |
| `/settings` | `SettingsPage` | `HydratedRoute` + `AppShell` | Configuración |
| `/profile` | `ProfilePage` | `ProtectedRoute` + `AppShell` | Perfil (requiere autenticación) |
| `*` | `NotFoundPage` | — | 404 |

> [!NOTE]
> Dashboard, Diagnostics, History y Settings son accesibles sin autenticación (para permitir el modo demo sin login). Solo Profile requiere sesión activa (`ProtectedRoute`).

---

## 🔌 Contrato con el backend (API)

La app espera un backend FastAPI corriendo en `VITE_API_URL`. A continuación, los endpoints consumidos:

### Autenticación

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password }` | `{ access_token, refresh_token, token_type }` |
| `POST` | `/auth/register` | `{ email, password, name? }` | `{ access_token, refresh_token, token_type }` |
| `POST` | `/auth/refresh` | `{ refresh_token }` | `{ access_token }` |

### Usuario

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/me` | `{ id, email, name, license_tier, created_at }` |

### Tests de ping

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| `GET` | `/tests` | `?cursor=<string>` | `{ items: TestResult[], next_cursor: string \| null }` |
| `POST` | `/tests` | `TestResult` | `TestResult` |
| `DELETE` | `/tests/{id}` | — | — |
| `GET` | `/tests/export` | — | CSV (text/plain) |

### Diagnósticos (pueden no estar implementados aún)

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/diagnostics/arp` | `ArpScanResult` |
| `POST` | `/diagnostics/traceroute` | `TracerouteResult` |
| `POST` | `/diagnostics/portscan` | `PortScanResult` |
| `GET` | `/diagnostics/bandwidth` | `LatencyBandwidthCorrelation` |
| `GET` | `/diagnostics/latency-24h` | `LatencyPoint[]` |
| `GET` | `/diagnostics/loss-slices` | `LossSlice[]` |
| `POST` | `/diagnostics/pdf-report` | `PdfReportRef` |

> [!TIP]
> Si el backend no tiene implementados los endpoints de diagnósticos, la app automáticamente hace **fallback a datos demo**, por lo que la UI sigue siendo explorable.

### Autenticación en requests

Todas las llamadas autenticadas envían el header `Authorization: Bearer <access_token>`. Si el access token expira (respuesta 401), el client automáticamente intenta un refresh con el refresh token y reintenta la request una vez.

---

## 📦 Build de producción y deploy

### Generar el build

```bash
pnpm build
```

Esto ejecuta:
1. `tsc -b` — Type-checking de TypeScript.
2. `vite build` — Bundling, tree-shaking y minificación.

El resultado queda en la carpeta **`dist/`**, listo para servir como archivos estáticos.

### Servir localmente (verificación)

```bash
pnpm preview
# → http://localhost:4173
```

### Deploy a un hosting estático

La carpeta `dist/` contiene una SPA estática que puede desplegarse en cualquier servicio de hosting:

#### Netlify

```bash
# Con Netlify CLI
netlify deploy --prod --dir=dist
```

O arrastrá la carpeta `dist/` al dashboard de Netlify.

> [!IMPORTANT]
> Como es una SPA con client-side routing, necesitás configurar **redirects** para que todas las rutas devuelvan `index.html`. Creá un archivo `dist/_redirects`:
> ```
> /*    /index.html   200
> ```

#### Vercel

```bash
vercel --prod
```

Vercel detecta Vite automáticamente. Configurá el output directory como `dist` si es necesario.

#### Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/a/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Con un `nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
docker build -t up-ping-web .
docker run -p 3000:80 up-ping-web
```

---

## ❓ Solución de problemas

### El comando `pnpm install` falla

- Verificá que tenés **Node.js 20+** y **pnpm 10+** instalados.
- Intentá borrar `node_modules` y el lockfile, y reinstalar:
  ```bash
  rm -rf node_modules pnpm-lock.yaml
  pnpm install
  ```

### La app no se conecta al backend

- Verificá que `VITE_API_URL` en `.env` apunta a la URL correcta del backend.
- Si el backend corre en otro puerto o dominio, puede haber problemas de **CORS**. Asegurate de que el backend permita requests desde el origen de la app.
- Podés usar la app en **modo demo** sin backend (botón en la pantalla de login).

### Error de tipo al compilar

```bash
pnpm typecheck
```
Esto ejecuta `tsc --noEmit` para mostrar errores de tipo sin generar archivos.

### Los estilos no se aplican

- Asegurate de que las dev dependencies están instaladas (Tailwind CSS v4 se usa como plugin de Vite).
- El `index.css` debe importar `@fontsource-variable/manrope` y `@fontsource-variable/jetbrains-mono` antes de `tailwindcss`.

### El tema no cambia / flash de tema incorrecto

- El tema se persiste en `localStorage` vía Zustand. Si hay un flash, el `ThemeProvider` debería bloquearlo esperando la rehidratación. Limpiá `localStorage` si hay datos corruptos:
  ```js
  localStorage.removeItem('theme-storage');
  ```

### Problemas con SPA routing en producción

- Asegurate de configurar tu servidor web para que **todas las rutas** devuelvan `index.html` (ver sección de deploy arriba).

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

