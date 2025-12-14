import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { useSubscription } from "@/features/subscription";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, CreditCard, Calendar, Users, Zap, RefreshCw, MessageSquare, FileText, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { toast } from "sonner";
import { MainHeader } from "@/components/MainHeader";
import { AccountPageSkeleton } from "@/components/AccountPageSkeleton";

const Account = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { 
    tier, 
    subscribed, 
    subscriptionEnd, 
    chatLimit,
    docLimit,
    projectLimit,
    chatUsage,
    docUsage,
    projectCount,
    agentsAllowed,
    integrationsAllowed,
    loading: subLoading,
    checkSubscription,
    openCustomerPortal
  } = useSubscription();

  // Handle subscription success redirect
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      // Refresh subscription status
      checkSubscription();
      toast.success("Subscription activated!", {
        description: "Thank you for subscribing. Your plan is now active."
      });
      // Clear the URL parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, checkSubscription]);

  if (authLoading || subLoading) {
    return (
      <DashboardLayout>
        <MainHeader
          title="Account"
          description="Manage your subscription and usage"
        />
        <AccountPageSkeleton />
      </DashboardLayout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const tierColors = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary text-primary-foreground",
    premium: "bg-amber-500 text-white"
  };

  const tierLabels = {
    free: "Free",
    pro: "Pro",
    premium: "Premium"
  };

  const agentNames: Record<string, string> = {
    ba: "Business Analyst",
    ux: "UX Designer",
    pm: "Project Manager",
    architect: "Architect",
    sm: "Scrum Master"
  };

  const chatPercentage = chatLimit === -1 ? 0 : Math.min(100, (chatUsage / chatLimit) * 100);
  const docPercentage = Math.min(100, (docUsage / docLimit) * 100);
  const projectPercentage = projectLimit === -1 ? 0 : Math.min(100, (projectCount / projectLimit) * 100);

  return (
    <DashboardLayout>
      <MainHeader
        title="Account"
        description="Manage your subscription and usage"
        actions={
          <div className="flex gap-2">
            <FeedbackDialog />
            <Button variant="outline" size="sm" onClick={() => checkSubscription()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />
      <div className="container max-w-4xl py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Subscription</CardTitle>
              </div>
              <Badge className={tierColors[tier]}>
                {tierLabels[tier]}
              </Badge>
            </div>
            <CardDescription>
              {subscribed 
                ? "You have an active subscription" 
                : "You are on the free plan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Renews on {format(new Date(subscriptionEnd), "PPP")}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              {subscribed ? (
                <Button onClick={openCustomerPortal}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : (
                <Button onClick={() => navigate("/pricing")}>
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Usage This Month</CardTitle>
            </div>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chat Messages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Chat Messages</span>
                </div>
                <span className="font-medium">
                  {chatLimit === -1 
                    ? `${chatUsage} (Unlimited)` 
                    : `${chatUsage} / ${chatLimit}`}
                </span>
              </div>
              {chatLimit !== -1 && (
                <Progress value={chatPercentage} className="h-2" />
              )}
              {chatLimit !== -1 && chatPercentage >= 80 && (
                <p className="text-xs text-amber-600">
                  {chatPercentage >= 100 
                    ? "You've reached your message limit. Upgrade for more." 
                    : "You're running low on messages."}
                </p>
              )}
            </div>

            {/* Document Generations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Document Generations</span>
                </div>
                <span className="font-medium">
                  {docUsage} / {docLimit}
                </span>
              </div>
              <Progress value={docPercentage} className="h-2" />
              {docPercentage >= 80 && (
                <p className="text-xs text-amber-600">
                  {docPercentage >= 100 
                    ? "You've reached your document limit. Upgrade for more." 
                    : "You're running low on document generations."}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span>Projects</span>
                </div>
                <span className="font-medium">
                  {projectLimit === -1 
                    ? `${projectCount} (Unlimited)` 
                    : `${projectCount} / ${projectLimit}`}
                </span>
              </div>
              {projectLimit !== -1 && (
                <Progress value={projectPercentage} className="h-2" />
              )}
              {projectLimit !== -1 && projectPercentage >= 100 && (
                <p className="text-xs text-amber-600">
                  You've reached your project limit. Upgrade for unlimited projects.
                </p>
              )}
            </div>

            {/* Integrations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Integrations (Jira, Linear)</span>
                <Badge variant={integrationsAllowed ? "default" : "secondary"}>
                  {integrationsAllowed ? "Enabled" : "Premium Only"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Access Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Agent Access</CardTitle>
            </div>
            <CardDescription>
              AI agents available in your plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(agentNames).map(([id, name]) => {
                const hasAccess = agentsAllowed.includes(id);
                return (
                  <div
                    key={id}
                    className={`p-3 rounded-lg border ${
                      hasAccess 
                        ? "border-primary/50 bg-primary/5" 
                        : "border-border bg-muted/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{name}</span>
                      {hasAccess ? (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Locked</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {tier === "free" && (
              <p className="text-sm text-muted-foreground mt-4">
                Upgrade to Pro or Premium to unlock all agents.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Account;