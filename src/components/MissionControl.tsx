import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle2, Circle, FileText, Sparkles, Loader2, 
  ArrowLeft, Lightbulb, RefreshCw, ChevronDown, ChevronUp, 
  ArrowUp, ArrowDown, PanelLeft, MoreHorizontal, RotateCcw, 
  Download, Target, Users, Lock, AlertCircle, ArrowRight,
  BarChart3, X, PanelRight, Crown, BookOpen, Moon, Star, Globe, Stars
} from "lucide-react";
import { useAgentChat, AgentType, Message } from "@/features/agents";
import { MarkdownContent } from "@/components/MarkdownContent";
import { NavTitle } from "@/components/NavTitle";
import { toast } from "sonner";
import { getAgentConfig } from "@/config/agents";
import { DashboardLayout } from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/features/subscription";
import { MissionControlSkeleton } from "@/components/MissionControlSkeleton";

type SubPhase = {
  id: string;
  name: string;
  agent: AgentType;
  description: string;
};

type Phase = {
  id: string;
  name: string;
  agent?: AgentType;
  status: "completed" | "active" | "pending";
  description: string;
  subPhases?: SubPhase[];
};

const phases: Phase[] = [{
  id: "ideation",
  name: "Ideation",
  agent: "ba",
  status: "active",
  description: "Explore and define the core vision"
}, {
  id: "planning",
  name: "Planning",
  status: "pending",
  description: "Define requirements and design UX",
  subPhases: [
    {
      id: "prd",
      name: "PRD",
      agent: "pm",
      description: "Create Product Requirements Document"
    },
    {
      id: "ux-design",
      name: "UX Design",
      agent: "ux",
      description: "Design user experience and interfaces"
    }
  ]
}, {
  id: "architecture",
  name: "Architecture",
  agent: "architect",
  status: "pending",
  description: "Design technical infrastructure"
}, {
  id: "backlog",
  name: "Backlog",
  agent: "sm",
  status: "pending",
  description: "Generate user stories and tasks"
}];

const AGENT_NAMES: Record<AgentType, string> = {
  ba: "Nova",
  pm: "Orion",
  ux: "Luna",
  architect: "Atlas",
  sm: "Vega"
};

const AGENT_ROLES: Record<AgentType, string> = {
  ba: "Business Analyst Lead",
  pm: "Product Manager",
  ux: "UX Designer",
  architect: "Technical Architect",
  sm: "Scrum Master"
};

const AGENT_INITIALS: Record<AgentType, string> = {
  ba: "NO",
  pm: "OR",
  ux: "LU",
  architect: "AT",
  sm: "VE"
};

const AGENT_ICONS: Record<AgentType, React.ComponentType<{ className?: string }>> = {
  ba: Sparkles,      // Nova - Supernova explosion
  pm: Star,          // Orion - Constellation star
  ux: Moon,          // Luna - Moon
  architect: Globe,  // Atlas - World/structure bearer
  sm: Stars          // Vega - Guiding stars
};

const PHASE_DOCUMENT_NAMES: Record<AgentType, string> = {
  ba: "Project Brief",
  pm: "PRD",
  ux: "UX Specification",
  architect: "Architecture",
  sm: "Backlog"
};

const getAgentColor = (agentType: AgentType): string => {
  const config = getAgentConfig(agentType);
  return config?.color || 'hsl(var(--muted))';
};

// Analysis capabilities definition
interface Capability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  minMessages: number;
  prompt: string;
}

