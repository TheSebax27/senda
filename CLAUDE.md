# CLAUDE.md — Senda

> Fuente de verdad para sesiones de desarrollo. Leer este archivo es suficiente para entender el proyecto completo.

---

## Descripción del proyecto

**Senda** es una app web privada para dos personas (pareja) que registran y recuerdan los lugares que visitan juntos. El nombre refleja el concepto: "el camino que recorremos juntos."

- App privada: solo los dos usuarios registrados la usan.
- No es pública ni multi-tenant.
- Diseño romántico/editorial: paleta marfil, bosque, beige y terracota; tipografía serif + sans.

**URL de producción:** Desplegada en Vercel (configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel env vars).

---

## Objetivo del sistema

Permitir a dos personas:
1. Registrar lugares visitados juntos (restaurantes, ciudades, hoteles, etc.).
2. Calificar cada lugar individualmente (1–5 estrellas + comentario).
3. Guardar fotos, historias y coordenadas de cada lugar.
4. Planificar próximos destinos con prioridad y presupuesto.
5. Visualizar su historia en una línea de tiempo.
6. Ver todos los lugares en un mapa interactivo.
7. Marcar favoritos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Routing | React Router DOM v7 |
| Estado global | React Context API (`AuthContext`, `PlacesContext`) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Mapa | Leaflet + react-leaflet |
| Iconos | lucide-react |
| Tipografía | Google Fonts: Playfair Display (serif) + Inter (sans) |
| Linting | oxlint |
| Compiler | babel-plugin-react-compiler |
| Deploy | Vercel |

**No hay backend propio.** Todo va directo a Supabase desde el frontend.

---

## Arquitectura

```
senda/
├── src/
│   ├── App.tsx              # Router raíz + providers + AppShell
│   ├── main.tsx             # Entry point
│   ├── index.css            # Variables CSS globales, reset, tipografía
│   ├── App.css              # Layout app-shell
│   ├── types/
│   │   └── index.ts         # Tipos globales: Place, Rating, PlaceType, Priority
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase + flag SUPABASE_CONFIGURED
│   │   └── utils.ts         # Helpers: typeLabel, priceLabel, formatDate, etc.
│   ├── context/
│   │   ├── AuthContext.tsx  # Auth state + signIn/signUp/signOut/updateProfile/uploadAvatar
│   │   └── PlacesContext.tsx# Places CRUD + ratings + convertToMemory
│   ├── components/
│   │   ├── Navbar.tsx/.css  # Barra top desktop + dropdown perfil
│   │   ├── MobileNav.tsx/.css # Barra bottom mobile
│   │   ├── PlaceCard.tsx/.css # Tarjeta de lugar reutilizable
│   │   └── ProtectedRoute.tsx # Guard: redirige a /login si no autenticado
│   └── pages/
│       ├── Login.tsx + Auth.css
│       ├── Register.tsx
│       ├── Home.tsx/.css       # Dashboard: stats, mapa teaser, huellas recientes, highlights
│       ├── Lugares.tsx/.css    # Grid con filtros por tipo + búsqueda
│       ├── PlaceDetail.tsx/.css# Detalle completo + ratings de ambos usuarios
│       ├── AgregarLugar.tsx/.css # Formulario para agregar lugar visitado o planeado
│       ├── Mapa.tsx/.css       # Leaflet map con todos los lugares
│       ├── Favoritos.tsx/.css  # Lista de lugares marcados como favoritos
│       ├── Historia.tsx/.css   # Timeline cronológico de lugares visitados
│       ├── Proximos.tsx/.css   # Bucket list: destinos planeados por prioridad
│       └── Perfil.tsx          # Perfil del usuario: avatar, nombre, username
├── supabase-schema.sql    # Schema SQL completo para reproducir la DB
├── package.json
├── vite.config.ts
├── vercel.json
└── .env                   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (nunca commitear)
```

---

## Flujo de autenticación

1. `AuthProvider` carga al inicio: llama `supabase.auth.getSession()`.
2. Si hay sesión: carga el perfil de la tabla `profiles`.
3. `supabase.auth.onAuthStateChange` mantiene el estado reactivo.
4. `ProtectedRoute` envuelve todas las rutas excepto `/login` y `/registro`.
5. Sin sesión → redirige a `/login`.
6. Al registrarse: `auth.signUp` + insert en `profiles` + trigger SQL como respaldo.
7. `SUPABASE_CONFIGURED` es un flag que evita llamadas a placeholder cuando las env vars no están.

