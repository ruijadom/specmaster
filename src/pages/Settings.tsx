import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { JiraIntegrationDialog } from "@/components/JiraIntegrationDialog";
import { LinearIntegrationDialog } from "@/components/LinearIntegrationDialog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MainHeader } from "@/components/MainHeader";
import { SettingsPageSkeleton } from "@/components/SettingsPageSkeleton";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [linearConfigured, setLinearConfigured] = useState(false);
  const [showJiraDialog, setShowJiraDialog] = useState(false);
  const [showLinearDialog, setShowLinearDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jiraInfo, setJiraInfo] = useState<any>(null);
  const [linearInfo, setLinearInfo] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    checkIntegrations();
  }, [user, authLoading, navigate]);

  const checkIntegrations = async () => {
    setIsLoading(true);
    try {
      // Check Jira
      const { data: jiraData } = await supabase
        .from('jira_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (jiraData) {
        setJiraConfigured(true);
        setJiraInfo(jiraData);
      }

      // Check Linear
      const { data: linearData } = await supabase
        .from('linear_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (linearData) {
        setLinearConfigured(true);
        setLinearInfo(linearData);
      }
    } catch (error: any) {
      toast.error("Error loading integrations", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectJira = async () => {
    try {
      const { error } = await supabase
        .from('jira_integrations')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setJiraConfigured(false);
      setJiraInfo(null);
      toast.success("Disconnected from Jira successfully!");
    } catch (error: any) {
      toast.error("Error disconnecting", {
        description: error.message,
      });
    }
  };

  const handleDisconnectLinear = async () => {
    try {
      const { error } = await supabase
        .from('linear_integrations')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setLinearConfigured(false);
      setLinearInfo(null);
      toast.success("Disconnected from Linear successfully!");
    } catch (error: any) {
      toast.error("Error disconnecting", {
        description: error.message,
      });
    }
  };

  const handleJiraConfigured = () => {
    setShowJiraDialog(false);
    checkIntegrations();
  };

  const handleLinearConfigured = () => {
    setShowLinearDialog(false);
    checkIntegrations();
  };

  if (isLoading || authLoading) {
    return (
      <DashboardLayout>
        <MainHeader
          title="Settings"
          description="Manage your integrations and account preferences"
        />
        <SettingsPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <MainHeader
        title="Settings"
        description="Manage your integrations and account preferences"
      />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect your project management tools to sync user stories and tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jira Integration */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.53 2c0 2.4 1.97 4.37 4.37 4.37h.1v4.27c-2.4 0-4.37 1.97-4.37 4.37v4.99c-2.4 0-4.37-1.97-4.37-4.37V2h4.27zm.1 10.64c0-2.4-1.97-4.37-4.37-4.37H2v4.27c0 2.4 1.97 4.37 4.37 4.37V22h4.27v-4.99c2.4 0 4.37-1.97 4.37-4.37h-3.38z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Jira</h3>
                    {jiraConfigured ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {jiraConfigured ? (
                      <>
                        <span className="font-medium">{jiraInfo?.jira_domain}</span>
                        {jiraInfo?.jira_project_name && (
                          <span> • Default: {jiraInfo.jira_project_name}</span>
                        )}
                      </>
                    ) : (
                      "Sync your backlog with Jira projects"
                    )}
                  </p>
                </div>
              </div>
              <div>
                {jiraConfigured ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJiraDialog(true)}
                    >
                      Reconfigure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectJira}
                      className="text-destructive hover:text-destructive"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setShowJiraDialog(true)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Linear Integration */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Linear</h3>
                    {linearConfigured ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {linearConfigured ? (
                      <>
                        <span className="font-medium">API Connected</span>
                        {linearInfo?.linear_team_name && (
                          <span> • Default: {linearInfo.linear_team_name}</span>
                        )}
                      </>
                    ) : (
                      "Sync your backlog with Linear teams"
                    )}
                  </p>
                </div>
              </div>
              <div>
                {linearConfigured ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinearDialog(true)}
                    >
                      Reconfigure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectLinear}
                      className="text-destructive hover:text-destructive"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setShowLinearDialog(true)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <JiraIntegrationDialog 
        open={showJiraDialog}
        onOpenChange={setShowJiraDialog}
        onConfigured={handleJiraConfigured}
      />

      <LinearIntegrationDialog
        open={showLinearDialog}
        onOpenChange={setShowLinearDialog}
        onConfigured={handleLinearConfigured}
      />
    </DashboardLayout>
  );
};

export default Settings;
