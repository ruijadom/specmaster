import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LinearTeamSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamSelected: (teamId: string, teamName: string) => void;
}

interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

export function LinearTeamSelector({ open, onOpenChange, onTeamSelected }: LinearTeamSelectorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      checkConfiguration();
    }
  }, [open]);

  const checkConfiguration = async () => {
    try {
      const { data: integration } = await supabase
        .from('linear_integrations')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!integration) {
        setIsConfigured(false);
        return;
      }

      setIsConfigured(true);
      loadTeams();
    } catch (error: any) {
      toast.error("Error checking configuration", {
        description: error.message,
      });
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { action: 'list_teams' },
      });

      if (error) throw error;

      setTeams(data.teams || []);
    } catch (error: any) {
      toast.error("Error loading Linear teams", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const team = teams.find(t => t.id === selectedTeam);
    if (team) {
      onTeamSelected(team.id, team.name);
      onOpenChange(false);
    }
  };

  if (!isConfigured) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Linear Not Connected</DialogTitle>
            <DialogDescription>
              You need to connect your Linear account first in Settings.
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
          <DialogTitle>Select Linear Team</DialogTitle>
          <DialogDescription>
            Choose which Linear team to sync your backlog with
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Linear Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {team.key}
                        </span>
                        <span>{team.name}</span>
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
              <Button onClick={handleConfirm} disabled={!selectedTeam}>
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