---

## Rutas

| Ruta | Componente | Protegida |
|------|-----------|-----------|
| `/login` | Login | No |
| `/registro` | Register | No |
| `/` | Home | Sí |
| `/lugares` | Lugares | Sí |
| `/lugares/:id` | PlaceDetail | Sí |
| `/agregar` | AgregarLugar | Sí |
| `/mapa` | Mapa | Sí |
| `/favoritos` | Favoritos | Sí |
| `/historia` | Historia | Sí |
| `/proximos` | Proximos | Sí |
| `/perfil` | Perfil | Sí |
| `*` | Navigate → `/` | Sí |

---

## Contextos globales

### AuthContext (`src/context/AuthContext.tsx`)

Provee: `user`, `profile`, `session`, `loading`, `configured`, `signUp`, `signIn`, `signOut`, `updateProfile`, `uploadAvatar`.

- `profile` es la fila de la tabla `profiles`, no el objeto Supabase `user`.
- `uploadAvatar` sube a bucket `avatars` y actualiza `profile.avatar_url`.

### PlacesContext (`src/context/PlacesContext.tsx`)

Provee: `places`, `loading`, `addPlace`, `updatePlace`, `deletePlace`, `convertToMemory`, `refresh`, `getRatings`, `upsertRating`, `deleteRating`.

- `places` incluye tanto visitados (`is_planned=false`) como planeados (`is_planned=true`).
- `convertToMemory`: convierte un lugar planeado en memoria (sets `is_planned=false`, `visit_date=today`).
- `recalcPlaceAvg`: recalcula `rating_avg` en `places` tras cada upsert/delete de rating.
- Ratings usan upsert con conflict `(place_id, user_id)` — un usuario, una calificación por lugar.

---

## Convenciones de código

### TypeScript
- Tipos globales solo en `src/types/index.ts`.
- Exportaciones nombradas (no default exports en componentes, sí en `App.tsx` y `main.tsx`).
- `PlaceInsert = Omit<Place, 'id' | 'created_at' | 'rating_avg'>` para insertar.
- Errores en funciones async: `Promise<{ error: string | null }>` pattern.

### React
- Componentes: PascalCase.
- Hooks: `use` prefix, colocados en `context/` si son globales.
- Cada página tiene su propio `.css` con el mismo nombre.
- No se usa ningún framework CSS (no Tailwind, no MUI). Todo es CSS custom con variables.
- `usePlaces()` y `useAuth()` lanzan error si se usan fuera del Provider.

### CSS
- Variables globales en `:root` de `index.css`.
- Clases en kebab-case: `.place-card`, `.hero-overlay`, `.stat-number`.
- No se mezclan estilos inline salvo imágenes de fondo dinámicas (`backgroundImage`).
- Diseño mobile-first con `@media (min-width: 768px)` para desktop.
- Nunca usar IDs para estilos, solo clases.

### Supabase / SQL
- Cliente en `src/lib/supabase.ts`. Solo un cliente en todo el proyecto.
- Queries directas desde contextos (no hay capa de servicio separada).
- No hay Stored Procedures propios. El único trigger es `handle_new_user`.

---

## Paleta de colores

Definida en `src/index.css`:

| Variable CSS | Valor | Uso |
|---|---|---|
| `--ivory` | `#FAF8F4` | Fondo principal |
| `--forest` | `#2A4430` | Primario (verde bosque) |
| `--forest-dark` | `#1C3020` | Hover/active del primario |
| `--forest-light` | `#EBF0EC` | Fondos sutiles verdes |
| `--olive` | `#5C7A3E` | Acento secundario |
| `--beige` | `#E8E0D0` | Bordes, fondos card |
| `--terracotta` | `#C0714F` | Destacados, CTAs warm |
| `--text` | `#1E1E1A` | Texto principal |
| `--text-muted` | `#7A7570` | Texto secundario |
| `--border` | `#E2DDD6` | Bordes |
| `--bg-subtle` | `#F4F1EB` | Fondos de sección |

Tipografía:
- `--font-serif`: Playfair Display → títulos, eyebrows, elementos románticos
- `--font-sans`: Inter → cuerpo de texto, etiquetas, UI

