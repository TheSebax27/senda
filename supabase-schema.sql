-- ============================================================
-- SENDA — Supabase Schema completo
-- El camino que recorremos juntos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- PASO 1: Deshabilitar verificación de email en Supabase
-- -------------------------------------------------------
-- Ve a: Authentication > Providers > Email
-- Desactiva "Confirm email"
-- Guarda. Listo. No necesitas cambiar código.

-- -------------------------------------------------------
-- PROFILES table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT
);

-- Índice para búsqueda de username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- RLS profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para autenticados"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cada usuario edita su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Insertar perfil propio"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- PLACES table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.places (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('restaurante','ciudad','pueblo','hotel','experiencia')),
  city          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'Colombia',
  visit_date    DATE,

  rating_him    NUMERIC(3,1) DEFAULT 0 CHECK (rating_him >= 0 AND rating_him <= 5),
  rating_her    NUMERIC(3,1) DEFAULT 0 CHECK (rating_her >= 0 AND rating_her <= 5),
  -- Calculado en el frontend, guardado para eficiencia
  rating_avg    NUMERIC(3,1) DEFAULT 0,

  price_level   SMALLINT DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
  would_return  BOOLEAN,
  story         TEXT,
  comment_him   TEXT,
  comment_her   TEXT,

  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,

  photos        TEXT[] DEFAULT '{}',

  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  is_planned    BOOLEAN NOT NULL DEFAULT false,

  priority      TEXT CHECK (priority IN ('alta','media','baja')),
  budget        TEXT,
  planned_year  SMALLINT,

  tags          TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_places_type       ON public.places (type);
CREATE INDEX IF NOT EXISTS idx_places_is_planned ON public.places (is_planned);
CREATE INDEX IF NOT EXISTS idx_places_visit_date ON public.places (visit_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_places_rating_avg ON public.places (rating_avg DESC);

-- RLS places: todos los autenticados ven y editan los mismos lugares
-- (app privada de dos personas — no hay separación por usuario)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden ver lugares"
  ON public.places FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados pueden crear lugares"
  ON public.places FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Autenticados pueden editar lugares"
  ON public.places FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados pueden eliminar lugares"
  ON public.places FOR DELETE
  USING (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- STORAGE BUCKETS
-- -------------------------------------------------------
-- Ejecuta esto en el SQL Editor de Supabase:

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para avatars
CREATE POLICY "Avatars públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios suben su avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios actualizan su avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Políticas de storage para fotos de lugares
CREATE POLICY "Fotos de lugares públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'place-photos');

CREATE POLICY "Autenticados suben fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'place-photos' AND auth.role() = 'authenticated');

-- -------------------------------------------------------
-- TRIGGER: crear perfil automáticamente al registrar usuario
-- (backup por si falla el insert desde el frontend)
-- -------------------------------------------------------
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- INSTRUCCIONES FINALES
-- -------------------------------------------------------
-- 1. Ve a Authentication > Providers > Email
--    Desactiva "Confirm email" → Guardar
--
-- 2. Ejecuta este script completo en SQL Editor > Run
--
-- 3. Verifica en Table Editor que existen:
--    - public.profiles
--    - public.places
--
-- 4. Verifica en Storage que existen los buckets:
--    - avatars
--    - place-photos
--
-- 5. Registra los dos usuarios en la app
