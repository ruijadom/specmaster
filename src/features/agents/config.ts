import type { AgentConfig, AgentType } from "./types";

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  ba: {
    type: 'ba',
    initials: 'NO',
    name: 'Business Analyst',
    color: 'hsl(210, 80%, 55%)',
    description: 'Nova analyzes business requirements and creates project briefs',
  },
  pm: {
    type: 'pm',
    initials: 'MX',
    name: 'Product Manager',
    color: 'hsl(280, 60%, 60%)',
    description: 'Max manages product vision and creates PRDs',
  },
  architect: {
    type: 'architect',
    initials: 'TH',
    name: 'Technical Architect',
    color: 'hsl(25, 75%, 55%)',
    description: 'Theo designs technical architecture and system design',
  },
  ux: {
    type: 'ux',
    initials: 'LU',
    name: 'UX Designer',
    color: 'hsl(335, 70%, 58%)',
    description: 'Luna creates user experience designs and wireframes',
  },
  sm: {
    type: 'sm',
    initials: 'SG',
    name: 'Scrum Master',
    color: 'hsl(160, 70%, 42%)',
    description: 'Sage manages agile processes and creates backlogs',
  },
};

export const AGENT_NAMES: Record<AgentType, string> = {
  ba: "Nova",
  pm: "Max",
  ux: "Luna",
  architect: "Theo",
  sm: "Sage",
};

export const AGENT_ROLES: Record<AgentType, string> = {
  ba: "Business Analyst Lead",
  pm: "Product Manager",
  ux: "UX Designer",
  architect: "Technical Architect",
  sm: "Scrum Master",
};

export const AGENT_INITIALS: Record<AgentType, string> = {
  ba: "NO",
  pm: "MX",
  ux: "LU",
  architect: "TH",
  sm: "SG",
};

export const PHASE_TO_AGENT_MAP: Record<string, AgentType> = {
  'project-brief': 'ba',
  'prd': 'pm',
  'ux-spec': 'ux',
  'architecture': 'architect',
  'backlog': 'sm',
};

export const AGENT_TO_PHASE_MAP: Record<AgentType, string> = {
  ba: 'project-brief',
  pm: 'prd',
  ux: 'ux-spec',
  architect: 'architecture',
  sm: 'backlog',
};

export const getAgentConfig = (agentType: AgentType | string): AgentConfig | undefined => {
  return AGENT_CONFIGS[agentType as AgentType];
};

export const getAllAgentConfigs = (): AgentConfig[] => {
  return Object.values(AGENT_CONFIGS);
};

export const getAgentColor = (agentType: AgentType): string => {
  const config = getAgentConfig(agentType);
  return config?.color || 'hsl(var(--muted))';
};
