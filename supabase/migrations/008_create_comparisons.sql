-- Comparisons table for saving competitor quote comparisons
CREATE TABLE public.comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  competitor_lender TEXT,
  competitor_file_name TEXT,
  company_name TEXT,
  rows JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own comparisons"
  ON public.comparisons FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER comparisons_updated_at
  BEFORE UPDATE ON public.comparisons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_comparisons_user_created ON public.comparisons(user_id, created_at DESC);
