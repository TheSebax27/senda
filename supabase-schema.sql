-- ============================================================
-- SENDA — Supabase Schema
-- El camino que recorremos juntos.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- PLACES table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.places (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Basic info
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('restaurante','ciudad','pueblo','hotel','experiencia')),
  city          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'Colombia',
  visit_date    DATE,

  -- Ratings
  rating_him    NUMERIC(3,1) DEFAULT 0 CHECK (rating_him >= 0 AND rating_him <= 5),
  rating_her    NUMERIC(3,1) DEFAULT 0 CHECK (rating_her >= 0 AND rating_her <= 5),
  rating_avg    NUMERIC(3,1) GENERATED ALWAYS AS (
                  CASE
                    WHEN rating_him > 0 AND rating_her > 0 THEN (rating_him + rating_her) / 2
                    WHEN rating_him > 0 THEN rating_him
                    WHEN rating_her > 0 THEN rating_her
                    ELSE 0
                  END
                ) STORED,

  -- Details
  price_level   SMALLINT DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
  would_return  BOOLEAN,
  story         TEXT,
  comment_him   TEXT,
  comment_her   TEXT,

  -- Location
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,

  -- Media
  photos        TEXT[] DEFAULT '{}',

  -- Flags
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  is_planned    BOOLEAN NOT NULL DEFAULT false,

  -- Planned-only fields
  priority      TEXT CHECK (priority IN ('alta','media','baja')),
  budget        TEXT,
  planned_year  SMALLINT,

  -- Tags
  tags          TEXT[] DEFAULT '{}'
);

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
CREATE INDEX idx_places_type       ON public.places (type);
CREATE INDEX idx_places_is_planned ON public.places (is_planned);
CREATE INDEX idx_places_visit_date ON public.places (visit_date DESC);
CREATE INDEX idx_places_rating_avg ON public.places (rating_avg DESC);

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------
-- For a private two-person app, the simplest approach is
-- to allow all operations for authenticated users only.
-- You can tighten this later with user-specific policies.

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone who is authenticated
CREATE POLICY "Allow read for authenticated users"
  ON public.places FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users
CREATE POLICY "Allow write for authenticated users"
  ON public.places FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- -------------------------------------------------------
-- Storage bucket for photos
-- -------------------------------------------------------
-- Run this in the Supabase dashboard > Storage > New bucket
-- or via the API:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('place-photos', 'place-photos', true);
--
-- Then add a policy to allow authenticated uploads:
--
--   CREATE POLICY "Auth users can upload"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'place-photos' AND auth.role() = 'authenticated');
--
--   CREATE POLICY "Public read"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'place-photos');

-- -------------------------------------------------------
-- Sample data (optional — delete before production)
-- -------------------------------------------------------
INSERT INTO public.places
  (name, type, city, country, visit_date, rating_him, rating_her, price_level, would_return, story, comment_him, comment_her, lat, lng, photos, is_favorite, is_planned, priority, budget, planned_year, tags)
VALUES
  ('La Trattoria',   'restaurante', 'Bogotá',        'Colombia', '2024-02-14', 4.7, 4.9, 2, true,
   'Primera cita. Llegamos sin reserva y nos dieron la mejor mesa. La pasta era perfecta y el vino nos hizo hablar hasta las 11 de la noche.',
   'El lugar donde todo empezó. Imposible olvidarlo.', 'Volvería mil veces. La pasta carbonara más rica que he probado.',
   4.6533, -74.0558, ARRAY['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
   true, false, NULL, NULL, NULL, ARRAY['primera cita','italiano','romántico']),

  ('Cartagena',      'ciudad',      'Cartagena',     'Colombia', '2025-04-12', 4.8, 5.0, 3, true,
   'Nuestro primer viaje largo juntos. Nos perdimos por el centro histórico, comimos en el mercado, vimos el atardecer desde las murallas.',
   'El mejor viaje que hemos hecho.', 'Quiero volver. Las murallas al atardecer son de otro mundo.',
   10.3910, -75.4794, ARRAY['https://images.unsplash.com/photo-1583682064285-79b3d7bcf5b5?w=800&q=80'],
   true, false, NULL, NULL, NULL, ARRAY['playa','historia','caribe']),

  ('Villa de Leyva', 'pueblo',      'Villa de Leyva','Colombia', '2025-08-16', 4.7, 4.9, 2, true,
   'Fuimos sin planearlo mucho y terminamos caminando por todo el pueblo. Las calles empedradas y la comida fueron perfectas.',
   'Me encanta caminar contigo por las calles. Es un lugar mágico.', 'La comida estuvo increíble y quiero volver.',
   5.6333, -73.5250, ARRAY['https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=800&q=80'],
   true, false, NULL, NULL, NULL, ARRAY['colonial','arquitectura','tranquilo']),

  ('Japón',          'ciudad',      'Tokio',         'Japón',    NULL,         0,   0,   4, NULL,
   NULL, NULL, NULL,
   35.6762, 139.6503, ARRAY['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80'],
   false, true, 'alta', '$$$', 2027, ARRAY['asia','cultura','gastronomía']);
