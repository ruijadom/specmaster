import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth';
import { useSubscription } from '@/features/subscription';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PricingGridSkeleton } from '@/components/PricingCardSkeleton';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Start exploring for free',
    icon: Sparkles,
    features: [
      { text: '2 agents: Business Analyst and UX', included: true },
      { text: '10 interactions per month', included: true },
      { text: 'Phases: Ideation', included: true },
      { text: 'Jira/Linear integrations', included: false },
      { text: 'Advanced phases', included: false },
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: 'For growing projects',
    icon: Zap,
    features: [
      { text: '4 agents: BA, UX, PM, Architect', included: true },
      { text: '100 interactions per month', included: true },
      { text: 'Phases: Ideation, Planning, Architecture', included: true },
      { text: 'Jira/Linear integrations', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Subscribe to Pro',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50,
    description: 'For professional teams',
    icon: Crown,
    features: [
      { text: 'All 5 agents included', included: true },
      { text: 'Unlimited interactions', included: true },
      { text: 'All phases available', included: true },
      { text: 'Jira/Linear integrations', included: true },
      { text: '24/7 priority support', included: true },
    ],
    cta: 'Subscribe to Premium',
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { tier, subscribed, loading: subLoading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Subscription activated!',
        description: 'Your subscription has been processed successfully.',
      });
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Checkout canceled',
        description: 'You can try again whenever you want.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, checkSubscription]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (planId === 'free') return;

    try {
      await createCheckout(planId as 'pro' | 'premium');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription',
        variant: 'destructive',
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open portal',
        variant: 'destructive',
      });
    }
  };

  const loading = authLoading || subLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="text-xl font-bold text-brand-gradient"
          >
            specmaster
          </button>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                  Projects
                </Button>
                {subscribed && (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose the plan that's right for you
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free and scale as you grow. Cancel anytime.
          </p>
        </div>

        {loading ? (
          <PricingGridSkeleton />
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isCurrentPlan = tier === plan.id;
              const PlanIcon = plan.icon;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col transition-all duration-200',
                    plan.popular && 'border-primary shadow-lg scale-105',
                    isCurrentPlan && 'ring-2 ring-primary'
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 right-4 bg-green-500">
                      Current Plan
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                      <PlanIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                          )}
                          <span className={cn(
                            'text-sm',
                            !feature.included && 'text-muted-foreground/50'
                          )}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || (plan.id === 'free' && !subscribed)}
                      onClick={() => {
                        if (isCurrentPlan && subscribed) {
                          handleManageSubscription();
                        } else {
                          handleSubscribe(plan.id);
                        }
                      }}
                    >
                      {isCurrentPlan
                        ? subscribed
                          ? 'Manage Plan'
                          : 'Current Plan'
                        : plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans at any time?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes are applied immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my usage limit?</h3>
              <p className="text-muted-foreground text-sm">
                When you reach your monthly limit, you'll need to upgrade to continue using the agents. The limit resets at the start of each month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel at any time through the management portal. You'll continue to have access until the end of the paid period.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}