# Base de datos — Senda

**Motor:** PostgreSQL vía Supabase  
**Schema principal:** `public`  
**Auth schema:** `auth` (gestionado por Supabase)  
**Storage:** Supabase Storage (no PostgreSQL)  
**Schema completo:** `supabase-schema.sql` en la raíz del proyecto

---

## Tablas

### `public.profiles`

Perfil de usuario. Extensión de `auth.users`.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | Mismo UUID que el usuario de Supabase Auth |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `username` | TEXT | NOT NULL, UNIQUE | Nombre de usuario (lowercase, trimmed) |
| `display_name` | TEXT | NOT NULL | Nombre para mostrar |
| `avatar_url` | TEXT | NULL | URL pública del avatar en Storage |

**Índices:**
- `idx_profiles_username` — UNIQUE INDEX en `username`

**RLS activo.** Políticas:
- SELECT: cualquier usuario autenticado puede ver todos los perfiles.
- INSERT: solo el propio usuario puede insertar su perfil (`auth.uid() = id`).
- UPDATE: solo el propio usuario puede editar su perfil.

**Trigger:** `on_auth_user_created` — crea automáticamente un perfil al registrarse un usuario en `auth.users`, leyendo `username` y `display_name` de `raw_user_meta_data`. Usa `ON CONFLICT (id) DO NOTHING` para no fallar si el frontend ya lo insertó.

---

### `public.places`

Tabla central. Almacena tanto lugares visitados (`is_planned=false`) como planeados (`is_planned=true`).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `name` | TEXT | NOT NULL | Nombre del lugar |
| `type` | TEXT | NOT NULL, CHECK IN ('restaurante','ciudad','pueblo','hotel','experiencia') | Tipo de lugar |
| `city` | TEXT | NOT NULL | Ciudad |
| `country` | TEXT | NOT NULL, DEFAULT 'Colombia' | País |
| `visit_date` | DATE | NULL | Fecha de visita (null si es planeado) |
| `rating_him` | NUMERIC(3,1) | DEFAULT 0, CHECK 0–5 | Rating legacy (no se usa en UI nueva) |
| `rating_her` | NUMERIC(3,1) | DEFAULT 0, CHECK 0–5 | Rating legacy (no se usa en UI nueva) |
| `rating_avg` | NUMERIC(3,1) | DEFAULT 0 | Promedio calculado desde tabla `ratings` |
| `price_level` | SMALLINT | DEFAULT 2, CHECK 1–4 | Nivel de precio ($ a $$$$) |
| `would_return` | BOOLEAN | NULL | ¿Volverían? (null = tal vez) |
| `story` | TEXT | NULL | Historia del lugar |
| `comment_him` | TEXT | NULL | Comentario legacy (no se usa en UI nueva) |
| `comment_her` | TEXT | NULL | Comentario legacy (no se usa en UI nueva) |
| `lat` | DOUBLE PRECISION | NULL | Latitud para el mapa |
| `lng` | DOUBLE PRECISION | NULL | Longitud para el mapa |
| `photos` | TEXT[] | DEFAULT '{}' | Array de URLs públicas de fotos |
| `is_favorite` | BOOLEAN | NOT NULL, DEFAULT false | ¿Es favorito? |
| `is_planned` | BOOLEAN | NOT NULL, DEFAULT false | false=visitado, true=planeado |
| `priority` | TEXT | NULL, CHECK IN ('alta','media','baja') | Solo para planeados |
| `budget` | TEXT | NULL | Presupuesto estimado (texto libre) |
| `planned_year` | SMALLINT | NULL | Año objetivo para la visita |
| `tags` | TEXT[] | DEFAULT '{}' | Etiquetas libres |
| `created_by` | UUID | NULL, FK → `auth.users(id)` | Usuario que creó el registro |

**Índices:**
- `idx_places_type` — para filtros por tipo
- `idx_places_is_planned` — para separar memoria vs. bucket list
- `idx_places_visit_date` — ordenar por fecha DESC
- `idx_places_rating_avg` — para destacados por rating

**RLS activo.** Políticas:
- SELECT, INSERT, UPDATE, DELETE: cualquier usuario autenticado puede hacer cualquier cosa.
- Razón: app privada de dos personas, no hay separación de datos por usuario.

