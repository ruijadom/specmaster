export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionState {
  tier: SubscriptionTier;
  subscribed: boolean;
  subscriptionEnd: string | null;
  chatLimit: number;
  docLimit: number;
  projectLimit: number;
  chatUsage: number;
  docUsage: number;
  projectCount: number;
  agentsAllowed: string[];
  integrationsAllowed: boolean;
  loading: boolean;
  error: string | null;
}

export interface SubscriptionActions {
  checkSubscription: () => Promise<void>;
  createCheckout: (tier: 'pro' | 'premium') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  canUseAgent: (agentId: string) => boolean;
  canUseIntegrations: () => boolean;
  canSendMessage: () => boolean;
  canGenerateDocument: () => boolean;
  canCreateProject: () => boolean;
  getRemainingMessages: () => number | 'unlimited';
  getRemainingDocuments: () => number;
  getRemainingProjects: () => number | 'unlimited';
}

export type UseSubscriptionReturn = SubscriptionState & SubscriptionActions;

export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  tier: 'free',
  subscribed: false,
  subscriptionEnd: null,
  chatLimit: 20,
  docLimit: 2,
  projectLimit: 1,
  chatUsage: 0,
  docUsage: 0,
  projectCount: 0,
  agentsAllowed: ['ba', 'pm'],
  integrationsAllowed: false,
  loading: true,
  error: null,
};
