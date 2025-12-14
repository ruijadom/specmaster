// Re-export from features for backwards compatibility
export { 
  AGENT_CONFIGS, 
  getAgentConfig, 
  getAllAgentConfigs, 
  PHASE_TO_AGENT_MAP,
  AGENT_TO_PHASE_MAP,
  getAgentColor 
} from "@/features/agents";
export type { AgentConfig, AgentType } from "@/features/agents";
