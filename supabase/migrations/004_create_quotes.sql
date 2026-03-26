-- Saved quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_type TEXT NOT NULL CHECK (quote_type IN ('purchase', 'refinance', 'cash_out_refi', 'rate_term_refi')),
  transaction_type TEXT NOT NULL,
  fico_score INTEGER,
  loan_type TEXT NOT NULL,
  borrower_or_lender_paid TEXT DEFAULT 'borrower',
  borrower_paid_comp_pct NUMERIC(6,4),
  base_loan_amount NUMERIC(12,2) NOT NULL,
  property_value NUMERIC(12,2) NOT NULL,
  loan_term_years INTEGER DEFAULT 30,
  state TEXT NOT NULL DEFAULT 'UT',
  lock_period_days INTEGER DEFAULT 30,
  hazard_insurance_monthly NUMERIC(10,2),
  mortgage_insurance_monthly NUMERIC(10,2),
  property_tax_monthly NUMERIC(10,2),
  prepaid_interest_days INTEGER,
  current_balance NUMERIC(12,2),
  seller_credit NUMERIC(10,2) DEFAULT 0,
  buydown_amount NUMERIC(10,2) DEFAULT 0,
  va_funding_fee NUMERIC(10,2) DEFAULT 0,
  down_payment_pct NUMERIC(5,2),
  results JSONB NOT NULL DEFAULT '{}',
  name TEXT,
  client_name TEXT,
  client_email TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quotes"
  ON public.quotes FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for listing quotes
CREATE INDEX idx_quotes_user_created ON public.quotes(user_id, created_at DESC);
