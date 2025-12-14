import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, AlertCircle, MoreVertical, RefreshCw, LogOut, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface JiraIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: () => void;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export function JiraIntegrationDialog({ open, onOpenChange, onConfigured }: JiraIntegrationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [connectionTested, setConnectionTested] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
  
  // Create new project modal state
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);

  useEffect(() => {
    // Only load config when opening for the first time or after a reset
    if (open && !hasLoadedConfig) {
      loadExistingConfig();
    }
  }, [open, hasLoadedConfig]);

  const loadExistingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('jira_integrations')
        .select('*')
        .single();

      if (data && !error) {
        setDomain(data.jira_domain);
        setEmail(data.jira_email);
        setApiToken(data.jira_api_token);
        if (data.jira_project_key) {
          setSelectedProject(data.jira_project_key);
        }
        setConnectionTested(true);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
      setHasLoadedConfig(true);
    } catch (error) {
      console.error('Error loading config:', error);
      setIsConnected(false);
      setHasLoadedConfig(true);
    }
  };

  // Restore unsaved draft from localStorage so data is not lost when tab/page reloads
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("jira_integration_draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        domain?: string;
        email?: string;
        apiToken?: string;
        selectedProject?: string;
      };

      if (!domain && draft.domain) setDomain(draft.domain);
      if (!email && draft.email) setEmail(draft.email);
      if (!apiToken && draft.apiToken) setApiToken(draft.apiToken);
      if (!selectedProject && draft.selectedProject) setSelectedProject(draft.selectedProject);
    } catch (error) {
      console.error("Failed to load Jira draft from localStorage", error);
    }
  }, [open, domain, email, apiToken, selectedProject]);

  // Persist draft on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = { domain, email, apiToken, selectedProject };
    window.localStorage.setItem("jira_integration_draft", JSON.stringify(draft));
  }, [domain, email, apiToken, selectedProject]);
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('jira_integrations')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Reset all states
      setDomain("");
      setEmail("");
      setApiToken("");
      setProjects([]);
      setSelectedProject("");
      setConnectionTested(false);
      setIsConnected(false);
      setHasLoadedConfig(false);

      toast({
        title: "Desconectado com sucesso",
        description: "A integração com Jira foi removida.",
      });
      
      onConfigured(); // Refresh the parent component
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Erro ao desconectar",
        description: error.message || "Não foi possível desconectar do Jira.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const testConnection = async () => {
    if (!domain || !email || !apiToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos antes de testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      // Save config temporarily
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: upsertError } = await supabase
        .from('jira_integrations')
        .upsert({
          user_id: user.id,
          jira_domain: domain,
          jira_email: email,
          jira_api_token: apiToken,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      // Test connection
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { action: 'test_connection' },
      });

      if (error) throw error;

      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado como ${data.user.displayName}`,
      });

      setConnectionTested(true);
      await loadProjects();
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Falha na conexão",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { action: 'list_projects' },
      });

      if (error) throw error;

      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar os projetos do Jira.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateProjectError("Nome do projeto é obrigatório");
      return;
    }

    if (!newProjectKey.trim()) {
      setCreateProjectError("Chave do projeto é obrigatória");
      return;
    }

    // Validate key format
    const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
    if (!keyRegex.test(newProjectKey)) {
      setCreateProjectError("A chave deve ter 2-10 caracteres maiúsculos, começando com letra");
      return;
    }

    setCreatingProject(true);
    setCreateProjectError(null);

    try {
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { 
          action: 'create_project',
          projectName: newProjectName.trim(),
          projectKey: newProjectKey.trim().toUpperCase(),
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'DUPLICATE_KEY') {
          setCreateProjectError("Já existe um projeto com esta chave");
        } else if (data.code === 'DUPLICATE_NAME') {
          setCreateProjectError("Já existe um projeto com este nome");
        } else {
          setCreateProjectError(data.error);
        }
        return;
      }

      toast({
        title: "Projeto criado!",
        description: `Projeto "${data.project.name}" (${data.project.key}) criado com sucesso.`,
      });

      // Add new project to list and select it
      const newProject: JiraProject = {
        id: data.project.id,
        key: data.project.key,
        name: data.project.name,
      };
      setProjects(prev => [...prev, newProject]);
      setSelectedProject(newProject.key);

      // Close modal and reset
      setShowCreateProjectModal(false);
      setNewProjectName("");
      setNewProjectKey("");
      setCreateProjectError(null);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      setCreateProjectError(error.message || "Erro ao criar projeto");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSave = async () => {
    if (!connectionTested) {
      toast({
        title: "Teste a conexão primeiro",
        description: "Por favor, teste a conexão antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedProjectData = projects.find(p => p.key === selectedProject);

      const { error } = await supabase
        .from('jira_integrations')
        .upsert({
          user_id: user.id,
          jira_domain: domain,
          jira_email: email,
          jira_api_token: apiToken,
          jira_project_key: selectedProject,
          jira_project_name: selectedProjectData?.name,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configuração salva!",
        description: "Integração com Jira configurada com sucesso.",
      });

      onConfigured();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {isConnected ? "Gerenciar Integração Jira" : "Configurar Integração Jira"}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {isConnected 
                  ? "Sua conta Jira está conectada. Use o menu para gerenciar."
                  : "Siga os passos abaixo para conectar sua conta Jira e criar tasks automaticamente"
                }
              </DialogDescription>
            </div>
            {isConnected && connectionTested && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
                  <DropdownMenuItem 
                    onClick={() => {
                      setConnectionTested(false);
                      setIsConnected(false);
                    }}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Alterar Conta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Desconectando...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Desconectar
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isConnected && connectionTested ? (
            <>
              {/* Connected State - Show Account Info */}
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <p className="font-semibold">Conta Jira Conectada</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Domínio:</strong> {domain}</p>
                      <p><strong>Email:</strong> {email}</p>
                      {selectedProject && (
                        <p><strong>Projeto Padrão:</strong> {projects.find(p => p.key === selectedProject)?.name || selectedProject}</p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Use o menu no canto superior direito para alterar a conta ou desconectar.
                </p>
              </div>
            </>
          ) : (
            <>
          {/* Step 1: Get API Token */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <h3 className="font-semibold">Obter API Token do Jira</h3>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>Para criar um API Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                  <li>Acesse sua conta Atlassian</li>
                  <li>Vá em "Segurança" → "Criar e gerenciar tokens de API"</li>
                  <li>Clique em "Criar token de API"</li>
                  <li>Dê um nome ao token e copie-o</li>
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => window.open('https://id.atlassian.com/manage-profile/security/api-tokens', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Atlassian API Tokens
                </Button>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 2: Enter Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <h3 className="font-semibold">Inserir Credenciais</h3>
            </div>

            <div className="space-y-4 pl-8">
              <div className="space-y-2">
                <Label htmlFor="domain" className="flex items-center gap-2">
                  Domínio Jira
                  <span className="text-xs text-muted-foreground">(sem https://)</span>
                </Label>
                <Input
                  id="domain"
                  placeholder="exemplo.atlassian.net"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={connectionTested}
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: suaempresa.atlassian.net
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email da Conta Jira</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={connectionTested}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiToken">API Token</Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="Cole aqui o token que você criou"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  disabled={connectionTested}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Test Connection */}
          {!connectionTested ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <h3 className="font-semibold">Testar Conexão</h3>
              </div>
              
              <div className="pl-8">
                <Button
                  onClick={testConnection}
                  disabled={testing || !domain || !email || !apiToken}
                  className="w-full"
                  size="lg"
                >
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {testing ? "Testando..." : "Testar Conexão com Jira"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Success Message */}
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Conexão estabelecida com sucesso! Agora você pode selecionar um projeto (opcional).
                </AlertDescription>
              </Alert>

              {/* Step 4: Select Project */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    4
                  </div>
                  <h3 className="font-semibold">Selecionar Projeto (Opcional)</h3>
                </div>

                <div className="space-y-2 pl-8">
                  <Label htmlFor="project">Projeto Jira Padrão</Label>
                  <Select value={selectedProject} onValueChange={(value) => {
                    if (value === "__create_new__") {
                      setShowCreateProjectModal(true);
                    } else {
                      setSelectedProject(value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum projeto selecionado" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProjects ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground mt-2">Carregando projetos...</p>
                        </div>
                      ) : (
                        <>
                          {projects.map((project) => (
                            <SelectItem key={project.key} value={project.key}>
                              {project.name} ({project.key})
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <SelectItem value="__create_new__" className="text-primary font-medium">
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Criar Novo Projeto
                            </span>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecione um projeto existente ou crie um novo
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConnectionTested(false);
                    setProjects([]);
                    setSelectedProject("");
                  }}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Salvando..." : "Concluir Configuração"}
                </Button>
              </div>
            </>
          )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Create New Project Modal */}
    <Dialog open={showCreateProjectModal} onOpenChange={setShowCreateProjectModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto Jira</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo projeto no Jira.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newProjectName">Nome do Projeto</Label>
            <Input
              id="newProjectName"
              placeholder="Ex: Meu Novo Projeto"
              value={newProjectName}
              onChange={(e) => {
                setNewProjectName(e.target.value);
                setCreateProjectError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newProjectKey">Chave do Projeto</Label>
            <Input
              id="newProjectKey"
              placeholder="Ex: MNP"
              value={newProjectKey}
              onChange={(e) => {
                setNewProjectKey(e.target.value.toUpperCase());
                setCreateProjectError(null);
              }}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              2-10 caracteres maiúsculos, começando com letra (ex: PROJ, MNP)
            </p>
          </div>

          {createProjectError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createProjectError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateProjectModal(false);
              setNewProjectName("");
              setNewProjectKey("");
              setCreateProjectError(null);
            }}
            className="flex-1"
            disabled={creatingProject}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={creatingProject || !newProjectName.trim() || !newProjectKey.trim()}
            className="flex-1"
          >
            {creatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {creatingProject ? "Criando..." : "Criar Projeto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}