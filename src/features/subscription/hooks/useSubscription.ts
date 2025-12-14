import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { subscriptionRequests } from '../requests';
import { 
  SubscriptionState, 
  UseSubscriptionReturn, 
  DEFAULT_SUBSCRIPTION_STATE 
} from '../types';

export const useSubscription = (): UseSubscriptionReturn => {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>(DEFAULT_SUBSCRIPTION_STATE);

  const checkSubscription = useCallback(async () => {
    if (!user || !session?.access_token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const data = await subscriptionRequests.checkSubscription(session.access_token);

      setState({
        tier: (data.tier as SubscriptionState['tier']) || 'free',
        subscribed: data.subscribed || false,
        subscriptionEnd: data.subscription_end || null,
        chatLimit: data.chat_limit ?? 20,
        docLimit: data.doc_limit ?? 2,
        projectLimit: data.project_limit ?? 1,
        chatUsage: data.chat_usage ?? 0,
        docUsage: data.doc_usage ?? 0,
        projectCount: data.project_count ?? 0,
        agentsAllowed: data.agents_allowed || ['ba', 'pm'],
        integrationsAllowed: data.integrations_allowed || false,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (tier: 'pro' | 'premium') => {
    if (!session) {
      throw new Error('You must be logged in to subscribe');
    }

    const data = await subscriptionRequests.createCheckout(tier, session.access_token);
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error('You must be logged in');
    }

    const data = await subscriptionRequests.openCustomerPortal(session.access_token);
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const canUseAgent = (agentId: string): boolean => {
    return state.agentsAllowed.includes(agentId);
  };

  const canUseIntegrations = (): boolean => {
    return state.integrationsAllowed;
  };

  const canSendMessage = (): boolean => {
    if (state.chatLimit === -1) return true;
    return state.chatUsage < state.chatLimit;
  };

  const canGenerateDocument = (): boolean => {
    return state.docUsage < state.docLimit;
  };

  const getRemainingMessages = (): number | 'unlimited' => {
    if (state.chatLimit === -1) return 'unlimited';
    return Math.max(0, state.chatLimit - state.chatUsage);
  };

  const getRemainingDocuments = (): number => {
    return Math.max(0, state.docLimit - state.docUsage);
  };

  const canCreateProject = (): boolean => {
    if (state.projectLimit === -1) return true;
    return state.projectCount < state.projectLimit;
  };

  const getRemainingProjects = (): number | 'unlimited' => {
    if (state.projectLimit === -1) return 'unlimited';
    return Math.max(0, state.projectLimit - state.projectCount);
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    canUseAgent,
    canUseIntegrations,
    canSendMessage,
    canGenerateDocument,
    canCreateProject,
    getRemainingMessages,
    getRemainingDocuments,
    getRemainingProjects,
  };
};
