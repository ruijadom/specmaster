-- Update waitlist policy to allow anyone to insert via role "public"
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
TO public
WITH CHECK (true);