const AGENT_CAPABILITIES: Record<AgentType, Capability[]> = {
  ba: [
    {
      id: "pain-points",
      name: "Pain Points",
      description: "Identify and analyze user pain points based on the documentation centralization issue.",
      icon: <AlertCircle className="w-4 h-4" />,
      minMessages: 6,
      prompt: "Based on our discussion so far, please help me explicitly identify and understand the specific frustrations and problems our target users face with existing solutions."
    },
    {
      id: "user-personas",
      name: "User Personas",
      description: "Define detailed user personas for construction managers and site workers.",
      icon: <Users className="w-4 h-4" />,
      minMessages: 10,
      prompt: "Now that we've identified the pain points, please create detailed user personas including demographics, goals, pain points, and behaviors."
    },
    {
      id: "value-proposition",
      name: "Value Proposition",
      description: "Needs more details on competitive advantage.",
      icon: <Sparkles className="w-4 h-4" />,
      minMessages: 12,
      prompt: "Please help me create a value proposition canvas that clearly articulates the unique value our solution brings to users."
    },
    {
      id: "market-analysis",
      name: "Market Analysis",
      description: "Comprehensive market size and trends analysis.",
      icon: <BarChart3 className="w-4 h-4" />,
      minMessages: 14,
      prompt: "Based on our discussion so far, please provide a comprehensive market analysis including market size, trends, opportunities, and competitive landscape."
    }
  ],
  pm: [
    {
      id: "user-stories",
      name: "User Stories",
      description: "Generate comprehensive user stories with acceptance criteria.",
      icon: <FileText className="w-4 h-4" />,
      minMessages: 8,
      prompt: "Based on our requirements discussion, please generate a comprehensive set of user stories with acceptance criteria."
    },
    {
      id: "success-metrics",
      name: "Success Metrics",
      description: "Define KPIs and success metrics.",
      icon: <Target className="w-4 h-4" />,
      minMessages: 10,
      prompt: "Please help me define clear success metrics and KPIs to measure the product's performance."
    },
    {
      id: "feature-prioritization",
      name: "Feature Prioritization",
      description: "Prioritize features using frameworks.",
      icon: <Target className="w-4 h-4" />,
      minMessages: 12,
      prompt: "Please help me prioritize the features we've discussed using a framework like MoSCoW or RICE."
    }
  ],
  ux: [
    {
      id: "wireframes",
      name: "Wireframes",
      description: "Create wireframe descriptions for main screens.",
      icon: <FileText className="w-4 h-4" />,
      minMessages: 8,
      prompt: "Based on the PRD, please create detailed wireframe descriptions for the main screens."
    },
    {
      id: "user-flows",
      name: "User Flows",
      description: "Design user journey flows.",
      icon: <Target className="w-4 h-4" />,
      minMessages: 10,
      prompt: "Please design the key user flows for our application."
    },
    {
      id: "design-system",
      name: "Design System",
      description: "Define design system tokens.",
      icon: <Sparkles className="w-4 h-4" />,
      minMessages: 12,
      prompt: "Please help me establish a design system including color palettes, typography, spacing."
    }
  ],
  architect: [
    {
      id: "tech-stack",
      name: "Tech Stack",
      description: "Recommend optimal technology stack.",
      icon: <Sparkles className="w-4 h-4" />,
      minMessages: 8,
      prompt: "Based on our requirements, please recommend a complete technology stack."
    },
    {
      id: "data-model",
      name: "Data Model",
      description: "Design database schema and relationships.",
      icon: <FileText className="w-4 h-4" />,
      minMessages: 10,
      prompt: "Please design a comprehensive data model including entity relationships."
    },
    {
      id: "api-design",
      name: "API Design",
      description: "Define API endpoints and contracts.",
      icon: <Target className="w-4 h-4" />,
      minMessages: 12,
      prompt: "Please design the main API endpoints we'll need."
    }
  ],
  sm: [
    {
      id: "backlog-refinement",
      name: "Backlog Refinement",
      description: "Refine and prioritize backlog items.",
      icon: <FileText className="w-4 h-4" />,
      minMessages: 8,
      prompt: "Please help me refine the product backlog."
    },
    {
      id: "acceptance-criteria",
      name: "Acceptance Criteria",
      description: "Define detailed acceptance criteria.",
      icon: <Sparkles className="w-4 h-4" />,
      minMessages: 10,
      prompt: "Please create detailed acceptance criteria for the key user stories."
    },
    {
      id: "sprint-planning",
      name: "Sprint Planning",
      description: "Plan sprint with story points.",
      icon: <Target className="w-4 h-4" />,
      minMessages: 12,
      prompt: "Please help me organize the user stories into a sprint plan."
    }
  ]
};

// Agent to required tier mapping
const AGENT_REQUIRED_TIER: Record<AgentType, 'free' | 'pro' | 'premium'> = {
  ba: 'free',
  pm: 'free',
  ux: 'pro',
  architect: 'pro',
  sm: 'premium'
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium'
};

