-- Function to reset rate limits for a user (useful for testing or support)
CREATE OR REPLACE FUNCTION public.reset_user_rate_limit(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_rate_limits WHERE user_id = p_user_id;
END;
$$;

-- Function to get current rate limit status for a user
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(p_user_id UUID)
RETURNS TABLE (
  request_count INTEGER,
  window_start TIMESTAMPTZ,
  seconds_until_reset INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    url.request_count,
    url.window_start,
    GREATEST(0, 60 - EXTRACT(EPOCH FROM (NOW() - url.window_start))::INTEGER) as seconds_until_reset
  FROM public.user_rate_limits url
  WHERE url.user_id = p_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_rate_limit(UUID) TO service_role;

-- Add a comment
COMMENT ON FUNCTION public.reset_user_rate_limit IS 'Resets rate limit for a specific user. Service role only.';
COMMENT ON FUNCTION public.get_rate_limit_status IS 'Returns current rate limit status for a user.';
