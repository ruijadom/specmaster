import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Loader2, Layers, BookOpen, Cpu, ChevronRight, CheckCircle2, ArrowLeftRight, Settings, LogOut, Plus, Lightbulb } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/MarkdownContent";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import { JiraProjectSelector } from "@/components/JiraProjectSelector";
import { LinearTeamSelector } from "@/components/LinearTeamSelector";
import { ProjectDocumentsSkeleton } from "@/components/ProjectDocumentsSkeleton";

interface PhaseDocument {
  phase_type: string;
  content: any;
  completed: boolean;
  updated_at: string;
}

interface AnalysisDocument {
  id: string;
  agent: string;
  analysis_id: string;
  content: any;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const PHASE_NAMES: Record<string, string> = {
  'project-brief': 'Project Brief',
  'prd': 'Product Requirements Document',
  'architecture': 'Technical Architecture',
  'backlog': 'Product Backlog'
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  'project-brief': 'Initial vision and business objectives',
  'prd': 'Product Requirements Document',
  'architecture': 'Data model and system diagrams',
  'backlog': 'User stories and sprint planning'
};

const ANALYSIS_NAMES: Record<string, string> = {
  'pain-points': 'Pain Points Analysis',
  'user-personas': 'User Personas',
  'value-proposition': 'Value Proposition',
  'market-analysis': 'Market Analysis',
  'competitor-analysis': 'Competitor Analysis',
  'user-stories': 'User Stories',
  'success-metrics': 'Success Metrics',
  'feature-prioritization': 'Feature Prioritization',
  'mvp-scope': 'MVP Scope',
  'wireframes': 'Wireframes',
  'user-flows': 'User Flows',
  'accessibility': 'Accessibility Review',
  'design-system': 'Design System',
  'tech-stack': 'Tech Stack Recommendation',
  'data-model': 'Data Model',
  'api-design': 'API Design',
  'security-review': 'Security Review',
  'backlog-refinement': 'Backlog Refinement',
  'acceptance-criteria': 'Acceptance Criteria',
  'dependency-mapping': 'Dependency Mapping',
  'sprint-planning': 'Sprint Planning'
};

const AGENT_NAMES: Record<string, string> = {
  'ba': 'Business Analyst',
  'pm': 'Product Manager',
  'ux': 'UX Designer',
  'architect': 'Architect',
  'sm': 'Scrum Master'
};

const ProjectDocuments = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const [documents, setDocuments] = useState<PhaseDocument[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<PhaseDocument | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'analyses'>('documents');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // Jira states
  const [showJiraSelector, setShowJiraSelector] = useState(false);
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [jiraProjectKey, setJiraProjectKey] = useState<string | null>(null);
  const [jiraProjectName, setJiraProjectName] = useState<string | null>(null);
  const [showJiraSyncDialog, setShowJiraSyncDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [checkingSync, setCheckingSync] = useState(false);
  const [creatingSelected, setCreatingSelected] = useState(false);
  const [showJiraCreateProject, setShowJiraCreateProject] = useState(false);
  const [newJiraProjectName, setNewJiraProjectName] = useState("");
  const [newJiraProjectKey, setNewJiraProjectKey] = useState("");
  const [creatingJiraProject, setCreatingJiraProject] = useState(false);
  const [createJiraProjectError, setCreateJiraProjectError] = useState<string | null>(null);
  
  // Linear states
  const [showLinearSelector, setShowLinearSelector] = useState(false);
  const [linearConfigured, setLinearConfigured] = useState(false);
  const [linearTeamId, setLinearTeamId] = useState<string | null>(null);
  const [linearTeamName, setLinearTeamName] = useState<string | null>(null);
  const [showLinearSyncDialog, setShowLinearSyncDialog] = useState(false);
  const [linearSyncStatus, setLinearSyncStatus] = useState<any>(null);
  const [checkingLinearSync, setCheckingLinearSync] = useState(false);
  const [creatingLinearSelected, setCreatingLinearSelected] = useState(false);

  useEffect(() => {
    loadProjectData();
    checkJiraConfig();
    checkLinearConfig();
    loadProjectIntegrations();
  }, [projectId]);

  const loadProjectIntegrations = async () => {
    if (!projectId) return;

    try {
      const { data: jiraConfig } = await supabase
        .from('project_jira_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (jiraConfig) {
        setJiraProjectKey(jiraConfig.jira_project_key);
        setJiraProjectName(jiraConfig.jira_project_name);
      }

      const { data: linearConfig } = await supabase
        .from('project_linear_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (linearConfig) {
        setLinearTeamId(linearConfig.linear_team_id);
        setLinearTeamName(linearConfig.linear_team_name);
      }
    } catch (error) {
      console.error('Error loading project integrations:', error);
    }
  };

  const loadProjectData = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name, created_at')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProjectName(project.name);
      setProjectCreatedAt(project.created_at);

      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('completed', true)
        .order("created_at", { ascending: true });

      if (phasesError) throw phasesError;
      setDocuments(phases || []);

      // Load analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from('project_analyses')
        .select('*')
        .eq('project_id', projectId)
        .eq('completed', true)
        .order('created_at', { ascending: true });

      if (analysesError) throw analysesError;
      setAnalyses(analysesData || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDocumentContent = (doc: PhaseDocument): string => {
    const phaseName = PHASE_NAMES[doc.phase_type];
    let content = `# ${phaseName}\n\n`;
    content += `**Project:** ${projectName}  \n`;
    content += `**Generated:** ${new Date(doc.updated_at).toLocaleDateString()}\n\n`;
    content += '---\n\n';

    if (doc.content.type === 'formatted_document') {
      return content + doc.content.content;
    }

    const formatSection = (obj: any, level = 0): string => {
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const isComplexObject = Object.values(value).some(v => 
            typeof v === 'object' || (Array.isArray(v) && v.some(item => typeof item === 'object'))
          );
          
          if (isComplexObject) {
            result += `${'#'.repeat(Math.min(level + 2, 6))} ${title}\n\n`;
            result += '```json\n';
            result += JSON.stringify(value, null, 2);
            result += '\n```\n\n';
          } else {
            result += `${'#'.repeat(Math.min(level + 2, 6))} ${title}\n\n`;
            result += formatSection(value, level + 1);
          }
        } else if (Array.isArray(value)) {
          result += `${'#'.repeat(Math.min(level + 2, 6))} ${title}\n\n`;
          
          const hasObjects = value.some(item => typeof item === 'object' && item !== null);
          
          if (hasObjects) {
            result += '```json\n';
            result += JSON.stringify(value, null, 2);
            result += '\n```\n\n';
          } else {
            value.forEach((item) => {
              result += `- ${item}\n`;
            });
            result += '\n';
          }
        } else {
          if (typeof value === 'string' && value.length > 100) {
            result += `**${title}:**\n\n${value}\n\n`;
          } else {
            result += `**${title}:** ${value}\n\n`;
          }
        }
      }
      return result;
    };

    content += formatSection(doc.content);
    return content;
  };

  const formatAnalysisContent = (analysis: AnalysisDocument): string => {
    const analysisName = ANALYSIS_NAMES[analysis.analysis_id] || analysis.analysis_id;
    const agentName = AGENT_NAMES[analysis.agent] || analysis.agent;
    let content = `# ${analysisName}\n\n`;
    content += `**Agent:** ${agentName}  \n`;
    content += `**Project:** ${projectName}  \n`;
    content += `**Generated:** ${new Date(analysis.updated_at).toLocaleDateString()}\n\n`;
    content += '---\n\n';

    if (!analysis.content) {
      return content + '_No content available_';
    }

    if (typeof analysis.content === 'string') {
      return content + analysis.content;
    }

    if (analysis.content.type === 'formatted_document') {
      return content + analysis.content.content;
    }

    const formatSection = (obj: any, level = 0): string => {
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result += `${'#'.repeat(Math.min(level + 2, 6))} ${title}\n\n`;
          result += formatSection(value, level + 1);
        } else if (Array.isArray(value)) {
          result += `${'#'.repeat(Math.min(level + 2, 6))} ${title}\n\n`;
          
          const hasObjects = value.some(item => typeof item === 'object' && item !== null);
          
          if (hasObjects) {
            result += '```json\n';
            result += JSON.stringify(value, null, 2);
            result += '\n```\n\n';
          } else {
            value.forEach((item) => {
              result += `- ${item}\n`;
            });
            result += '\n';
          }
        } else {
          if (typeof value === 'string' && value.length > 100) {
            result += `**${title}:**\n\n${value}\n\n`;
          } else {
            result += `**${title}:** ${value}\n\n`;
          }
        }
      }
      return result;
    };

