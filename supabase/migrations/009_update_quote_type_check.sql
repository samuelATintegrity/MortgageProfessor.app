-- Expand quote_type CHECK constraint to include 'quick' and 'itemized'
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_quote_type_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_quote_type_check
  CHECK (quote_type IN ('purchase', 'refinance', 'cash_out_refi', 'rate_term_refi', 'quick', 'itemized'));
