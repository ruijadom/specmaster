/**
 * AI Provider Configuration
 * 
 * Change the AI_PROVIDER value to switch between providers:
 * - 'lovable-ai': Uses Lovable AI Gateway (default, no extra setup needed)
 * - 'openai': Uses OpenAI directly (requires OPENAI_API_KEY secret)
 * - 'gemini': Uses Google Gemini directly (requires GEMINI_API_KEY secret)
 */

export type AIProvider = 'lovable-ai' | 'openai' | 'gemini';

// ⚙️ CHANGE THIS TO SWITCH PROVIDERS
export const AI_PROVIDER: AIProvider = 'gemini';

// Provider configurations
export const PROVIDER_CONFIG = {
  'lovable-ai': {
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    model: 'google/gemini-2.5-flash',
    secretKey: 'LOVABLE_API_KEY',
  },
  'openai': {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    secretKey: 'OPENAI_API_KEY',
  },
  'gemini': {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    model: 'gemini-2.0-flash-exp',
    secretKey: 'GEMINI_API_KEY',
  },
} as const;

export function getProviderConfig(provider: AIProvider = AI_PROVIDER) {
  return PROVIDER_CONFIG[provider];
}
