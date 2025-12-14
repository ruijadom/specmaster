import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getAgentPrompt } from "../_shared/prompts/agent-prompts.ts";
import { AI_PROVIDER, getProviderConfig } from "../_shared/ai-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid agent types
const VALID_AGENTS = ['ba', 'pm', 'ux', 'architect', 'sm'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('Authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', userData.user.id);

    const { messages, agent } = await req.json();

    // Validate agent type
    if (!agent || !VALID_AGENTS.includes(agent)) {
      return new Response(JSON.stringify({ error: `Invalid agent type. Must be one of: ${VALID_AGENTS.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit message count and content length
    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: 'Too many messages. Maximum is 100.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get provider configuration
    const providerConfig = getProviderConfig(AI_PROVIDER);
    const apiKey = Deno.env.get(providerConfig.secretKey);
    
    if (!apiKey) {
      throw new Error(`${providerConfig.secretKey} is not configured for provider: ${AI_PROVIDER}`);
    }

    console.log('Chat with agent:', agent, '| Provider:', AI_PROVIDER);
    
    // Clean up context messages to avoid wrong phase/identity bleed
    const rawMessages = (messages || []) as { role: string; content: string }[];
    let cleanedMessages = rawMessages;

    if (agent === 'sm') {
      // For Steve (Scrum Master), remove any previous assistant messages that talk about Architecture phase
      cleanedMessages = rawMessages.filter((m) => {
        if (m.role !== 'assistant') return true;
        const lower = m.content.toLowerCase();
        if (lower.includes('technical architect') ||
            lower.includes("i'm eve") ||
            lower.includes('architecture phase')) {
          console.log('Filtering out mismatched architecture message from SM context');
          return false;
        }
        return true;
      });
    }
    
    const agentPrompt = await getAgentPrompt(agent) || await getAgentPrompt('ba');

    // Prepare messages based on provider
    let requestBody: any;
    let headers: Record<string, string>;

    if (AI_PROVIDER === 'gemini') {
      // Gemini uses a different API format
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      };

      // Convert messages to Gemini format
      const contents = cleanedMessages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      requestBody = {
        contents: [
          { role: 'user', parts: [{ text: agentPrompt }] },
          ...contents
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      };
    } else {
      // OpenAI and Lovable AI use the same format
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      requestBody = {
        model: providerConfig.model,
        messages: [
          { role: 'system', content: agentPrompt },
          ...cleanedMessages
        ],
        stream: true,
      };
    }

    const response = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in chat-agent function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
