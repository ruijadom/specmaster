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

interface LinearIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: () => void;
}

interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

export function LinearIntegrationDialog({ open, onOpenChange, onConfigured }: LinearIntegrationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [apiToken, setApiToken] = useState("");
  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [connectionTested, setConnectionTested] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);
  
  // Create team modal states
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamKey, setNewTeamKey] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");

  useEffect(() => {
    // Only load config when opening for the first time or after a reset
    if (open && !hasLoadedConfig) {
      loadExistingConfig();
    }
  }, [open, hasLoadedConfig]);

  const loadExistingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('linear_integrations')
        .select('*')
        .single();

      if (data && !error) {
        setApiToken(data.linear_api_token);
        if (data.linear_team_id) {
          setSelectedTeam(data.linear_team_id);
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
      const raw = window.localStorage.getItem("linear_integration_draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        apiToken?: string;
        selectedTeam?: string;
      };

      if (!apiToken && draft.apiToken) setApiToken(draft.apiToken);
      if (!selectedTeam && draft.selectedTeam) setSelectedTeam(draft.selectedTeam);
    } catch (error) {
      console.error("Failed to load Linear draft from localStorage", error);
    }
  }, [open, apiToken, selectedTeam]);

  // Persist draft on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = { apiToken, selectedTeam };
    window.localStorage.setItem("linear_integration_draft", JSON.stringify(draft));
  }, [apiToken, selectedTeam]);
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('linear_integrations')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Reset all states
      setApiToken("");
      setTeams([]);
      setSelectedTeam("");
      setConnectionTested(false);
      setIsConnected(false);
      setHasLoadedConfig(false);

      toast({
        title: "Desconectado com sucesso",
        description: "A integração com Linear foi removida.",
      });
      
      onConfigured();
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Erro ao desconectar",
        description: error.message || "Não foi possível desconectar do Linear.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const testConnection = async () => {
    if (!apiToken) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira o API Token antes de testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: upsertError } = await supabase
        .from('linear_integrations')
        .upsert({
          user_id: user.id,
          linear_api_token: apiToken,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { action: 'test_connection' },
      });

      if (error) throw error;

      toast({
        title: "Conexão bem-sucedida!",
        description: `Conectado como ${data.user.name}`,
      });

      setConnectionTested(true);
      await loadTeams();
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast({
        title: "Falha na conexão",
        description: error.message || "Verifique seu API Token e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const loadTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { action: 'list_teams' },
      });

      if (error) throw error;

      setTeams(data.teams || []);
    } catch (error: any) {
      console.error('Failed to load teams:', error);
      toast({
        title: "Erro ao carregar teams",
        description: "Não foi possível carregar os teams do Linear.",
        variant: "destructive",
      });
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamKey.trim()) {
      setCreateTeamError("Nome e chave são obrigatórios");
      return;
    }

    // Validate key format (alphanumeric, no spaces, 2-5 chars)
    const keyRegex = /^[A-Za-z0-9]{2,5}$/;
    if (!keyRegex.test(newTeamKey)) {
      setCreateTeamError("A chave deve ter 2-5 caracteres alfanuméricos sem espaços");
      return;
    }

    setCreatingTeam(true);
    setCreateTeamError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { 
          action: 'create_team',
          teamName: newTeamName.trim(),
          teamKey: newTeamKey.trim().toUpperCase()
        },
      });

      if (error) {
        // Parse the error response
        const errorBody = error.message || error;
        if (typeof errorBody === 'string' && errorBody.includes('DUPLICATE')) {
          setCreateTeamError(errorBody);
        } else {
          throw error;
        }
        return;
      }

      // Check for application-level errors in the response
      if (data?.error) {
        if (data.error === 'DUPLICATE_KEY' || data.error === 'DUPLICATE_NAME') {
          setCreateTeamError(data.message);
        } else {
          setCreateTeamError(data.message || data.error);
        }
        return;
      }

      toast({
        title: "Team criado com sucesso!",
        description: `O team "${data.team.name}" foi criado no Linear.`,
      });

      // Reload teams and select the new one
      await loadTeams();
      setSelectedTeam(data.team.id);
      
      // Close modal and reset
      setShowCreateTeamModal(false);
      setNewTeamName("");
      setNewTeamKey("");
      setCreateTeamError("");
    } catch (error: any) {
      console.error('Failed to create team:', error);
      setCreateTeamError(error.message || "Não foi possível criar o team.");
    } finally {
      setCreatingTeam(false);
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

      const selectedTeamData = teams.find(t => t.id === selectedTeam);

      const { error } = await supabase
        .from('linear_integrations')
        .upsert({
          user_id: user.id,
          linear_api_token: apiToken,
          linear_team_id: selectedTeam,
          linear_team_name: selectedTeamData?.name,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configuração salva!",
        description: "Integração com Linear configurada com sucesso.",
      });

      onConfigured();
      onOpenChange(false);
    } catch (error: any) {
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
                {isConnected ? "Gerenciar Integração Linear" : "Configurar Integração Linear"}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {isConnected 
                  ? "Sua conta Linear está conectada. Use o menu para gerenciar."
                  : "Siga os passos abaixo para conectar sua conta Linear e criar issues automaticamente"
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
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <p className="font-semibold">Conta Linear Conectada</p>
                    <div className="text-sm space-y-1">
                      <p><strong>API Token:</strong> ••••••••</p>
                      {selectedTeam && (
                        <p><strong>Team Padrão:</strong> {teams.find(t => t.id === selectedTeam)?.name || selectedTeam}</p>
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
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    1
                  </div>
                  <h3 className="font-semibold">Obter API Token do Linear</h3>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>Para criar um API Token:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                      <li>Acesse suas configurações no Linear</li>
                      <li>Vá em "API" → "Personal API keys"</li>
                      <li>Clique em "Create new key"</li>
                      <li>Dê um nome e copie o token</li>
                    </ol>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => window.open('https://linear.app/settings/api', '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir Linear API Settings
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    2
                  </div>
                  <h3 className="font-semibold">Inserir API Token</h3>
                </div>

                <div className="space-y-4 pl-8">
                  <div className="space-y-2">
                    <Label htmlFor="apiToken">API Token</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="lin_api_..."
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      disabled={connectionTested}
                    />
                  </div>
                </div>
              </div>

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
                      disabled={testing || !apiToken}
                      className="w-full"
                      size="lg"
                    >
                      {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {testing ? "Testando..." : "Testar Conexão com Linear"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Conexão estabelecida com sucesso! Agora você pode selecionar um team (opcional).
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                        4
                      </div>
                      <h3 className="font-semibold">Selecionar Team (Opcional)</h3>
                    </div>

                    <div className="space-y-2 pl-8">
                      <Label htmlFor="team">Team Linear Padrão</Label>
                      <Select value={selectedTeam} onValueChange={(value) => {
                        if (value === "__create_new__") {
                          setShowCreateTeamModal(true);
                        } else {
                          setSelectedTeam(value);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum team selecionado" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingTeams ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">Carregando teams...</p>
                            </div>
                          ) : (
                            <>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name} ({team.key})
                                </SelectItem>
                              ))}
                              <Separator className="my-1" />
                              <SelectItem value="__create_new__" className="text-primary font-medium">
                                <span className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Criar Novo Team
                                </span>
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      
                      <p className="text-xs text-muted-foreground">
                        Selecione um team existente ou crie um novo</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConnectionTested(false);
                        setTeams([]);
                        setSelectedTeam("");
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

    {/* Create Team Modal */}
    <Dialog open={showCreateTeamModal} onOpenChange={(open) => {
      setShowCreateTeamModal(open);
      if (!open) {
        setNewTeamName("");
        setNewTeamKey("");
        setCreateTeamError("");
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Team</DialogTitle>
          <DialogDescription>
            Crie um novo team no Linear para organizar suas issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Nome do Team</Label>
            <Input
              id="teamName"
              placeholder="Ex: Produto, Engineering, Design..."
              value={newTeamName}
              onChange={(e) => {
                setNewTeamName(e.target.value);
                setCreateTeamError("");
              }}
              disabled={creatingTeam}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamKey">Chave do Team</Label>
            <Input
              id="teamKey"
              placeholder="Ex: PRD, ENG, DES..."
              value={newTeamKey}
              onChange={(e) => {
                setNewTeamKey(e.target.value.toUpperCase());
                setCreateTeamError("");
              }}
              maxLength={5}
              disabled={creatingTeam}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              2-5 caracteres alfanuméricos. Será usado como prefixo das issues (ex: PRD-123)
            </p>
          </div>

          {createTeamError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createTeamError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateTeamModal(false);
                setNewTeamName("");
                setNewTeamKey("");
                setCreateTeamError("");
              }}
              className="flex-1"
              disabled={creatingTeam}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={creatingTeam || !newTeamName.trim() || !newTeamKey.trim()}
              className="flex-1"
            >
              {creatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creatingTeam ? "Criando..." : "Criar Team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}