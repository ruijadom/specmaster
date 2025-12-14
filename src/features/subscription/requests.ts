import { supabase } from "@/integrations/supabase/client";

export interface CheckSubscriptionResponse {
  tier: string;
  subscribed: boolean;
  subscription_end: string | null;
  chat_limit: number;
  doc_limit: number;
  project_limit: number;
  chat_usage: number;
  doc_usage: number;
  project_count: number;
  agents_allowed: string[];
  integrations_allowed: boolean;
}

export const subscriptionRequests = {
  checkSubscription: async (accessToken: string): Promise<CheckSubscriptionResponse> => {
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) throw error;
    return data;
  },

  createCheckout: async (tier: 'pro' | 'premium', accessToken: string): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { tier },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) throw error;
    return data;
  },

  openCustomerPortal: async (accessToken: string): Promise<{ url: string }> => {
    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) throw error;
    return data;
  },
};