const MissionControl = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { canUseAgent, tier, canSendMessage, canGenerateDocument, getRemainingMessages, getRemainingDocuments, checkSubscription } = useSubscription();
  const {
    messages,
    allMessages,
    isProcessing,
    isLoading,
    currentAgent,
    sendMessage,
    setCurrentAgent,
    reloadMessages
  } = useAgentChat({ projectId, onMessageSent: checkSubscription });
  
  const [inputMessage, setInputMessage] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      const { data, error } = await supabase.from('projects').select('name, description, created_at').eq('id', projectId).single();
      if (error) {
        console.error('Error loading project:', error);
        navigate('/projects');
        return;
      }
      if (data) {
        setProjectName(data.name);
        setProjectDescription(data.description || '');
        setProjectCreatedAt(data.created_at);
      }
    };
    loadProject();
  }, [projectId, navigate]);

  // Auto-trigger agent introduction when switching to a new phase with no messages
  const [hasTriggeredIntro, setHasTriggeredIntro] = useState<Set<AgentType>>(new Set());
  useEffect(() => {
    if (isLoading || isProcessing) return;
    if (!projectId) return;
    if (hasTriggeredIntro.has(currentAgent)) return;
    if (messages.length === 0) {
      setHasTriggeredIntro(prev => new Set([...prev, currentAgent]));
      const introPrompt = "Please introduce yourself and explain this phase based on our project context.";
      sendMessage(introPrompt, currentAgent, true);
    }
  }, [currentAgent, isLoading, messages.length]);

  const handleSend = () => {
    if (!inputMessage.trim() || isProcessing || !canSendMessage()) return;
    sendMessage(inputMessage, currentAgent);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cleanAnalysisContent = (content: string): string => {
    // Remove follow-up questions that the AI typically adds at the end
    const followUpPatterns = [
      /\n{2,}(?:Does this|Do you|Would you|Is there|Are there|What do you|How does|Shall I|Should I|Let me know|Please let me know|Feel free to)[^]*$/i,
      /\n{2,}---\n{2,}(?:Does this|Do you|Would you|Is there|Are there|What do you|How does|Shall I|Should I|Let me know|Please let me know|Feel free to)[^]*$/i,
    ];
    
    let cleaned = content;
    for (const pattern of followUpPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  };

  const handleCapabilityRequest = async (prompt: string, analysisId?: string) => {
    if (isProcessing || !canSendMessage()) return;
    
    // Send message and wait for response
    const responseContent = await sendMessage(prompt, currentAgent);
    
    // Save analysis with cleaned content after response is complete
    if (analysisId && projectId && responseContent) {
      try {
        const cleanedContent = cleanAnalysisContent(responseContent);
        
        const { error } = await supabase
          .from('project_analyses')
          .upsert({
            project_id: projectId,
            agent: currentAgent,
            analysis_id: analysisId,
            content: cleanedContent,
            completed: true,
          }, { onConflict: 'project_id,agent,analysis_id' });
        
        if (error) {
          console.error('Error saving analysis:', error);
        } else {
          setSavedAnalyses(prev => new Set([...prev, analysisId]));
          toast.success('Analysis saved successfully');
        }
      } catch (err) {
        console.error('Error saving analysis:', err);
      }
    }
  };

  const handleResetPhase = async () => {
    if (!projectId) return;
    try {
      setIsResetting(true);
      const { error } = await supabase.from('chat_messages').delete().eq('project_id', projectId).eq('agent', currentAgent);
      if (error) throw error;
      toast.success("Phase conversation cleared successfully");
      setHasTriggeredIntro(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentAgent);
        return newSet;
      });
      setShowResetDialog(false);
      await reloadMessages();
    } catch (error: any) {
      console.error("Error resetting phase:", error);
      toast.error("Error clearing conversation", { description: error.message });
    } finally {
      setIsResetting(false);
    }
  };

  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [savedPhases, setSavedPhases] = useState<Set<string>>(new Set());
  const [savedAnalyses, setSavedAnalyses] = useState<Set<string>>(new Set());
  const [phaseStatus, setPhaseStatus] = useState<Record<string, "completed" | "active" | "locked">>(() => {
    const initialStatus: Record<string, "completed" | "active" | "locked"> = {};
    phases.forEach((phase, idx) => {
      initialStatus[phase.id] = idx === 0 ? "active" : "locked";
      if (phase.subPhases) {
        phase.subPhases.forEach((subphase, subIdx) => {
          initialStatus[subphase.id] = idx === 0 && subIdx === 0 ? "active" : "locked";
        });
      }
    });
    return initialStatus;
  });
  const [currentPhaseDoc, setCurrentPhaseDoc] = useState<any>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  
  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isUserNearBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = (instant = false) => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTo({ 
      top: chatScrollRef.current.scrollHeight, 
      behavior: instant ? 'instant' : 'smooth' 
    });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    
    // Always scroll if user is near bottom or if this is initial load
    if (isUserNearBottomRef.current || messages.length <= 1) {
      // Small delay to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottom(messages.length <= 1);
      });
    }
  }, [messages]);

  // Auto-scroll when processing starts (to show typing indicator)
  useEffect(() => {
    if (isProcessing && isUserNearBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [isProcessing]);
  
  // Load saved phases and analyses from database
  useEffect(() => {
    const loadSavedPhasesAndAnalyses = async () => {
      if (!projectId) return;
      
      // Load phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select('phase_type, content')
        .eq('project_id', projectId)
        .eq('completed', true);
      
      if (phasesError) {
        console.error('Error loading saved phases:', phasesError);
        return;
      }
      
      // Load analyses from new table
      const { data: analysesData, error: analysesError } = await supabase
        .from('project_analyses')
        .select('agent, analysis_id')
        .eq('project_id', projectId)
        .eq('completed', true);
      
      if (analysesError) {
        console.error('Error loading saved analyses:', analysesError);
      }
      
      if (phasesData) {
        const saved = new Set(phasesData.map(p => p.phase_type));
        setSavedPhases(saved);
        
        // Use analyses from database instead of inferring from content
        const analyses = new Set<string>();
        if (analysesData) {
          analysesData.forEach(a => analyses.add(a.analysis_id));
        }
        setSavedAnalyses(analyses);

        const phaseTypeMap: Record<AgentType, string> = {
          'ba': 'project-brief',
          'pm': 'prd',
          'ux': 'ux-spec',
          'architect': 'architecture',
          'sm': 'backlog'
        };

        const newStatus: Record<string, "completed" | "active" | "locked"> = {};
        
        phases.forEach((phase, idx) => {
          if (phase.subPhases && phase.subPhases.length > 0) {
            const allSubphasesCompleted = phase.subPhases.every(subphase => saved.has(phaseTypeMap[subphase.agent]));
            
            if (allSubphasesCompleted) {
              newStatus[phase.id] = "completed";
              phase.subPhases.forEach(subphase => {
                newStatus[subphase.id] = "completed";
              });
            } else {
              const isPreviousCompleted = idx === 0 || newStatus[phases[idx - 1].id] === "completed";
              
              if (isPreviousCompleted) {
                newStatus[phase.id] = "active";
                phase.subPhases.forEach((subphase, subIdx) => {
                  const isSubphaseCompleted = saved.has(phaseTypeMap[subphase.agent]);
                  if (isSubphaseCompleted) {
                    newStatus[subphase.id] = "completed";
                  } else {
                    const previousSubphaseCompleted = subIdx === 0 || saved.has(phaseTypeMap[phase.subPhases![subIdx - 1].agent]);
                    newStatus[subphase.id] = previousSubphaseCompleted ? "active" : "locked";
                  }
                });
              } else {
                newStatus[phase.id] = "locked";
                phase.subPhases.forEach(subphase => {
                  newStatus[subphase.id] = "locked";
                });
              }
            }
          } else {
            const phaseType = phase.agent ? phaseTypeMap[phase.agent] : null;
            if (phaseType && saved.has(phaseType)) {
              newStatus[phase.id] = "completed";
            } else {
              const isPreviousCompleted = idx === 0 || newStatus[phases[idx - 1].id] === "completed";
              newStatus[phase.id] = isPreviousCompleted ? "active" : "locked";
            }
          }
        });
        
        setPhaseStatus(newStatus);
      }
    };
    loadSavedPhasesAndAnalyses();
  }, [projectId]);

  // Load current phase documentation
  useEffect(() => {
    const loadPhaseDocumentation = async () => {
      if (!projectId) return;
      const phaseTypeMap: Record<AgentType, string> = {
        'ba': 'project-brief',
        'pm': 'prd',
        'ux': 'ux-spec',
        'architect': 'architecture',
        'sm': 'backlog'
      };
      const phaseType = phaseTypeMap[currentAgent];
      const { data, error } = await supabase.from('project_phases').select('content').eq('project_id', projectId).eq('phase_type', phaseType).maybeSingle();
      if (error) {
        console.error('Error loading phase documentation:', error);
        setCurrentPhaseDoc(null);
        return;
      }
      setCurrentPhaseDoc(data?.content || null);
    };
    loadPhaseDocumentation();
  }, [projectId, currentAgent, savedPhases]);

  const getMinimumMessages = (agent: AgentType): number => {
    const minimums: Record<AgentType, number> = {
      'ba': 6,
      'pm': 8,
      'ux': 7,
      'architect': 8,
      'sm': 6
    };
    return minimums[agent];
  };

  const getAgentMessages = (agent: AgentType): Message[] => {
    return allMessages.filter(m => m.agent === agent || !m.agent);
  };

  const canSaveDocumentation = (): boolean => {
    const agentMessages = getAgentMessages(currentAgent);
    const minRequired = getMinimumMessages(currentAgent);
    return agentMessages.length >= minRequired;
  };

  // Get count of ready analyses
  const getReadyAnalysesCount = (): number => {
    const capabilities = AGENT_CAPABILITIES[currentAgent];
    const messageCount = messages.length;
    return capabilities.filter(cap => messageCount >= cap.minMessages).length;
  };

  const handleSaveDocumentation = async (customPrompt?: string) => {
    if (!projectId || allMessages.length === 0) return;
    if (!canSaveDocumentation()) {
      const agentMessages = getAgentMessages(currentAgent);
      const minRequired = getMinimumMessages(currentAgent);
      toast.warning("Insufficient conversation", {
        description: `Need at least ${minRequired} messages in this phase. You have ${agentMessages.length} messages.`
      });
      return;
    }

    const phaseTypeMap: Record<AgentType, string> = {
      'ba': 'project-brief',
      'pm': 'prd',
      'ux': 'ux-spec',
      'architect': 'architecture',
      'sm': 'backlog'
    };

    const phaseType = phaseTypeMap[currentAgent];
    try {
      setIsSavingDoc(true);
      const { data, error } = await supabase.functions.invoke('generate-documentation', {
        body: {
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          phase_type: phaseType,
          project_id: projectId,
          custom_prompt: customPrompt
        }
      });
      if (error) throw error;
      const action = customPrompt ? "regenerated" : "saved";
      toast.success(`${phaseType} documentation ${action} successfully!`);
      setSavedPhases(prev => new Set([...prev, phaseType]));

      if (phaseType === 'project-brief' && data?.content) {
        const contentStr = JSON.stringify(data.content).toLowerCase();
        if (contentStr.includes('pain point') || contentStr.includes('painpoint') || contentStr.includes('frustration') || contentStr.includes('problem')) {
          setSavedAnalyses(prev => new Set([...prev, 'pain-points']));
        }
      }

      // Update phase status
      const newStatus = { ...phaseStatus };
      let currentPhaseIndex = -1;
      let isSubphase = false;
      let parentPhaseIndex = -1;
      
      phases.forEach((phase, idx) => {
        if (phase.agent === currentAgent) {
          currentPhaseIndex = idx;
        }
        if (phase.subPhases) {
          const subphaseIndex = phase.subPhases.findIndex(sp => sp.agent === currentAgent);
          if (subphaseIndex !== -1) {
            isSubphase = true;
            parentPhaseIndex = idx;
            currentPhaseIndex = subphaseIndex;
          }
        }
      });
      
      if (isSubphase && parentPhaseIndex !== -1) {
        const parentPhase = phases[parentPhaseIndex];
        const currentSubphase = parentPhase.subPhases![currentPhaseIndex];
        newStatus[currentSubphase.id] = "completed";
        
        const allSubphasesCompleted = parentPhase.subPhases!.every(
          sp => newStatus[sp.id] === "completed" || savedPhases.has(phaseTypeMap[sp.agent]) || sp.agent === currentAgent
        );
        
        if (allSubphasesCompleted) {
          newStatus[parentPhase.id] = "completed";
          if (parentPhaseIndex < phases.length - 1) {
            const nextPhase = phases[parentPhaseIndex + 1];
            newStatus[nextPhase.id] = "active";
            if (nextPhase.subPhases && nextPhase.subPhases.length > 0) {
              newStatus[nextPhase.subPhases[0].id] = "active";
            }
          }
        } else {
          if (currentPhaseIndex < parentPhase.subPhases!.length - 1) {
            newStatus[parentPhase.subPhases![currentPhaseIndex + 1].id] = "active";
          }
        }
      } else if (currentPhaseIndex !== -1) {
        newStatus[phases[currentPhaseIndex].id] = "completed";
        if (currentPhaseIndex < phases.length - 1) {
          const nextPhase = phases[currentPhaseIndex + 1];
          newStatus[nextPhase.id] = "active";
          if (nextPhase.subPhases && nextPhase.subPhases.length > 0) {
            newStatus[nextPhase.subPhases[0].id] = "active";
          }
        }
      }
      
      setPhaseStatus(newStatus);

      if (data?.content) {
        setCurrentPhaseDoc(data.content);
      }
    } catch (error: any) {
      console.error("Error saving documentation:", error);
      toast.error("Error saving documentation", { description: error.message });
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleRegenerateSubmit = () => {
    if (!regeneratePrompt.trim()) {
      toast.warning("Please enter instructions to regenerate");
      return;
    }
    setShowRegenerateDialog(false);
    handleSaveDocumentation(regeneratePrompt);
    setRegeneratePrompt("");
  };

  const handleExport = () => {
    if (!currentPhaseDoc) {
      toast.error("No documentation to export");
      return;
    }
    const phaseNames: Record<AgentType, string> = {
      'ba': 'Project Brief',
      'pm': 'Product Requirements Document',
      'ux': 'UX Specification',
      'architect': 'Technical Architecture',
      'sm': 'Product Backlog'
    };
    const phaseName = phaseNames[currentAgent];
    let content = '';

    if (currentPhaseDoc.type === 'formatted_document') {
      content = currentPhaseDoc.content;
    } else {
      content = `${phaseName}\n`;
      content += `Project: ${projectName}\n`;
      content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
      content += '='.repeat(50) + '\n\n';
      const formatSection = (obj: any, level = 0): string => {
        let result = '';
        const indent = '  '.repeat(level);
        for (const [key, value] of Object.entries(obj)) {
          const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result += `${indent}${title}:\n`;
            result += formatSection(value, level + 1);
          } else if (Array.isArray(value)) {
            result += `${indent}${title}:\n`;
            value.forEach((item, idx) => {
              if (typeof item === 'object') {
                result += `${indent}  ${idx + 1}. `;
                result += formatSection(item, level + 2).trimStart();
              } else {
                result += `${indent}  - ${item}\n`;
              }
            });
          } else {
            result += `${indent}${title}: ${value}\n`;
          }
        }
        return result;
      };
      content += formatSection(currentPhaseDoc);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${phaseName.toLowerCase().replace(/\s+/g, '-')}-${projectName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Documentation exported successfully!");
  };

  // Determine if capability is unlocked
  const isCapabilityUnlocked = (capability: Capability) => {
    if (messages.length < capability.minMessages) return false;
    if (capability.id === "market-analysis" && currentAgent === "ba") {
      return savedAnalyses.has("pain-points");
    }
    return true;
  };

  // Get progress percentage for locked capability
  const getCapabilityProgress = (capability: Capability) => {
    return Math.min(100, Math.round((messages.length / capability.minMessages) * 100));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <MissionControlSkeleton />
      </DashboardLayout>
    );
  }

  const readyCount = getReadyAnalysesCount();

  return (
    <DashboardLayout>
      <section className="antialiased flex flex-col h-screen bg-background overflow-hidden">
        
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-4 min-w-0">
            {/* Back Button */}
            <button 
              onClick={() => navigate("/projects")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
                                    
            <NavTitle 
              title={projectName || "Your Project"} 
              description={`${phases.find(p => p.agent === currentAgent || p.subPhases?.some(sp => sp.agent === currentAgent))?.name || "Ideation"} • Mission Control`}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Documentation Link - Show when there are saved phases OR analyses */}
            {(savedPhases.size > 0 || savedAnalyses.size > 0) && (
              <>
                <button 
                  onClick={() => navigate(`/project-documents/${projectId}`)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Documentation</span>
                  {(savedPhases.size + savedAnalyses.size) > 0 && (
                    <span className="ml-1 bg-primary/20 px-1.5 rounded text-[10px] font-medium">
                      {savedPhases.size + savedAnalyses.size}
                    </span>
                  )}
                </button>

                <div className="h-4 w-px bg-border/50 mx-1" />
              </>
            )}

            {/* Analysis Panel Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Analyses</span>
              {readyCount > 0 && (
                <span className="ml-1 bg-emerald-500/20 px-1.5 rounded text-[10px] font-medium">
                  {readyCount}
                </span>
              )}
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowResetDialog(true)} disabled={isProcessing || messages.length === 0}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Phase
                </DropdownMenuItem>
                {currentPhaseDoc && (
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Documentation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Chat Area */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
            
            {/* Context Header - Phase & Agent Selectors */}
            <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-card/50">
              <div className="flex items-center gap-4">
                {/* Phase Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted hover:border-border transition-all">
                      <span className="text-sm font-medium text-foreground">
                        {phases.find(p => p.agent === currentAgent || p.subPhases?.some(sp => sp.agent === currentAgent))?.name || "Phase"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-popover border border-border">
                    {phases.map((phase) => {
                      // Check subscription for phase agents
                      const getPhaseAgent = (p: Phase): AgentType | undefined => {
                        if (p.agent) return p.agent;
                        if (p.subPhases && p.subPhases.length > 0) return p.subPhases[0].agent;
                        return undefined;
                      };
                      const phaseAgent = getPhaseAgent(phase);
                      const isPhaseSubscriptionLocked = phaseAgent ? !canUseAgent(phaseAgent) : false;
                      const phaseRequiredTier = phaseAgent ? AGENT_REQUIRED_TIER[phaseAgent] : 'free';
                      
                      return phase.subPhases ? (
                        <DropdownMenuSub key={phase.id}>
                          <DropdownMenuSubTrigger 
                            className={cn(
                              "flex items-center gap-2",
                              (phaseStatus[phase.id] === "locked" || isPhaseSubscriptionLocked) && "opacity-50"
                            )}
                            disabled={phaseStatus[phase.id] === "locked" || isPhaseSubscriptionLocked}
                          >
                            {phaseStatus[phase.id] === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isPhaseSubscriptionLocked ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : phaseStatus[phase.id] === "locked" ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                            <span className="flex-1">{phase.name}</span>
                            {isPhaseSubscriptionLocked && (
                              <span className="text-xs text-muted-foreground">{TIER_LABELS[phaseRequiredTier]}</span>
                            )}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="bg-popover border border-border">
                              {phase.subPhases.map((subphase) => {
                                const isSubSubscriptionLocked = !canUseAgent(subphase.agent);
                                const subRequiredTier = AGENT_REQUIRED_TIER[subphase.agent];
                                const isSubLocked = phaseStatus[subphase.id] === "locked" || isSubSubscriptionLocked;
                                
                                const subItem = (
                                  <DropdownMenuItem
                                    key={subphase.id}
                                    onClick={() => {
                                      if (!isSubLocked) {
                                        setCurrentAgent(subphase.agent);
                                      }
                                    }}
                                    disabled={isSubLocked}
                                    className={cn(
                                      "flex items-center gap-2",
                                      currentAgent === subphase.agent && "bg-muted",
                                      isSubLocked && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {phaseStatus[subphase.id] === "completed" ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : isSubSubscriptionLocked ? (
                                      <Crown className="w-4 h-4 text-amber-500" />
                                    ) : phaseStatus[subphase.id] === "locked" ? (
                                      <Lock className="w-4 h-4" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                    <span className="flex-1">{subphase.name}</span>
                                    {isSubSubscriptionLocked && (
                                      <span className="text-xs text-muted-foreground">{TIER_LABELS[subRequiredTier]}</span>
                                    )}
                                  </DropdownMenuItem>
                                );

                                if (isSubSubscriptionLocked) {
                                  return (
                                    <Tooltip key={subphase.id}>
                                      <TooltipTrigger asChild>
                                        {subItem}
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
                                        <p>Upgrade to {TIER_LABELS[subRequiredTier]} to unlock {subphase.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                }
                                return subItem;
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      ) : (() => {
                        const isMainSubscriptionLocked = phase.agent ? !canUseAgent(phase.agent) : false;
                        const mainRequiredTier = phase.agent ? AGENT_REQUIRED_TIER[phase.agent] : 'free';
                        const isMainLocked = phaseStatus[phase.id] === "locked" || isMainSubscriptionLocked;
                        
                        const mainItem = (
                          <DropdownMenuItem
                            key={phase.id}
                            onClick={() => {
                              if (phase.agent && !isMainLocked) {
                                setCurrentAgent(phase.agent);
                              }
                            }}
                            disabled={isMainLocked}
                            className={cn(
                              "flex items-center gap-2",
                              phase.agent === currentAgent && "bg-muted",
                              isMainLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {phaseStatus[phase.id] === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isMainSubscriptionLocked ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : phaseStatus[phase.id] === "locked" ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                            <span className="flex-1">{phase.name}</span>
                            {isMainSubscriptionLocked && (
                              <span className="text-xs text-muted-foreground">{TIER_LABELS[mainRequiredTier]}</span>
                            )}
                          </DropdownMenuItem>
                        );

                        if (isMainSubscriptionLocked) {
                          return (
                            <Tooltip key={phase.id}>
                              <TooltipTrigger asChild>
                                {mainItem}
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Upgrade to {TIER_LABELS[mainRequiredTier]} to unlock {phase.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return mainItem;
                      })();
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-4 w-px bg-border" />

                {/* Agent Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 hover:bg-muted hover:border-border transition-all">
                      <div className="relative">
                        <div className="absolute -bottom-1 -right-0.5 h-2 w-2 bg-emerald-500 border border-card rounded-full" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground">{AGENT_ROLES[currentAgent]}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-popover border border-border">
                    {(Object.keys(AGENT_NAMES) as AgentType[]).map((agent) => {
                      const agentPhase = phases.find(p => p.agent === agent || p.subPhases?.some(sp => sp.agent === agent));
                      const agentSubphase = agentPhase?.subPhases?.find(sp => sp.agent === agent);
                      const phaseId = agentSubphase?.id || agentPhase?.id || '';
                      const isPhaseLoсked = phaseStatus[phaseId] === "locked";
                      const isSubscriptionLocked = !canUseAgent(agent);
                      const isLocked = isPhaseLoсked || isSubscriptionLocked;
                      const requiredTier = AGENT_REQUIRED_TIER[agent];
                      
                      const menuItem = (
                        <DropdownMenuItem
                          key={agent}
                          onClick={() => {
                            if (!isLocked) {
                              setCurrentAgent(agent);
                            }
                          }}
                          disabled={isLocked}
                          className={cn(
                            "flex items-center gap-3 py-2",
                            currentAgent === agent && "bg-muted",
                            isLocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{AGENT_ROLES[agent]}</span>
                            {isSubscriptionLocked && (
                              <span className="text-xs text-muted-foreground">
                                Requires {TIER_LABELS[requiredTier]} plan
                              </span>
                            )}
                          </div>
                          {isSubscriptionLocked ? (
                            <Crown className="w-4 h-4 ml-auto text-amber-500" />
                          ) : isPhaseLoсked ? (
                            <Lock className="w-4 h-4 ml-auto" />
                          ) : null}
                        </DropdownMenuItem>
                      );

                      if (isSubscriptionLocked) {
                        return (
                          <Tooltip key={agent}>
                            <TooltipTrigger asChild>
                              {menuItem}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Upgrade to {TIER_LABELS[requiredTier]} to unlock {AGENT_ROLES[agent]}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return menuItem;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            
            </div>

            {/* Messages Stream */}
            <div 
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-3 py-6 md:px-6 pb-40 scroll-smooth chat-scroll min-h-0"
            >
              <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
              
              {/* Date Divider */}
              <div className="flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                  Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="flex gap-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div 
                    className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-lg mt-1"
                    style={{ 
                      background: `linear-gradient(135deg, ${getAgentColor(currentAgent)}, ${getAgentColor(currentAgent)}dd)`,
                      boxShadow: `0 4px 12px ${getAgentColor(currentAgent)}40`
                    }}
                  >
                    {(() => {
                      const IconComponent = AGENT_ICONS[currentAgent];
                      return <IconComponent className="w-4 h-4" />;
                    })()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-foreground">{AGENT_NAMES[currentAgent]}</span>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                    <div className="text-sm leading-relaxed text-muted-foreground space-y-4">
                      <p>Hello! I'm {AGENT_NAMES[currentAgent]}, your {AGENT_ROLES[currentAgent]} for this {phases.find(p => p.agent === currentAgent || p.subPhases?.some(sp => sp.agent === currentAgent))?.name?.toLowerCase()} phase.</p>
                      <p>My goal is to help us clearly define the "what" and "why" behind your project.</p>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index}>
                    {msg.role === 'user' ? (
                      // User Message
                      <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
                        <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-medium text-muted-foreground border border-border/50 mt-1">
                          YO
                        </div>
                        <div className="space-y-2 text-right">
                          <div 
                            className="text-sm text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md inline-block text-left"
                            style={{ backgroundColor: getAgentColor(currentAgent) }}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // AI Message
                      <div className="flex gap-3 md:gap-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div 
                          className="h-7 w-7 md:h-8 md:w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-lg mt-1"
                          style={{ 
                            background: `linear-gradient(135deg, ${getAgentColor(currentAgent)}, ${getAgentColor(currentAgent)}dd)`,
                            boxShadow: `0 4px 12px ${getAgentColor(currentAgent)}40`
                          }}
                        >
                          {(() => {
                            const IconComponent = AGENT_ICONS[currentAgent];
                            return <IconComponent className="w-4 h-4" />;
                          })()}
                        </div>
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-foreground">{AGENT_NAMES[currentAgent]}</span>
                            <span className="text-xs text-muted-foreground">Just now</span>
                          </div>
                          <div className="text-sm leading-relaxed text-foreground/90">
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-medium prose-li:my-0 [&_ul]:pl-4 [&_ol]:pl-4">
                              <MarkdownContent content={msg.content} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* In-Chat Analysis Nudge - Show after first AI response if analyses are ready */}
                    {msg.role === 'assistant' && index === 0 && readyCount > 0 && (
                      <div className="flex justify-center py-4">
                        <div 
                          onClick={() => setIsSidebarOpen(true)}
                          className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg max-w-lg w-full hover:bg-emerald-500/10 transition-colors cursor-pointer group"
                        >
                          <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                            <Target className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-emerald-400">New Insight Unlocked</p>
                            <p className="text-xs text-emerald-500/70 truncate">Based on your input, "{AGENT_CAPABILITIES[currentAgent][0]?.name}" is ready.</p>
                          </div>
                          <button className="text-xs font-medium bg-emerald-500 text-background px-2.5 py-1.5 rounded hover:opacity-90 transition-opacity">
                            View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isProcessing && (
                <div className="flex gap-4">
                  <div 
                    className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-lg mt-1"
                    style={{ 
                      background: `linear-gradient(135deg, ${getAgentColor(currentAgent)}, ${getAgentColor(currentAgent)}dd)`,
                      boxShadow: `0 4px 12px ${getAgentColor(currentAgent)}40`
                    }}
                  >
                    {(() => {
                      const IconComponent = AGENT_ICONS[currentAgent];
                      return <IconComponent className="w-4 h-4" />;
                    })()}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              
              </div>
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom()}
                className="pointer-events-auto z-20 absolute bottom-32 left-1/2 -translate-x-1/2 size-10 rounded-full bg-muted/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-105 animate-in fade-in slide-in-from-bottom-2"
                aria-label="Scroll to latest messages"
              >
                <ArrowDown className="size-4" strokeWidth={2} />
              </button>
            )}

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
              <div className="max-w-4xl mx-auto relative group">
                {/* Glow effect */}
                <div 
                  className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur"
                  style={{ 
                    background: `linear-gradient(to right, ${getAgentColor(currentAgent)}20, hsl(var(--primary)/0.2), ${getAgentColor(currentAgent)}20)` 
                  }}
                />
                <div className="relative flex flex-col gap-2 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-2 shadow-2xl ring-1 ring-border/20 focus-within:ring-border/40 transition-all">
                  
                  <Textarea
                    placeholder={!canSendMessage() ? `Message limit reached. Upgrade to continue.` : `Ask ${AGENT_NAMES[currentAgent]} to refine the user flow...`}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => handleKeyPress(e)}
                    disabled={isProcessing || !canSendMessage()}
                    className="textarea-scroll w-full bg-transparent text-sm text-foreground placeholder-muted-foreground resize-none outline-none px-3 py-2 min-h-[44px] max-h-32 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                  />
                  
                  <div className="flex items-center justify-between px-2 pb-1">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          if (isProcessing || !canSendMessage()) return;
                          sendMessage("Can you give me suggestions on what to do next in this phase?", currentAgent);
                        }}
                        disabled={isProcessing || !canSendMessage()}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors disabled:opacity-50" 
                        title="Get Suggestions"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {!canSendMessage() ? (
                        <span className="text-[10px] text-amber-500 font-medium hidden sm:block">
                          Message limit reached
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                          {getRemainingMessages() === 'unlimited' ? '⌘ Enter to send' : `${getRemainingMessages()} messages left`}
                        </span>
                      )}
                      <button 
                        onClick={handleSend}
                        disabled={isProcessing || !inputMessage.trim() || !canSendMessage()}
                        className="h-7 w-7 flex items-center justify-center rounded bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canSendMessage() ? 'Message limit reached' : 'Send message'}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar: Available Analyses - Overlay on mobile */}
          {isSidebarOpen && (
            <>
              {/* Backdrop for mobile */}
              <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
              
              <aside className={cn(
                "absolute right-0 top-0 h-full z-50 lg:relative lg:z-auto",
                "border-l border-border/50 bg-card flex-col shrink-0 transition-all duration-300",
                "w-80 flex animate-in slide-in-from-right lg:animate-none"
              )}>
                <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Analyses</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">Auto-updating</span>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground lg:hidden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  
                  {readyCount > 0 && (
                    <>
                      <div className="text-xs text-muted-foreground mb-2 px-1">Ready for review</div>
                      
                      {AGENT_CAPABILITIES[currentAgent]
                        .filter(cap => isCapabilityUnlocked(cap))
                        .map((capability) => (
                          <div 
                            key={capability.id}
                            className="group relative bg-card/50 hover:bg-card border border-border/50 hover:border-emerald-500/30 rounded-lg p-3 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                                  {capability.icon}
                                </div>
                                <span className="text-sm font-medium text-foreground">{capability.name}</span>
                              </div>
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{capability.description}</p>
                            <button 
                              onClick={() => handleCapabilityRequest(capability.prompt, capability.id)}
                              disabled={isProcessing || !canSendMessage()}
                              className="w-full py-1.5 rounded bg-muted hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/20 text-xs font-medium text-muted-foreground hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              title={!canSendMessage() ? 'Message limit reached' : 'Run Analysis'}
                            >
                              <span>Run Analysis</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </>
                  )}

                  {AGENT_CAPABILITIES[currentAgent].filter(cap => !isCapabilityUnlocked(cap)).length > 0 && (
                    <>
                      <div className="h-px bg-border/50 my-4" />
                      <div className="text-xs text-muted-foreground mb-2 px-1">Pending inputs</div>

                      {AGENT_CAPABILITIES[currentAgent]
                        .filter(cap => !isCapabilityUnlocked(cap))
                        .map((capability) => (
                          <div 
                            key={capability.id}
                            className="group relative bg-card/20 border border-border/50 rounded-lg p-3 opacity-60"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-muted text-muted-foreground">
                                  {capability.icon}
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">{capability.name}</span>
                              </div>
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{capability.description}</p>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all" 
                                style={{ width: `${getCapabilityProgress(capability)}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground">{getCapabilityProgress(capability)}% Data Collected</span>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
                
                {/* Bottom Panel Actions */}
                <div className="p-4 border-t border-border/50 bg-card/30 space-y-3">
                  <button 
                    onClick={() => handleSaveDocumentation()}
                    disabled={isSavingDoc || !canSaveDocumentation() || !canGenerateDocument()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canGenerateDocument() ? 'Document generation limit reached' : undefined}
                  >
                    {isSavingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate {PHASE_DOCUMENT_NAMES[currentAgent]}
                      </>
                    )}
                  </button>
                  {!canGenerateDocument() ? (
                    <p className="text-[10px] text-amber-500 text-center">
                      Document limit reached ({getRemainingDocuments()} remaining). Upgrade for more.
                    </p>
                  ) : !canSaveDocumentation() && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Need {getMinimumMessages(currentAgent) - getAgentMessages(currentAgent).length} more messages to complete phase
                    </p>
                  )}
                </div>
              </aside>
            </>
          )}
        </div>

        {/* Regenerate Dialog */}
        <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Regenerate Documentation</DialogTitle>
              <DialogDescription>
                Provide specific instructions to adjust the documentation. For example: "Add more technical details" or "Focus on business metrics".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="regenerate-prompt">Regeneration Instructions</Label>
                <Textarea 
                  id="regenerate-prompt" 
                  placeholder="e.g. Add section about risks and mitigations, emphasize costs more..." 
                  value={regeneratePrompt} 
                  onChange={e => setRegeneratePrompt(e.target.value)} 
                  className="min-h-[120px]" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowRegenerateDialog(false); setRegeneratePrompt(""); }}>
                Cancel
              </Button>
              <Button onClick={handleRegenerateSubmit} disabled={!regeneratePrompt.trim() || isSavingDoc}>
                {isSavingDoc ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Phase Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Phase Conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all conversation messages for {AGENT_NAMES[currentAgent]}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPhase} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Conversation
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </DashboardLayout>
  );
};

export default MissionControl;
