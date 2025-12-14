import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs from Stripe
const PRODUCT_IDS = {
  pro: "prod_TYX2uo7kSo3nCa",
  premium: "prod_TYX3YAj45BPsMN",
};

// Tier limits: chat_limit (messages/month), doc_limit (documents/month), project_limit
const TIER_LIMITS = {
  free: { 
    chat_limit: 20, 
    doc_limit: 2, 
    project_limit: 1,
    agents_allowed: ["ba", "pm"], 
    integrations_allowed: false 
  },
  pro: { 
    chat_limit: 150, 
    doc_limit: 15, 
    project_limit: -1, // unlimited
    agents_allowed: ["ba", "pm", "ux", "architect"], 
    integrations_allowed: false 
  },
  premium: { 
    chat_limit: -1, // unlimited
    doc_limit: 50, 
    project_limit: -1, // unlimited
    agents_allowed: ["ba", "pm", "ux", "architect", "sm"], 
    integrations_allowed: true 
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
        ...TIER_LIMITS.free,
        chat_usage: 0,
        doc_usage: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    // Handle expired/invalid sessions gracefully - return free tier instead of error
    if (userError || !userData.user?.email) {
      logStep("Auth error or no user, returning free tier", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
        ...TIER_LIMITS.free,
        chat_usage: 0,
        doc_usage: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get current usage
    const { data: usageData } = await supabaseClient.rpc('get_user_usage', { p_user_id: user.id });
    const { data: docUsageData } = await supabaseClient.rpc('get_user_document_usage', { p_user_id: user.id });
    
    // Get project count
    const { count: projectCount } = await supabaseClient
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const chatUsage = usageData || 0;
    const docUsage = docUsageData || 0;
    const projects = projectCount || 0;
    logStep("Usage fetched", { chatUsage, docUsage, projects });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning free tier");
      
      // Update local subscription record
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        tier: "free",
        status: "active",
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
        ...TIER_LIMITS.free,
        chat_usage: chatUsage,
        doc_usage: docUsage,
        project_count: projects,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let tier: keyof typeof TIER_LIMITS = "free";
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      
      // Handle current_period_end - it's a Unix timestamp (seconds)
      if (subscription.current_period_end) {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      // Get product ID - handle both string and object cases
      const priceData = subscription.items.data[0]?.price;
      let productId = "";
      if (priceData?.product) {
        productId = typeof priceData.product === "string" 
          ? priceData.product 
          : priceData.product.id;
      }
      
      logStep("Subscription product", { productId, priceId: priceData?.id });
      
      if (productId === PRODUCT_IDS.premium) {
        tier = "premium";
      } else if (productId === PRODUCT_IDS.pro) {
        tier = "pro";
      }
      logStep("Active subscription found", { tier, subscriptionId: subscription.id, productId });
    } else {
      logStep("No active subscription found");
    }

    // Update local subscription record
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscriptionId,
      tier: tier,
      status: "active",
      current_period_end: subscriptionEnd,
    }, { onConflict: "user_id" });

    const limits = TIER_LIMITS[tier];

    return new Response(JSON.stringify({
      subscribed: tier !== "free",
      tier,
      subscription_end: subscriptionEnd,
      ...limits,
      chat_usage: chatUsage,
      doc_usage: docUsage,
      project_count: projects,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});