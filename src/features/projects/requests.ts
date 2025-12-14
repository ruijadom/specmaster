import { supabase } from "@/integrations/supabase/client";
import type { Project, ProjectPhase, CreateProjectInput, ProjectWithPhases } from "./types";

export const projectRequests = {
  fetchProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  fetchProjectsWithPhases: async (): Promise<ProjectWithPhases[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const projectsWithPhases = await Promise.all(
      (data || []).map(async (project) => {
        const { data: phases } = await supabase
          .from("project_phases")
          .select("phase_type")
          .eq("project_id", project.id)
          .eq("completed", true);

        return {
          ...project,
          completedPhases: phases?.map((p) => p.phase_type) || [],
        };
      })
    );

    return projectsWithPhases;
  },

  fetchProject: async (projectId: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    return data;
  },

  createProject: async (userId: string, input: CreateProjectInput): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description || null,
        status: "ideation",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
  },

  fetchProjectPhases: async (projectId: string): Promise<ProjectPhase[]> => {
    const { data, error } = await supabase
      .from("project_phases")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at");

    if (error) throw error;
    return data || [];
  },

  fetchCompletedPhases: async (projectId: string): Promise<ProjectPhase[]> => {
    const { data, error } = await supabase
      .from("project_phases")
      .select("*")
      .eq("project_id", projectId)
      .eq("completed", true);

    if (error) throw error;
    return data || [];
  },

  savePhase: async (
    projectId: string,
    phaseType: string,
    content: any,
    completed: boolean = true
  ): Promise<ProjectPhase> => {
    const { data, error } = await supabase
      .from("project_phases")
      .upsert(
        {
          project_id: projectId,
          phase_type: phaseType,
          content,
          completed,
        },
        { onConflict: "project_id,phase_type" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
