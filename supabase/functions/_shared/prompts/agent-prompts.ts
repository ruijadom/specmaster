export type { AgentPrompt } from './types.ts';
import type { AgentPrompt } from './types.ts';
import { getAgentPrompt as loadAgentPrompt, preloadAgents } from '../agents-config/loader.ts';

// Legacy TypeScript imports kept for backwards compatibility
import { baPrompt } from './agents/ba.ts';
import { pmPrompt } from './agents/pm.ts';
import { uxPrompt } from './agents/ux.ts';
import { architectPrompt } from './agents/architect.ts';
import { smPrompt } from './agents/sm.ts';

// Initialize by preloading all agent configs from YAML
preloadAgents().catch(error => {
  console.error('Failed to preload agents:', error);
});

// Legacy record for backwards compatibility
export const AGENT_PROMPTS: Record<string, AgentPrompt> = {
  ba: baPrompt,
  pm: pmPrompt,
  uxdesigner: uxPrompt,
  architect: architectPrompt,
  sm: smPrompt,
};

/**
 * Get agent prompt from YAML configuration
 * Falls back to TypeScript definitions if YAML loading fails
 */
export const getAgentPrompt = async (agentId: string): Promise<string | null> => {
  try {
    const agent = await loadAgentPrompt(agentId);
    return agent ? agent.prompt : null;
  } catch (error) {
    console.warn(`Failed to load YAML config for ${agentId}, using TypeScript fallback:`, error);
    const agent = AGENT_PROMPTS[agentId];
    return agent ? agent.prompt : null;
  }
};

/**
 * Get agent name from YAML configuration
 * Falls back to TypeScript definitions if YAML loading fails
 */
export const getAgentName = async (agentId: string): Promise<string | null> => {
  try {
    const agent = await loadAgentPrompt(agentId);
    return agent ? agent.name : null;
  } catch (error) {
    console.warn(`Failed to load YAML config for ${agentId}, using TypeScript fallback:`, error);
    const agent = AGENT_PROMPTS[agentId];
    return agent ? agent.name : null;
  }
};

// Synchronous versions for backwards compatibility
export const getAgentPromptSync = (agentId: string): string | null => {
  const agent = AGENT_PROMPTS[agentId];
  return agent ? agent.prompt : null;
};

export const getAgentNameSync = (agentId: string): string | null => {
  const agent = AGENT_PROMPTS[agentId];
  return agent ? agent.name : null;
};
