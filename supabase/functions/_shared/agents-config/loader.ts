import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

export interface AgentMetadata {
  id: string;
  name: string;
  title: string;
  icon: string;
  phase: string;
}

export interface AgentPersona {
  role: string;
  identity: string;
  communication_style: string;
  principles: string[];
}

export interface AgentConfig {
  metadata: AgentMetadata;
  persona: AgentPersona;
  responsibilities: string[];
  key_areas?: string[];
  approach: string[];
  critical_instructions: string;
}

export interface AgentDefinition {
  agent: AgentConfig;
}

export interface AgentPrompt {
  id: string;
  name: string;
  role: string;
  prompt: string;
}

// Cache for loaded agent definitions
const agentCache = new Map<string, AgentDefinition>();

export async function loadAgentConfig(agentId: string): Promise<AgentDefinition> {
  // Check cache first
  if (agentCache.has(agentId)) {
    return agentCache.get(agentId)!;
  }

  try {
    const yamlPath = new URL(`./${agentId}.yaml`, import.meta.url);
    const yamlContent = await Deno.readTextFile(yamlPath);
    const config = parse(yamlContent) as AgentDefinition;
    
    // Validate basic structure
    if (!config.agent || !config.agent.metadata || !config.agent.persona) {
      throw new Error(`Invalid agent configuration for ${agentId}`);
    }
    
    // Cache the result
    agentCache.set(agentId, config);
    
    return config;
  } catch (error) {
    console.error(`Error loading agent config for ${agentId}:`, error);
    throw new Error(`Failed to load agent configuration: ${agentId}`);
  }
}

export function buildPromptFromConfig(config: AgentConfig): string {
  const { metadata, persona, responsibilities, key_areas, approach, critical_instructions } = config;
  
  let prompt = `You are ${metadata.name}, ${persona.identity}\n\n`;
  
  prompt += `Your role:\n`;
  responsibilities.forEach(r => {
    prompt += `- ${r}\n`;
  });
  prompt += `\n`;
  
  if (key_areas && key_areas.length > 0) {
    prompt += `Key areas to explore:\n`;
    key_areas.forEach(area => {
      prompt += `- ${area}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Your approach:\n`;
  approach.forEach(a => {
    prompt += `- ${a}\n`;
  });
  prompt += `\n`;
  
  if (persona.principles && persona.principles.length > 0) {
    prompt += `Your principles:\n`;
    persona.principles.forEach(p => {
      prompt += `- ${p}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `CRITICAL: ${critical_instructions}`;
  
  return prompt;
}

export async function getAgentPrompt(agentId: string): Promise<AgentPrompt> {
  const definition = await loadAgentConfig(agentId);
  const config = definition.agent;
  
  return {
    id: config.metadata.id,
    name: config.metadata.name,
    role: config.metadata.title,
    prompt: buildPromptFromConfig(config),
  };
}

// Preload all agents on module initialization for better performance
export async function preloadAgents() {
  const agentIds = ['ba', 'pm', 'uxdesigner', 'architect', 'sm'];
  
  await Promise.all(
    agentIds.map(async (id) => {
      try {
        await loadAgentConfig(id);
        console.log(`✓ Preloaded agent: ${id}`);
      } catch (error) {
        console.error(`✗ Failed to preload agent ${id}:`, error);
      }
    })
  );
}
