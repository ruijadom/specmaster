import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage, AgentType } from "./types";

export const agentRequests = {
  fetchMessages: async (projectId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  saveMessage: async (
    projectId: string,
    role: 'user' | 'assistant',
    content: string,
    agent: AgentType
  ): Promise<void> => {
    const { error } = await supabase.from('chat_messages').insert({
      project_id: projectId,
      role,
      content,
      agent,
    });

    if (error) throw error;
  },

  deleteAgentMessages: async (projectId: string, agent: AgentType): Promise<void> => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('project_id', projectId)
      .eq('agent', agent);

    if (error) throw error;
  },

  sendChatMessage: async (messages: { role: string; content: string }[], agent: AgentType) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-agent`;
    
    // Get the current session token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated. Please sign in.');
    }
    
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        messages,
        agent,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add funds to continue.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response from agent');
    }

    return response;
  },

  incrementUsage: async (userId: string): Promise<void> => {
    await supabase.rpc('increment_usage', { p_user_id: userId });
  },
};
