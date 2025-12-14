import { useNavigate } from 'react-router-dom';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: 'For growing projects',
    icon: Zap,
    features: [
      { text: '4 agents included', included: true },
      { text: '100 interactions per month', included: true },
      { text: 'Ideation, Planning, Architecture', included: true },
      { text: 'Jira/Linear integrations', included: false },
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
    ],
    cta: 'Subscribe to Premium',
    popular: false,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Choose the plan that's right for you
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free and scale as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col transition-all duration-200 hover:shadow-lg',
                  plan.popular && 'border-primary shadow-lg md:scale-105'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
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
                    <span className="text-muted-foreground">/mês</span>
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
                    onClick={() => navigate('/pricing')}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="link" onClick={() => navigate('/pricing')}>
            View all plan details →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
