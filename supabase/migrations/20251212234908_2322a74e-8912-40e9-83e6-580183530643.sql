-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Create a new permissive policy that allows anyone to insert
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);