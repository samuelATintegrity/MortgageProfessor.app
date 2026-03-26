-- Title fee schedules (reference data, seeded by admin)
CREATE TABLE public.title_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('buyer', 'seller', 'refinance')),
  loan_amount_min NUMERIC(12,2) NOT NULL,
  loan_amount_max NUMERIC(12,2) NOT NULL,
  title_fee NUMERIC(10,2) NOT NULL,
  escrow_fee NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS - read-only reference data accessible to all authenticated users
ALTER TABLE public.title_fee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read title fees"
  ON public.title_fee_schedules FOR SELECT
  USING (auth.role() = 'authenticated');