---

## Reglas que nunca deben romperse

1. **No hay backend propio.** Todo va a Supabase directamente.
2. **No instalar Tailwind ni ningún framework CSS.** El diseño es 100% CSS custom.
3. **No commitear `.env`.** Las claves van en Vercel env vars.
4. **Un solo cliente Supabase** en `src/lib/supabase.ts`. Nunca crear otro.
5. **No alterar tablas existentes en Supabase** sin actualizar `supabase-schema.sql`.
6. **`SUPABASE_CONFIGURED` siempre chequeado** antes de llamadas que fallarían con placeholder.
7. **Ratings: siempre upsert** con conflict `(place_id, user_id)`. Un usuario, una calificación.
8. **`is_planned` distingue memoria vs. plan.** No confundir: `false` = visitado, `true` = planeado.
9. **La paleta de colores no cambia.** Solo usar variables CSS definidas en `:root`.
10. **No agregar navegación sin actualizar `Navbar.tsx` y `MobileNav.tsx`.**

---

## Cómo ejecutar el proyecto

### Requisitos
- Node.js 20+
- Cuenta Supabase con el schema ejecutado (`supabase-schema.sql`)

### Variables de entorno
Crear `C:\SebastianProyectos\senda\.env`:
```
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Desarrollo
```bash
cd C:\SebastianProyectos\senda
npm install
npm run dev
```
Corre en `http://localhost:5173`.

### Compilar para producción
```bash
npm run build
```
Genera `dist/`. Verificar con:
```bash
npm run preview
```

### Publicar en Vercel
1. Push a la rama main de GitHub.
2. Vercel detecta el push y despliega automáticamente.
3. Asegurarse de que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas en Vercel > Project > Settings > Environment Variables.
4. Si se cambian las env vars, hacer Redeploy manual desde el dashboard de Vercel.

### Lint
```bash
npm run lint
```

---

## Cómo agregar una nueva página

1. Crear `src/pages/NuevaPagina.tsx` y `src/pages/NuevaPagina.css`.
2. Exportar el componente con nombre: `export function NuevaPagina() {...}`.
3. Importar en `src/App.tsx` y agregar una `<Route>` dentro del `AppShell`.
4. Agregar el item de navegación en `Navbar.tsx` (array `navItems`) y `MobileNav.tsx`.
5. Si necesita datos de places: `const { places } = usePlaces()`.
6. Si necesita auth: `const { user, profile } = useAuth()`.

## Cómo agregar un nuevo campo a un lugar

1. Agregar la columna en Supabase SQL Editor: `ALTER TABLE public.places ADD COLUMN IF NOT EXISTS campo TEXT;`.
2. Actualizar `supabase-schema.sql` con la nueva columna.
3. Actualizar la interfaz `Place` en `src/types/index.ts`.
4. Actualizar `PlaceInsert` si el campo es insertable.
5. Actualizar el formulario `AgregarLugar.tsx` si el usuario lo rellena.
6. Actualizar `PlaceDetail.tsx` si el campo se muestra en el detalle.

---

## Estado del proyecto (sep 2026)

### Módulos completados ✅
- Autenticación completa (registro, login, logout, perfil, avatar)
- CRUD de lugares (agregar, editar, eliminar)
- Sistema de calificaciones por usuario (1–5 estrellas + comentario)
- Página Home con stats, mapa teaser, huellas recientes y highlights
- Catálogo de lugares con filtros y búsqueda
- Detalle de lugar con galería de fotos y ratings
- Mapa interactivo (Leaflet) con todos los lugares georeferenciados
- Favoritos
- Historia (timeline cronológico)
- Próximos destinos (bucket list con prioridad)
- Perfil de usuario con edición y upload de avatar
- Diseño responsive mobile + desktop
- Deploy en Vercel

### Pendientes / mejoras identificadas
- Edición de un lugar ya guardado (actualmente solo se puede eliminar).
- Upload de fotos desde PlaceDetail (agregar fotos a un lugar existente).
- Filtro de años en Historia.
- Modo planificado en AgregarLugar (`is_planned=true`) — el form actual solo crea memorias.
- Notificaciones push para cuando el otro usuario agrega un lugar.
- Modo offline / PWA.