    content += formatSection(analysis.content);
    return content;
  };

  const getAnalysisFileName = (analysis: AnalysisDocument, extension: string) => {
    return `${analysis.analysis_id}-${analysis.agent}-${projectName.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
  };

  const downloadAnalysisAsMd = (analysis: AnalysisDocument) => {
    const content = formatAnalysisContent(analysis);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getAnalysisFileName(analysis, 'md');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Analysis downloaded as Markdown!");
  };

  const getFileName = (doc: PhaseDocument, extension: string) => {
    return `${doc.phase_type}-${projectName.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
  };

  const downloadAsTxt = (doc: PhaseDocument) => {
    const content = formatDocumentContent(doc);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(doc, 'txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document downloaded as TXT!");
  };

  const downloadAsMd = (doc: PhaseDocument) => {
    const content = formatDocumentContent(doc);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(doc, 'md');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document downloaded as Markdown!");
  };

  const downloadAsPdf = (doc: PhaseDocument) => {
    try {
      const content = formatDocumentContent(doc);
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      
      const lines = content.split('\n');
      let y = margin;
      
      pdf.setFont("helvetica");
      
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        if (line.startsWith('# ')) {
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          line = line.substring(2);
        } else if (line.startsWith('## ')) {
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          line = line.substring(3);
        } else if (line.startsWith('### ')) {
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          line = line.substring(4);
        } else {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
        }
        
        const splitText = pdf.splitTextToSize(line || ' ', maxWidth);
        pdf.text(splitText, margin, y);
        y += splitText.length * 5;
      });
      
      pdf.save(getFileName(doc, 'pdf'));
      toast.success("Document downloaded as PDF!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const downloadAllAs = async (format: 'txt' | 'md' | 'pdf') => {
    if (documents.length === 0) {
      toast.error("No documents to download");
      return;
    }

    setIsDownloadingAll(true);
    try {
      let combinedContent = `# ${projectName}\n\n`;
      combinedContent += `**Complete Project Documentation**  \n`;
      combinedContent += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
      combinedContent += '---\n\n';

      documents.forEach((doc, idx) => {
        if (idx > 0) {
          combinedContent += '\n\n---\n\n';
        }
        combinedContent += formatDocumentContent(doc);
      });

      const fileName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-complete-documentation`;

      if (format === 'txt') {
        const blob = new Blob([combinedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'md') {
        const blob = new Blob([combinedContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        
        const lines = combinedContent.split('\n');
        let y = margin;
        
        pdf.setFont("helvetica");
        
        lines.forEach((line) => {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          
          if (line.startsWith('# ')) {
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            line = line.substring(2);
          } else if (line.startsWith('## ')) {
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            line = line.substring(3);
          } else if (line.startsWith('### ')) {
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            line = line.substring(4);
          } else {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
          }
          
          const splitText = pdf.splitTextToSize(line || ' ', maxWidth);
          pdf.text(splitText, margin, y);
          y += splitText.length * 5;
        });
        
        pdf.save(`${fileName}.pdf`);
      }

      toast.success(`All documents downloaded as ${format.toUpperCase()}!`);
    } catch (error: any) {
      toast.error("Failed to download documents", {
        description: error.message
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const checkJiraConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setJiraConfigured(false);
        return;
      }

      const { data } = await supabase
        .from('jira_integrations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setJiraConfigured(!!data);
    } catch (error) {
      console.error('Error checking Jira config:', error);
      setJiraConfigured(false);
    }
  };

  const checkLinearConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLinearConfigured(false);
        return;
      }

      const { data } = await supabase
        .from('linear_integrations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setLinearConfigured(!!data);
    } catch (error) {
      console.error('Error checking Linear config:', error);
      setLinearConfigured(false);
    }
  };

  const extractStoriesFromBacklog = (backlogDoc: PhaseDocument) => {
    const stories = [];
    const content = backlogDoc.content;
    
    if (content.user_stories && Array.isArray(content.user_stories)) {
      stories.push(...content.user_stories);
    } else if (content.stories && Array.isArray(content.stories)) {
      stories.push(...content.stories);
    } else if (content.epics && Array.isArray(content.epics)) {
      content.epics.forEach((epic: any) => {
        if (epic.stories && Array.isArray(epic.stories)) {
          stories.push(...epic.stories);
        }
      });
    }
    
    return stories;
  };

  const handleCreateJiraProject = async () => {
    if (!newJiraProjectName.trim()) {
      setCreateJiraProjectError("Nome do projeto é obrigatório");
      return;
    }

    if (!newJiraProjectKey.trim()) {
      setCreateJiraProjectError("Chave do projeto é obrigatória");
      return;
    }

    // Validate key format
    const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
    if (!keyRegex.test(newJiraProjectKey)) {
      setCreateJiraProjectError("A chave deve ter 2-10 caracteres maiúsculos, começando com letra");
      return;
    }

    setCreatingJiraProject(true);
    setCreateJiraProjectError(null);

    try {
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { 
          action: 'create_project',
          projectName: newJiraProjectName.trim(),
          projectKey: newJiraProjectKey.trim().toUpperCase(),
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.code === 'DUPLICATE_KEY') {
          setCreateJiraProjectError("Já existe um projeto com esta chave");
        } else if (data.code === 'DUPLICATE_NAME') {
          setCreateJiraProjectError("Já existe um projeto com este nome");
        } else {
          setCreateJiraProjectError(data.error);
        }
        return;
      }

      toast.success(`Projeto "${data.project.name}" (${data.project.key}) criado com sucesso!`);

      // Set the newly created project
      setJiraProjectKey(data.project.key);
      setJiraProjectName(data.project.name);

      // Save to project config
      if (projectId) {
        await supabase
          .from('project_jira_config')
          .upsert({
            project_id: projectId,
            jira_project_key: data.project.key,
            jira_project_name: data.project.name,
          }, {
            onConflict: 'project_id'
          });
      }

      // Close modal and reset
      setShowJiraCreateProject(false);
      setNewJiraProjectName("");
      setNewJiraProjectKey("");
      setCreateJiraProjectError(null);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      setCreateJiraProjectError(error.message || "Erro ao criar projeto");
    } finally {
      setCreatingJiraProject(false);
    }
  };

  const checkJiraSync = async () => {
    const backlogDoc = documents.find(doc => doc.phase_type === 'backlog');
    
    if (!backlogDoc) {
      toast.error("Backlog not found");
      return;
    }

    setCheckingSync(true);
    try {
      const stories = extractStoriesFromBacklog(backlogDoc);

      if (stories.length === 0) {
        toast.error("No user stories found");
        return;
      }

      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { 
          action: 'check_sync',
          stories: stories,
          projectKey: jiraProjectKey
        },
      });

      if (error) throw error;

      setSyncStatus(data);
      setShowJiraSyncDialog(true);
    } catch (error: any) {
      console.error('Failed to check sync:', error);
      toast.error("Failed to check sync", {
        description: error.message || "Could not verify Jira status."
      });
    } finally {
      setCheckingSync(false);
    }
  };

  const createMissingTasks = async () => {
    if (!syncStatus || !jiraProjectKey) return;
    
    const missingStories = syncStatus.syncStatus
      .filter((item: any) => !item.synced)
      .map((item: any) => {
        const backlogDoc = documents.find(doc => doc.phase_type === 'backlog');
        const stories = extractStoriesFromBacklog(backlogDoc!);
        return stories.find((s: any) => (s.title || s.summary) === item.title);
      })
      .filter(Boolean);

    if (missingStories.length === 0) {
      toast.info("All tasks are already synced!");
      return;
    }

    setCreatingSelected(true);
    try {
      const { data, error } = await supabase.functions.invoke('jira-integration', {
        body: { 
          action: 'create_issues',
          stories: missingStories,
          projectKey: jiraProjectKey
        },
      });

      if (error) throw error;

      toast.success("Tasks created!", {
        description: `${data.created} user stories were created in Jira.`
      });
      
      setTimeout(() => checkJiraSync(), 1500);
    } catch (error: any) {
      console.error('Failed to create Jira tasks:', error);
      toast.error("Failed to create tasks", {
        description: error.message || "Could not create the tasks."
      });
    } finally {
      setCreatingSelected(false);
    }
  };

  const checkLinearSync = async () => {
    const backlogDoc = documents.find(doc => doc.phase_type === 'backlog');
    
    if (!backlogDoc) {
      toast.error("Backlog not found");
      return;
    }

    setCheckingLinearSync(true);
    try {
      const stories = extractStoriesFromBacklog(backlogDoc);

      if (stories.length === 0) {
        toast.error("No user stories found");
        return;
      }

      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { 
          action: 'check_sync',
          stories: stories,
          teamId: linearTeamId
        },
      });

      if (error) throw error;

      setLinearSyncStatus(data);
      setShowLinearSyncDialog(true);
    } catch (error: any) {
      console.error('Failed to check Linear sync:', error);
      toast.error("Failed to check sync", {
        description: error.message || "Could not verify Linear status."
      });
    } finally {
      setCheckingLinearSync(false);
    }
  };

  const createLinearMissingTasks = async () => {
    if (!linearSyncStatus || !linearTeamId) return;
    
    const missingStories = linearSyncStatus.syncStatus
      .filter((item: any) => !item.synced)
      .map((item: any) => {
        const backlogDoc = documents.find(doc => doc.phase_type === 'backlog');
        const stories = extractStoriesFromBacklog(backlogDoc!);
        return stories.find((s: any) => (s.title || s.summary) === item.title);
      })
      .filter(Boolean);

    if (missingStories.length === 0) {
      toast.info("All issues are already synced!");
      return;
    }

    setCreatingLinearSelected(true);
    try {
      const { data, error } = await supabase.functions.invoke('linear-integration', {
        body: { 
          action: 'create_issues',
          stories: missingStories,
          teamId: linearTeamId
        },
      });

      if (error) throw error;

      toast.success("Issues created!", {
        description: `${data.created} user stories were created in Linear.`
      });
      
      setTimeout(() => checkLinearSync(), 1500);
    } catch (error: any) {
      console.error('Failed to create Linear issues:', error);
      toast.error("Failed to create issues", {
        description: error.message || "Could not create the issues."
      });
    } finally {
      setCreatingLinearSelected(false);
    }
  };

  const getDocumentIcon = (phaseType: string) => {
    switch (phaseType) {
      case 'backlog':
        return Layers;
      case 'project-brief':
        return FileText;
      case 'architecture':
        return Cpu;
      case 'prd':
        return BookOpen;
      default:
        return FileText;
    }
  };

  const getDocumentStatus = (phaseType: string) => {
    if (phaseType === 'backlog') {
      return { label: 'Tasks Created', variant: 'default' as const };
    }
    return { label: 'Completed', variant: 'secondary' as const };
  };

  const lastUpdated = documents.length > 0 
    ? new Date(Math.max(...documents.map(d => new Date(d.updated_at).getTime())))
    : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <ProjectDocumentsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-8 transition-colors hover:text-foreground cursor-pointer w-fit group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No documents generated yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete phases in Mission Control to generate documentation
                </p>
                <Button onClick={() => navigate(`/mission-control/${projectId}`)}>
                  Go to Mission Control
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header Section */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-semibold tracking-tight">{projectName}</h1>
                  </div>
                  <p className="text-muted-foreground text-sm max-w-lg">
                    Manage architectural blueprints, sprints, and requirement specifications.
                  </p>
                </div>

                {/* Global Actions */}
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={isDownloadingAll} variant="default">
                        {isDownloadingAll ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download All
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => downloadAllAs('txt')}>
                        Download as TXT
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadAllAs('md')}>
                        Download as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadAllAs('pdf')}>
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* Stats / Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Documents</span>
                  <span className="text-lg font-medium">{documents.length}</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Analyses</span>
                  <span className="text-lg font-medium">{analyses.length}</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Last Updated</span>
                  <span className="text-lg font-medium">
                    {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Created</span>
                  <span className="text-lg font-medium">
                    {projectCreatedAt ? new Date(projectCreatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">Status</span>
                  <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded border border-border inline-block">Active</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Documents ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('analyses')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'analyses'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Analyses ({analyses.length})
                </button>
              </div>

              {/* Documents Table */}
              {activeTab === 'documents' && (
              <div className="w-full overflow-hidden rounded-xl border border-border bg-card/30 shadow-2xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
                        <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[35%]">
                          Document Name
                        </TableHead>
                        <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[20%]">
                          Status
                        </TableHead>
                        <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[25%]">
                          Integrations
                        </TableHead>
                        <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[15%]">
                          Updated
                        </TableHead>
                        <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider text-right w-[5%]">
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm divide-y divide-border">
                      {documents.map((doc) => {
                        const Icon = getDocumentIcon(doc.phase_type);
                        const status = getDocumentStatus(doc.phase_type);
                        const isBacklog = doc.phase_type === 'backlog';
                        
                        return (
                          <TableRow key={doc.phase_type} className="group hover:bg-muted/20 transition-colors relative">                            
                            <TableCell className="py-4 px-6 relative align-middle">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg border flex-shrink-0 ${
                                  isBacklog 
                                    ? 'bg-primary/10 border-primary/20 text-primary' 
                                    : 'bg-muted border-border text-muted-foreground'
                                }`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="block font-medium group-hover:text-foreground transition-colors">
                                    {PHASE_NAMES[doc.phase_type]}
                                  </span>
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    {PHASE_DESCRIPTIONS[doc.phase_type]}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="py-4 px-6 align-middle">
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            </TableCell>
                            
                            <TableCell className="py-4 px-6 align-middle">
                              {isBacklog ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Linear Dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors text-xs font-medium ${
                                          linearConfigured && linearTeamId
                                            ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#5E6AD2] hover:bg-[#5E6AD2]/20'
                                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-[#5E6AD2]/30 hover:bg-[#5E6AD2]/10'
                                        }`}
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                        Linear
                                        {linearConfigured && linearTeamId && (
                                          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        )}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 bg-background border border-border z-50">
                                      {linearConfigured ? (
                                        <>
                                          {linearTeamId ? (
                                            <>
                                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                Team: <span className="font-medium text-foreground">{linearTeamName}</span>
                                              </div>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem 
                                                onClick={checkLinearSync}
                                                disabled={checkingLinearSync}
                                                className="cursor-pointer"
                                              >
                                                {checkingLinearSync ? (
                                                  <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Analysing...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Sync Issues
                                                  </>
                                                )}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                onClick={() => setShowLinearSelector(true)}
                                                className="cursor-pointer"
                                              >
                                                <Settings className="mr-2 h-4 w-4" />
                                                Change Team
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem 
                                                onClick={async () => {
                                                  if (!projectId) return;
                                                  try {
                                                    const { error } = await supabase
                                                      .from('project_linear_config')
                                                      .delete()
                                                      .eq('project_id', projectId);
                                                    
                                                    if (error) throw error;
                                                    
                                                    setLinearTeamId(null);
                                                    setLinearTeamName(null);
                                                    toast.success("Linear team removed from this project!");
                                                  } catch (error: any) {
                                                    toast.error("Failed to remove team", {
                                                      description: error.message
                                                    });
                                                  }
                                                }}
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                              >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Remove Team
                                              </DropdownMenuItem>
                                            </>
                                          ) : (
                                            <DropdownMenuItem 
                                              onClick={() => setShowLinearSelector(true)}
                                              className="cursor-pointer"
                                            >
                                              <Settings className="mr-2 h-4 w-4" />
                                              Choose Linear Team
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuSeparator />
                                        </>
                                      ) : (
                                        <DropdownMenuItem 
                                          onClick={() => setShowLinearSelector(true)}
                                          className="cursor-pointer"
                                        >
                                          <Settings className="mr-2 h-4 w-4" />
                                          Configure Linear
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  
                                  {/* Jira Dropdown */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors text-xs font-medium ${
                                          jiraConfigured && jiraProjectKey
                                            ? 'bg-[#0052CC]/10 border-[#0052CC]/30 text-[#0052CC] hover:bg-[#0052CC]/20'
                                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-[#0052CC]/30 hover:bg-[#0052CC]/10'
                                        }`}
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                        Jira
                                        {jiraConfigured && jiraProjectKey && (
                                          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        )}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 bg-background border border-border z-50">
                                      {jiraConfigured ? (
                                        <>
                                          {jiraProjectKey ? (
                                            <>
                                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                Project: <span className="font-medium text-foreground">{jiraProjectName}</span>
                                              </div>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem 
                                                onClick={checkJiraSync}
                                                disabled={checkingSync}
                                                className="cursor-pointer"
                                              >
                                                {checkingSync ? (
                                                  <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Checking...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Sync Center
                                                  </>
                                                )}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                onClick={() => setShowJiraSelector(true)}
                                                className="cursor-pointer"
                                              >
                                                <Settings className="mr-2 h-4 w-4" />
                                                Change Project
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                onClick={() => setShowJiraCreateProject(true)}
                                                className="cursor-pointer"
                                              >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Project
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem 
                                                onClick={async () => {
                                                  if (!projectId) return;
                                                  try {
                                                    const { error } = await supabase
                                                      .from('project_jira_config')
                                                      .delete()
                                                      .eq('project_id', projectId);
                                                    
                                                    if (error) throw error;
                                                    
                                                    setJiraProjectKey(null);
                                                    setJiraProjectName(null);
                                                    toast.success("Jira project removed from this project!");
                                                  } catch (error: any) {
                                                    toast.error("Failed to remove project", {
                                                      description: error.message
                                                    });
                                                  }
                                                }}
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                              >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Remove Project
                                              </DropdownMenuItem>
                                            </>
                                          ) : (
                                            <DropdownMenuItem 
                                              onClick={() => setShowJiraSelector(true)}
                                              className="cursor-pointer"
                                            >
                                              <Settings className="mr-2 h-4 w-4" />
                                              Choose Jira Project
                                            </DropdownMenuItem>
                                          )}
                                        </>
                                      ) : (
                                        <DropdownMenuItem 
                                          onClick={() => setShowJiraSelector(true)}
                                          className="cursor-pointer"
                                        >
                                          <Settings className="mr-2 h-4 w-4" />
                                          Configure Jira
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Not applicable</span>
                              )}
                            </TableCell>
                            
                            <TableCell className="py-4 px-6 text-muted-foreground align-middle">
                              {new Date(doc.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            
                            <TableCell className="py-4 px-6 text-right align-middle">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button 
                                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" 
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => downloadAsTxt(doc)}>
                                      Download as TXT
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadAsMd(doc)}>
                                      Download as Markdown
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadAsPdf(doc)}>
                                      Download as PDF
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <button 
                                  onClick={() => setSelectedDoc(doc)}
                                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" 
                                  title="View Details"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing {documents.length} documents</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Synced
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground"></span> Local only
                    </span>
                  </div>
                </div>
              </div>
              )}

              {/* Analyses Table */}
              {activeTab === 'analyses' && (
                <div className="w-full overflow-hidden rounded-xl border border-border bg-card/30 shadow-2xl">
                  {analyses.length === 0 ? (
                    <div className="py-12 text-center">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No analyses saved yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Run analyses in Mission Control to see them here
                      </p>
                      <Button onClick={() => navigate(`/mission-control/${projectId}`)}>
                        Go to Mission Control
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
                              <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[40%]">
                                Analysis Name
                              </TableHead>
                              <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[20%]">
                                Agent
                              </TableHead>
                              <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[20%]">
                                Status
                              </TableHead>
                              <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider w-[15%]">
                                Created
                              </TableHead>
                              <TableHead className="py-3 px-6 text-xs font-medium uppercase tracking-wider text-right w-[5%]">
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-sm divide-y divide-border">
                            {analyses.map((analysis) => (
                              <TableRow key={analysis.id} className="group hover:bg-muted/20 transition-colors">
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg border bg-primary/10 border-primary/20 text-primary flex-shrink-0">
                                      <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <span className="block font-medium">
                                        {ANALYSIS_NAMES[analysis.analysis_id] || analysis.analysis_id}
                                      </span>
                                      <span className="block text-xs text-muted-foreground mt-1">
                                        Deep dive analysis
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <Badge variant="outline" className="text-xs">
                                    {AGENT_NAMES[analysis.agent] || analysis.agent}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-muted-foreground">
                                  {new Date(analysis.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => downloadAnalysisAsMd(analysis)}
                                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setSelectedAnalysis(analysis)}
                                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      title="View Details"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Showing {analyses.length} analyses</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedDoc && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{PHASE_NAMES[selectedDoc.phase_type]}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(selectedDoc.updated_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDoc(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6">
                      <MarkdownContent 
                        content={
                          selectedDoc.content.type === 'formatted_document' 
                            ? selectedDoc.content.content 
                            : formatDocumentContent(selectedDoc)
                        } 
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedAnalysis && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>
                            {ANALYSIS_NAMES[selectedAnalysis.analysis_id] || selectedAnalysis.analysis_id}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {AGENT_NAMES[selectedAnalysis.agent] || selectedAnalysis.agent} • {new Date(selectedAnalysis.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnalysis(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6">
                      <MarkdownContent content={formatAnalysisContent(selectedAnalysis)} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
          
          <JiraProjectSelector
            open={showJiraSelector}
            onOpenChange={setShowJiraSelector}
            onProjectSelected={async (projectKey, projectName) => {
              if (!projectId) return;
              
              try {
                const { error } = await supabase
                  .from('project_jira_config')
                  .upsert({
                    project_id: projectId,
                    jira_project_key: projectKey,
                    jira_project_name: projectName,
                  }, {
                    onConflict: 'project_id'
                  });
                
                if (error) throw error;
                
                setJiraProjectKey(projectKey);
                setJiraProjectName(projectName);
                toast.success("Projeto Jira configurado", {
                  description: `${projectName} (${projectKey})`
                });
              } catch (error: any) {
                console.error('Error saving Jira config:', error);
                toast.error("Failed to save configuration", {
                  description: error.message
                });
              }
            }}
          />

          <LinearTeamSelector
            open={showLinearSelector}
            onOpenChange={setShowLinearSelector}
            onTeamSelected={async (teamId, teamName) => {
              if (!projectId) return;
              
              try {
                const { error } = await supabase
                  .from('project_linear_config')
                  .upsert({
                    project_id: projectId,
                    linear_team_id: teamId,
                    linear_team_name: teamName,
                  }, {
                    onConflict: 'project_id'
                  });
                
                if (error) throw error;
                
                setLinearTeamId(teamId);
                setLinearTeamName(teamName);
                toast.success("Linear team configured", {
                  description: teamName
                });
              } catch (error: any) {
                console.error('Error saving Linear config:', error);
                toast.error("Failed to save configuration", {
                  description: error.message
                });
              }
            }}
          />

          {/* Jira Sync Dialog */}
          {syncStatus && (
            <div 
              className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showJiraSyncDialog ? '' : 'hidden'}`}
            >
              <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">Jira Sync Center</CardTitle>
                      <CardDescription className="mt-2">
                        {syncStatus.syncedCount} synced • {syncStatus.notSyncedCount} to create
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowJiraSyncDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button 
                      onClick={checkJiraSync}
                      disabled={checkingSync}
                      variant="outline"
                      className="w-full"
                    >
                      {checkingSync ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Refresh Status'
                      )}
                    </Button>
                    {syncStatus.notSyncedCount > 0 && (
                      <Button 
                        onClick={createMissingTasks}
                        disabled={creatingSelected}
                        className="w-full"
                      >
                        {creatingSelected ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating {syncStatus.notSyncedCount} task{syncStatus.notSyncedCount !== 1 ? 's' : ''}...
                          </>
                        ) : (
                          `Create ${syncStatus.notSyncedCount} Missing Task${syncStatus.notSyncedCount !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {syncStatus.syncStatus.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          item.synced 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                            : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            {item.synced && item.jiraKey && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {item.jiraKey} • {item.jiraStatus}
                              </div>
                            )}
                          </div>
                          <Badge variant={item.synced ? "default" : "secondary"}>
                            {item.synced ? '✓ Synced' : '○ To create'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Linear Sync Dialog */}
          {linearSyncStatus && (
            <div 
              className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showLinearSyncDialog ? '' : 'hidden'}`}
            >
              <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">Linear Sync Center</CardTitle>
                      <CardDescription className="mt-2">
                        {linearSyncStatus.syncedCount} synced • {linearSyncStatus.notSyncedCount} to create
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLinearSyncDialog(false)}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button 
                      onClick={checkLinearSync}
                      disabled={checkingLinearSync}
                      variant="outline"
                      className="w-full"
                    >
                      {checkingLinearSync ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Refresh Status'
                      )}
                    </Button>
                    {linearSyncStatus.notSyncedCount > 0 && (
                      <Button 
                        onClick={createLinearMissingTasks}
                        disabled={creatingLinearSelected}
                        className="w-full"
                      >
                        {creatingLinearSelected ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating {linearSyncStatus.notSyncedCount} issue{linearSyncStatus.notSyncedCount !== 1 ? 's' : ''}...
                          </>
                        ) : (
                          `Create ${linearSyncStatus.notSyncedCount} Missing Issue${linearSyncStatus.notSyncedCount !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {linearSyncStatus.syncStatus.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          item.synced 
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                            : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            {item.synced && item.linearKey && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {item.linearKey} • {item.linearStatus}
                              </div>
                            )}
                          </div>
                          <Badge variant={item.synced ? "default" : "secondary"}>
                            {item.synced ? '✓ Synced' : '○ To create'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Create Jira Project Modal */}
      <Dialog open={showJiraCreateProject} onOpenChange={setShowJiraCreateProject}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Jira Project</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new project in Jira.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newJiraProjectName">Project Name</Label>
              <Input
                id="newJiraProjectName"
                placeholder="e.g. My New Project"
                value={newJiraProjectName}
                onChange={(e) => {
                  setNewJiraProjectName(e.target.value);
                  setCreateJiraProjectError(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newJiraProjectKey">Project Key</Label>
              <Input
                id="newJiraProjectKey"
                placeholder="e.g. MNP"
                value={newJiraProjectKey}
                onChange={(e) => {
                  setNewJiraProjectKey(e.target.value.toUpperCase());
                  setCreateJiraProjectError(null);
                }}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                2-10 uppercase characters, starting with a letter (e.g. PROJ, MNP)
              </p>
            </div>

            {createJiraProjectError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createJiraProjectError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowJiraCreateProject(false);
                setNewJiraProjectName("");
                setNewJiraProjectKey("");
                setCreateJiraProjectError(null);
              }}
              className="flex-1"
              disabled={creatingJiraProject}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateJiraProject}
              disabled={creatingJiraProject || !newJiraProjectName.trim() || !newJiraProjectKey.trim()}
              className="flex-1"
            >
              {creatingJiraProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creatingJiraProject ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProjectDocuments;