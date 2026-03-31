-- Shared quotes: public links for Quick Quote collaboration
CREATE TABLE public.shared_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  quote_input JSONB NOT NULL,
  branding JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_quotes ENABLE ROW LEVEL SECURITY;

-- Creator manages their own shares
CREATE POLICY "Users manage own shared quotes"
  ON public.shared_quotes FOR ALL
  USING (auth.uid() = user_id);

-- Anyone (including unauthenticated/anon) can read active shares
CREATE POLICY "Public can read active shared quotes"
  ON public.shared_quotes FOR SELECT
  USING (is_active = TRUE);

CREATE INDEX idx_shared_quotes_token ON public.shared_quotes(token);
