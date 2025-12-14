import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JiraProjectSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectSelected: (projectKey: string, projectName: string) => void;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export function JiraProjectSelector({ open, onOpenChange, onProjectSelected }: JiraProjectSelectorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      checkConfiguration();
    }
  }, [open]);

  const checkConfiguration = async () => {
    try {
      const { data: integration } = await supabase
        .from('jira_integrations')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!integration) {
        setIsConfigured(false);
        return;
      }

      setIsConfigured(true);
      loadProjects();
    } catch (error: any) {
      toast.error("Error checking configuration", {
        description: error.message,
      });
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { action: 'list_projects' },
      });

      if (error) throw error;

      setProjects(data.projects || []);
    } catch (error: any) {
      toast.error("Error loading Jira projects", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const project = projects.find(p => p.key === selectedProject);
    if (project) {
      onProjectSelected(project.key, project.name);
      onOpenChange(false);
    }
  };

  if (!isConfigured) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jira Not Connected</DialogTitle>
            <DialogDescription>
              You need to connect your Jira account first in Settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              onOpenChange(false);
              navigate('/settings');
            }}>
              <Settings className="mr-2 h-4 w-4" />
              Go to Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Jira Project</DialogTitle>
          <DialogDescription>
            Choose which Jira project to sync your backlog with
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jira Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.key}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {project.key}
                        </span>
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedProject}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
