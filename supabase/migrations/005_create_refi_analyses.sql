-- Refinance analyses
CREATE TABLE public.refi_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_rate NUMERIC(6,4) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  current_monthly_payment NUMERIC(10,2) NOT NULL,
  current_loan_origination_date DATE,
  current_remaining_months INTEGER,
  original_loan_amount NUMERIC(12,2),
  original_loan_term_years INTEGER DEFAULT 30,
  new_rate NUMERIC(6,4) NOT NULL,
  new_loan_amount NUMERIC(12,2) NOT NULL,
  new_loan_term_years INTEGER DEFAULT 30,
  new_closing_costs NUMERIC(10,2) NOT NULL,
  cash_out_amount NUMERIC(12,2) DEFAULT 0,
  paying_costs_method TEXT DEFAULT 'out_of_pocket',
  results JSONB NOT NULL DEFAULT '{}',
  client_name TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.refi_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own refi analyses"
  ON public.refi_analyses FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER refi_analyses_updated_at
  BEFORE UPDATE ON public.refi_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
