-- Daily rate sheets
CREATE TABLE public.rate_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('conventional', 'fha', 'va', 'zero_down')),
  low_rate NUMERIC(6,4) NOT NULL,
  low_rate_cost NUMERIC(6,4) NOT NULL,
  par_rate NUMERIC(6,4) NOT NULL,
  par_rate_cost NUMERIC(6,4) NOT NULL,
  low_cost_rate NUMERIC(6,4) NOT NULL,
  low_cost_cost NUMERIC(6,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, effective_date, loan_type)
);

ALTER TABLE public.rate_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rate sheets"
  ON public.rate_sheets FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER rate_sheets_updated_at
  BEFORE UPDATE ON public.rate_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
