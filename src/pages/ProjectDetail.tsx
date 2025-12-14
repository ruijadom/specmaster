import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Lightbulb, Calendar, ListChecks } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Phase {
  id: string;
  phase_type: string;
  content: any;
  completed: boolean;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProject();
  }, [user, authLoading, id, navigate]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: phasesData, error: phasesError } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", id)
        .order("created_at");

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);
    } catch (error: any) {
      toast.error("Error loading project", {
        description: error.message,
      });
      navigate("/projects");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ideation: "bg-blue-500",
      planning: "bg-yellow-500",
      backlog: "bg-purple-500",
      active: "bg-green-500",
      completed: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ideation: "Ideation",
      planning: "Planning",
      backlog: "Backlog",
      active: "Active",
      completed: "Completed",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPhaseIcon = (phaseType: string) => {
    const icons = {
      ideation: <Lightbulb className="h-5 w-5" />,
      planning: <Calendar className="h-5 w-5" />,
      backlog: <ListChecks className="h-5 w-5" />,
    };
    return icons[phaseType as keyof typeof icons];
  };

  const getPhaseLabel = (phaseType: string) => {
    const labels = {
      ideation: "Ideation",
      planning: "Planning",
      backlog: "Backlog",
    };
    return labels[phaseType as keyof typeof labels] || phaseType;
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/projects")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(project.created_at).toLocaleDateString("en-US")}
          </p>
        </div>

        <Tabs defaultValue="ideation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {phases.map((phase) => (
              <TabsTrigger key={phase.id} value={phase.phase_type}>
                <span className="flex items-center gap-2">
                  {getPhaseIcon(phase.phase_type)}
                  {getPhaseLabel(phase.phase_type)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {phases.map((phase) => (
            <TabsContent key={phase.id} value={phase.phase_type}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPhaseIcon(phase.phase_type)}
                    {getPhaseLabel(phase.phase_type)}
                  </CardTitle>
                  <CardDescription>
                    Phase details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(phase.content as Record<string, any>).map(
                    ([key, value]) => (
                      <div key={key}>
                        <h3 className="font-semibold text-foreground mb-3 capitalize text-lg">
                          {key.replace(/_/g, " ")}
                        </h3>
                        {Array.isArray(value) ? (
                          <ul className="space-y-2 ml-4">
                            {value.map((item, idx) => (
                              <li key={idx} className="text-muted-foreground list-disc">
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {value || "Not filled"}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;
