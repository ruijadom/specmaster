-- Add SELECT policy for admins to view admin emails
CREATE POLICY "Only admins can view admin emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (is_admin());

-- Add policy for service role to manage admin emails
CREATE POLICY "Service role manages admin emails"
ON public.admin_emails
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);