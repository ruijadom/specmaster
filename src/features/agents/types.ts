export type AgentType = 'ba' | 'pm' | 'ux' | 'architect' | 'sm';

export interface AgentConfig {
  type: AgentType;
  initials: string;
  name: string;
  color: string;
  description: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentType;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: string;
  content: string;
  agent: string;
  created_at: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  minMessages: number;
  prompt: string;
}

export type AgentRequiredTier = 'free' | 'pro' | 'premium';

export const AGENT_REQUIRED_TIER: Record<AgentType, AgentRequiredTier> = {
  ba: 'free',
  pm: 'free',
  ux: 'pro',
  architect: 'pro',
  sm: 'premium',
};

export const TIER_LABELS: Record<AgentRequiredTier, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};
