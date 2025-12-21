-- Create user_rate_limits table for rate limiting API requests
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_id ON public.user_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_window_start ON public.user_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only read their own rate limit data
CREATE POLICY "Users can read own rate limits"
  ON public.user_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access"
  ON public.user_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
