-- Add 'ux-spec' to the project_phases phase_type constraint
ALTER TABLE public.project_phases
DROP CONSTRAINT IF EXISTS project_phases_phase_type_check;

ALTER TABLE public.project_phases
ADD CONSTRAINT project_phases_phase_type_check 
CHECK ((phase_type = ANY (ARRAY['project-brief'::text, 'prd'::text, 'ux-spec'::text, 'architecture'::text, 'backlog'::text])));

