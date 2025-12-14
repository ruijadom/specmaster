export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ProjectWithPhases extends Project {
  completedPhases: string[];
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_type: string;
  content: any;
  completed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}