**Nota sobre columnas legacy:** `rating_him`, `rating_her`, `comment_him`, `comment_her` existen en la DB pero no se usan en la UI. La app migró a un sistema de ratings por usuario (`ratings` table). No eliminar estas columnas sin migration.

---

### `public.ratings`

Calificaciones individuales por usuario por lugar.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `place_id` | UUID | NOT NULL, FK → `places(id)` ON DELETE CASCADE | |
| `user_id` | UUID | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | |
| `rating` | NUMERIC(3,1) | NOT NULL, CHECK 1–5 | Estrellas (1 a 5) |
| `comment` | TEXT | NULL | Comentario opcional |
| UNIQUE | (place_id, user_id) | | Un usuario, una calificación por lugar |

**Índices:**
- `idx_ratings_place` — para consultar todas las ratings de un lugar
- `idx_ratings_user` — para consultar todas las ratings de un usuario

**RLS activo.** Políticas:
- SELECT: cualquier autenticado ve todas las ratings.
- INSERT: solo el propio usuario inserta su rating (`auth.uid() = user_id`).
- UPDATE: solo el propio usuario actualiza su rating.
- DELETE: solo el propio usuario elimina su rating.

---

## Relaciones

```
auth.users (1) ──< profiles (1)   [1:1 via id FK]
auth.users (1) ──< ratings (N)    [1:N via user_id FK]
auth.users (1) ──< places (N)     [1:N via created_by FK, nullable]
places     (1) ──< ratings (N)    [1:N via place_id FK, CASCADE DELETE]
```

---

## Storage (Supabase Storage)

No es PostgreSQL, pero es parte del sistema de datos.

### Bucket `avatars`
- Público (acceso de lectura sin autenticación).
- Path de upload: `{user_id}/avatar.{ext}` (upsert, sobreescribe el anterior).
- Políticas: autenticados pueden subir/actualizar; todos pueden leer.

### Bucket `place-photos`
- Público.
- Path de upload: `{place_id}/{timestamp}.{ext}`.
- Máximo 6 fotos por lugar (limitado en frontend, no en storage).
- Máximo 10 MB por foto (limitado en frontend).
- Políticas: autenticados pueden subir; todos pueden leer.

---

## Trigger

### `on_auth_user_created`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Se ejecuta AFTER INSERT en `auth.users`. Es un respaldo: el frontend también inserta el perfil explícitamente en `signUp`. El `ON CONFLICT DO NOTHING` previene duplicados.

---

## Extensiones

- `uuid-ossp` — para `uuid_generate_v4()` en los PKs.

---

## Convenciones de nombres

- Tablas: `snake_case` plural (`profiles`, `places`, `ratings`).
- Columnas: `snake_case` (`visit_date`, `is_planned`, `rating_avg`).
- Índices: `idx_{tabla}_{columna}` (`idx_places_type`).
- Políticas RLS: texto descriptivo en español (`"Autenticados pueden ver lugares"`).
- FKs: siempre con `ON DELETE CASCADE` cuando el hijo no tiene sentido sin el padre.

---

## Flujo de datos en operaciones clave

### Registrar usuario
1. `supabase.auth.signUp(email, password, { data: { username, display_name } })`
2. Frontend: `supabase.from('profiles').insert({ id, username, display_name })`
3. Trigger SQL: también intenta insertar (con ON CONFLICT DO NOTHING como respaldo)

### Agregar lugar con fotos y rating
1. `INSERT INTO places` → retorna el nuevo `id`
2. Upload fotos a storage → obtiene URLs públicas
3. `UPDATE places SET photos = [urls]`
4. `UPSERT INTO ratings` → si ya existe rating del usuario, lo actualiza
5. `SELECT rating FROM ratings WHERE place_id = X` → calcula avg en JS
6. `UPDATE places SET rating_avg = avg`

### Convertir planeado a memoria
1. `UPDATE places SET is_planned = false, visit_date = today WHERE id = X`

---

## Reproducir la base de datos

Ejecutar `supabase-schema.sql` completo en Supabase SQL Editor. El script es idempotente (`CREATE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

Pasos adicionales manuales en el dashboard de Supabase:
1. Authentication > Providers > Email → desactivar "Confirm email".
2. Verificar que los buckets `avatars` y `place-photos` se crearon en Storage.
