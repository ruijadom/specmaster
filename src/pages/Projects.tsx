import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { useSubscription } from "@/features/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Loader2, PlayCircle, Trash2, Rocket, FileText, Crown } from "lucide-react";
import { ProjectsGridSkeleton } from "@/components/ProjectCardSkeleton";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MainHeader } from "@/components/MainHeader";
import { getAllAgentConfigs, PHASE_TO_AGENT_MAP } from "@/config/agents";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  completedPhases?: string[];
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { canCreateProject, tier, projectLimit, projectCount, agentsAllowed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProjects();
    
    // Check if we should open the new project modal
    if (searchParams.get('new') === 'true') {
      setIsNewProjectOpen(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [user, authLoading, navigate, searchParams, setSearchParams]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch completed phases for each project
      const projectsWithPhases = await Promise.all(
        (data || []).map(async (project) => {
          const { data: phases } = await supabase
            .from("project_phases")
            .select("phase_type")
            .eq("project_id", project.id)
            .eq("completed", true);
          
          return {
            ...project,
            completedPhases: phases?.map(p => p.phase_type) || [],
          };
        })
      );
      
      setProjects(projectsWithPhases);
    } catch (error: any) {
      toast.error("Error loading projects", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allPhases = getAllAgentConfigs();

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      
      // Delete project (cascade will delete related chat_messages and project_phases)
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete);

      if (error) throw error;

      toast.success("Project deleted successfully");
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
    } catch (error: any) {
      toast.error("Error deleting project", {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleCreateProject = async () => {
    if (authLoading) return;
    
    if (!user) {
      toast.error("You need to be logged in");
      navigate("/auth");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Please add a project name");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: projectName,
          description: projectDescription,
          status: "ideation",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast.success("Project created! Starting Mission Control...");
      setIsNewProjectOpen(false);
      setProjectName("");
      setProjectDescription("");
      navigate(`/mission-control/${project.id}`);
    } catch (error: any) {
      toast.error("Error creating project", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <MainHeader
        title="My Projects"
        description="Manage your projects from ideation to backlog"
        actions={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={() => setIsNewProjectOpen(true)} 
                    size="sm" 
                    className="h-9"
                    disabled={!canCreateProject()}
                  >
                    {!canCreateProject() && <Crown className="mr-2 h-4 w-4" />}
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </span>
              </TooltipTrigger>
              {!canCreateProject() && (
                <TooltipContent>
                  <p>Free plan allows only {projectLimit} project. Upgrade to Pro for unlimited projects.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        }
      />
      <div className="container mx-auto px-6 py-8">

        {isLoading || authLoading || subLoading ? (
          <ProjectsGridSkeleton />
        ) : projects.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground mb-4">
                You don't have any projects yet
              </p>
              <Button onClick={() => setIsNewProjectOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-soft hover:border-border/80 transition-all border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold leading-tight">{project.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(project.created_at).toLocaleDateString("en-US")}
                    </p>
                    <div className="flex items-center gap-1">
                      {allPhases
                        .filter((agentConfig) => agentsAllowed.includes(agentConfig.type))
                        .map((agentConfig) => {
                        // Check if this agent's phase is completed
                        const isCompleted = project.completedPhases?.some(
                          phaseType => PHASE_TO_AGENT_MAP[phaseType] === agentConfig.type
                        );
                        
                        return (
                          <div key={agentConfig.type} className="relative">
                            <Avatar 
                              className={`h-8 w-8 transition-all duration-500 ${
                                isCompleted ? 'animate-scale-in' : ''
                              }`}
                              style={{
                                backgroundColor: isCompleted ? agentConfig.color : 'hsl(var(--muted))',
                                opacity: isCompleted ? 1 : 0.4,
                              }}
                            >
                              <AvatarFallback 
                                className="text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: 'transparent',
                                }}
                              >
                                {agentConfig.initials}
                              </AvatarFallback>
                            </Avatar>
                            {isCompleted && (
                              <div 
                                className="absolute inset-0 rounded-full animate-pulse"
                                style={{
                                  background: `radial-gradient(circle, transparent 40%, ${agentConfig.color} 100%)`,
                                  opacity: 0.3,
                                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 3',
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/mission-control/${project.id}`);
                      }}
                      className="flex-1 h-8 text-sm"
                      size="sm"
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Resume
                    </Button>
                    {project.completedPhases && project.completedPhases.length > 0 && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project-documents/${project.id}`);
                        }}
                        variant="outline"
                        className="h-8 text-sm"
                        size="sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project and all associated conversations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Project"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Start New Project</DialogTitle>
                  <DialogDescription>
                    Create your project and start working with our specialized AI agents
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. School Management System"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description (optional)</Label>
                <Textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of what you want to build"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">What happens next?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Phase 1: Chat with Business Analyst to create the project brief</li>
                  <li>• Phase 2: Product Manager helps create the complete PRD</li>
                  <li>• Phase 3: Technical Architect designs the architecture</li>
                  <li>• Phase 4: Scrum Master generates user stories and backlog</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsNewProjectOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject} 
                disabled={isSubmitting || !projectName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Mission Control
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Projects;
