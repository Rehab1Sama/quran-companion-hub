
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('leader', 'data_entry', 'teacher', 'supervisor', 'track_manager', 'student');

-- Create enum for track types
CREATE TYPE public.track_type AS ENUM ('girls', 'children', 'mothers', 'tilawa');

-- Create enum for memorization direction
CREATE TYPE public.hifz_direction AS ENUM ('from_baqarah', 'from_nas', 'both');

-- Tracks table
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type public.track_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Halaqat table
CREATE TABLE public.halaqat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, track_id)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age TEXT,
  phone TEXT,
  whatsapp TEXT,
  country TEXT,
  education_level TEXT,
  hifz_direction public.hifz_direction,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Track managers
CREATE TABLE public.track_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  UNIQUE(user_id, track_id)
);

-- Data entry assignments
CREATE TABLE public.data_entry_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  UNIQUE(user_id, track_id)
);

-- Halaqah members (students, teachers, supervisors)
CREATE TABLE public.halaqah_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  halaqah_id UUID NOT NULL REFERENCES public.halaqat(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, halaqah_id, role)
);

-- Quran pages lookup table
CREATE TABLE public.quran_pages (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER NOT NULL,
  surah_name TEXT NOT NULL,
  ayah_number INTEGER NOT NULL,
  page_number NUMERIC(6,2) NOT NULL
);

CREATE INDEX idx_quran_pages_surah_ayah ON public.quran_pages(surah_number, ayah_number);

-- Daily records
CREATE TABLE public.daily_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  halaqah_id UUID NOT NULL REFERENCES public.halaqat(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Hifz
  hifz_from_surah INTEGER,
  hifz_from_ayah INTEGER,
  hifz_to_surah INTEGER,
  hifz_to_ayah INTEGER,
  hifz_pages NUMERIC(6,2) DEFAULT 0,
  -- Near review
  near_review_from_surah INTEGER,
  near_review_from_ayah INTEGER,
  near_review_to_surah INTEGER,
  near_review_to_ayah INTEGER,
  near_review_pages NUMERIC(6,2) DEFAULT 0,
  -- Far review
  far_review_from_surah INTEGER,
  far_review_from_ayah INTEGER,
  far_review_to_surah INTEGER,
  far_review_to_ayah INTEGER,
  far_review_pages NUMERIC(6,2) DEFAULT 0,
  -- Tilawa
  tilawa_from_surah INTEGER,
  tilawa_from_ayah INTEGER,
  tilawa_to_surah INTEGER,
  tilawa_to_ayah INTEGER,
  tilawa_pages NUMERIC(6,2) DEFAULT 0,
  -- Absence
  is_absent BOOLEAN NOT NULL DEFAULT false,
  -- Metadata
  entered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, record_date)
);

CREATE INDEX idx_daily_records_date ON public.daily_records(record_date);
CREATE INDEX idx_daily_records_halaqah_date ON public.daily_records(halaqah_id, record_date);

-- Registration settings
CREATE TABLE public.registration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_open BOOLEAN NOT NULL DEFAULT false,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SECURITY ============

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger function for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_records_updated_at
  BEFORE UPDATE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS ============

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_entry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_settings ENABLE ROW LEVEL SECURITY;

-- Tracks: everyone reads
CREATE POLICY "Anyone can read tracks" ON public.tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leader manages tracks" ON public.tracks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));

-- Halaqat: everyone reads
CREATE POLICY "Anyone can read halaqat" ON public.halaqat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leader manages halaqat" ON public.halaqat FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));

-- Profiles: own profile or leader sees all
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leader reads all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leader updates all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: leader manages
CREATE POLICY "Leader manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Track managers
CREATE POLICY "Leader manages track_managers" ON public.track_managers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "Track managers read own" ON public.track_managers FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Data entry assignments
CREATE POLICY "Leader manages data_entry_assignments" ON public.data_entry_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "Data entry reads own" ON public.data_entry_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Halaqah members
CREATE POLICY "Anyone can read members" ON public.halaqah_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leader manages members" ON public.halaqah_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));

-- Quran pages: everyone reads
CREATE POLICY "Anyone can read quran_pages" ON public.quran_pages FOR SELECT TO authenticated USING (true);

-- Daily records
CREATE POLICY "Data entry inserts records" ON public.daily_records FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'leader')
);
CREATE POLICY "Data entry updates records" ON public.daily_records FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'data_entry') OR public.has_role(auth.uid(), 'leader')
);
CREATE POLICY "Leader reads all records" ON public.daily_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'leader'));
CREATE POLICY "Teachers read halaqah records" ON public.daily_records FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'teacher') AND halaqah_id IN (
    SELECT hm.halaqah_id FROM public.halaqah_members hm WHERE hm.user_id = auth.uid()
  )
);
CREATE POLICY "Students read own records" ON public.daily_records FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Data entry reads assigned records" ON public.daily_records FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'data_entry') AND halaqah_id IN (
    SELECT h.id FROM public.halaqat h
    JOIN public.data_entry_assignments dea ON dea.track_id = h.track_id
    WHERE dea.user_id = auth.uid()
  )
);

-- Registration settings
CREATE POLICY "Anyone reads registration_settings" ON public.registration_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leader manages registration_settings" ON public.registration_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'leader'));

-- Allow anon to read registration settings (for public registration page)
CREATE POLICY "Anon reads registration_settings" ON public.registration_settings FOR SELECT TO anon USING (true);
-- Allow anon to read tracks and halaqat for registration
CREATE POLICY "Anon reads tracks" ON public.tracks FOR SELECT TO anon USING (true);
CREATE POLICY "Anon reads halaqat" ON public.halaqat FOR SELECT TO anon USING (true);
