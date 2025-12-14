import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { agentRequests } from '../requests';
import type { AgentType, Message } from '../types';

interface UseAgentChatOptions {
  projectId?: string;
  onMessageSent?: () => void;
}

export const useAgentChat = ({ projectId, onMessageSent }: UseAgentChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>('ba');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await agentRequests.fetchMessages(projectId);
        setMessages(data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          agent: msg.agent as AgentType,
        })));
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load conversation history');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [projectId]);

  const getCurrentAgentMessages = useCallback(() => {
    return messages.filter(msg => msg.agent === currentAgent);
  }, [messages, currentAgent]);

  const sendMessage = useCallback(async (content: string, agent: AgentType, silent: boolean = false): Promise<string | null> => {
    if (!content.trim() || !projectId) return null;

    const userMessage: Message = { role: 'user', content, agent };
    
    if (!silent) {
      setMessages(prev => [...prev, userMessage]);
      
      try {
        await agentRequests.saveMessage(projectId, 'user', content, agent);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }
    
    setIsProcessing(true);
    setCurrentAgent(agent);

    try {
      const relevantMessages = messages.filter(m => m.agent === agent);
      const contextMessages = silent 
        ? [...relevantMessages.map(m => ({ role: m.role, content: m.content })), { role: 'user' as const, content }]
        : [...relevantMessages, userMessage].map(m => ({ role: m.role, content: m.content }));
      
      const response = await agentRequests.sendChatMessage(contextMessages, agent);

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant' && lastMessage?.agent === agent) {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: assistantContent,
                  };
                } else {
                  newMessages.push({
                    role: 'assistant',
                    content: assistantContent,
                    agent,
                  });
                }
                return newMessages;
              });
            }
          } catch (e) {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (assistantContent && projectId) {
        try {
          await agentRequests.saveMessage(projectId, 'assistant', assistantContent, agent);
          
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            await agentRequests.incrementUsage(userData.user.id);
            // Refresh subscription state after incrementing usage
            onMessageSent?.();
          }
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      }

      return assistantContent || null;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to communicate with agent. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [messages, projectId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const reloadMessages = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const data = await agentRequests.fetchMessages(projectId);
      setMessages(data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        agent: msg.agent as AgentType,
      })));
    } catch (error) {
      console.error('Error reloading messages:', error);
      toast.error('Failed to reload conversation');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    messages: getCurrentAgentMessages(),
    allMessages: messages,
    isProcessing,
    isLoading,
    currentAgent,
    sendMessage,
    clearMessages,
    reloadMessages,
    setCurrentAgent,
  };
};
