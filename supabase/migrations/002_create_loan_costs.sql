-- Loan costs - per-user configurable fees
CREATE TABLE public.loan_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appraisal_fee NUMERIC(10,2) DEFAULT 620,
  processing_fee NUMERIC(10,2) DEFAULT 700,
  underwriting_fee NUMERIC(10,2) DEFAULT 1150,
  voe_credit_fee NUMERIC(10,2) DEFAULT 200,
  tax_fee NUMERIC(10,2) DEFAULT 80,
  mers_fee NUMERIC(10,2) DEFAULT 30,
  borrower_paid_comp NUMERIC(6,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.loan_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own loan costs"
  ON public.loan_costs FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER loan_costs_updated_at
  BEFORE UPDATE ON public.loan_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
