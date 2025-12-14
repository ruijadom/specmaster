import { useState, useEffect } from "react";
import WaitlistNavbar from "@/components/WaitlistNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  CheckCircle2, 
  Users,
  Infinity,
  BrainCircuit,
  GitBranch,
  Layers,
  MessageSquare,
  History,
  Share2,
  Stars,
  Heart
} from "lucide-react";

// Launch date - adjust as needed
// Calculate 35 days from now
const LAUNCH_DATE = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);

const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-lg">
        <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary/20 rounded-full blur-sm" />
    </div>
    <span className="text-xs md:text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wider">{label}</span>
  </div>
);

const featureCards = [
  {
    icon: BrainCircuit,
    title: "AI Orchestration",
    description: "Multiple specialized AI agents working in harmony to plan, critique, and refine specifications.",
    color: "violet"
  },
  {
    icon: GitBranch,
    title: "Structured Methodology",
    description: "Guided workflows that ensure every edge case is considered before development starts.",
    color: "blue"
  },
  {
    icon: Layers,
    title: "Living Documentation",
    description: "Specs that evolve with your product. Never let your documentation go stale again.",
    color: "rose"
  },
  {
    icon: MessageSquare,
    title: "Natural Conversation",
    description: "Chat with your project data naturally. Ask questions, request changes, and get instant answers.",
    color: "teal"
  },
  {
    icon: History,
    title: "Context Preservation",
    description: "The AI remembers every decision, meeting note, and requirement change throughout the lifecycle.",
    color: "amber"
  },
  {
    icon: Share2,
    title: "Export Anywhere",
    description: "Seamlessly export your specs to JIRA tickets, PDF documents, or Markdown.",
    color: "cyan"
  }
];

const colorClasses: Record<string, { bg: string; bgHover: string; text: string }> = {
  violet: { bg: "bg-violet-500/10", bgHover: "group-hover:bg-violet-500/20", text: "text-violet-500 dark:text-violet-400" },
  blue: { bg: "bg-blue-500/10", bgHover: "group-hover:bg-blue-500/20", text: "text-blue-500 dark:text-blue-400" },
  rose: { bg: "bg-rose-500/10", bgHover: "group-hover:bg-rose-500/20", text: "text-rose-500 dark:text-rose-400" },
  teal: { bg: "bg-teal-500/10", bgHover: "group-hover:bg-teal-500/20", text: "text-teal-500 dark:text-teal-400" },
  amber: { bg: "bg-amber-500/10", bgHover: "group-hover:bg-amber-500/20", text: "text-amber-500 dark:text-amber-400" },
  cyan: { bg: "bg-cyan-500/10", bgHover: "group-hover:bg-cyan-500/20", text: "text-cyan-500 dark:text-cyan-400" }
};

const FeatureCard = ({ icon: Icon, title, description, color }: typeof featureCards[0]) => {
  const colors = colorClasses[color];
  return (
    <div className="w-[350px] p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors group flex flex-col flex-shrink-0">
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-4 ${colors.bgHover} transition-colors`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const countdown = useCountdown(LAUNCH_DATE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email }]);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Email already registered",
            description: "This email is already on the waitlist!",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Send confirmation email
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject: 'You\'re on the SpecMaster Waitlist! 🎉',
              template: 'waitlist',
              templateData: {
                email: email,
              }
            }
          });
        } catch (emailError) {
          console.error("Error sending waitlist email:", emailError);
        }

        setIsSuccess(true);
        setEmail("");
        toast({
          title: "Success!",
          description: "You've been added to the waitlist.",
        });
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Error",
        description: "Unable to register email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary overflow-x-hidden min-h-screen">
      {/* Background Elements */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[500px] hero-glow pointer-events-none z-0" />

      {/* Navigation */}
      <WaitlistNavbar />

      <main className="relative z-10 flex flex-col items-center w-full pt-32 pb-20">
        
        {/* Hero Section */}
        <div className="w-full px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-8 hover:bg-primary/15 transition-colors cursor-default opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <Sparkles className="w-3 h-3" />
            <span>Coming Soon</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1] opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            The future of product <br />
            <span className="text-gradient-purple">is being compiled.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-light leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            We are fine-tuning the 5 AI agents that will build your next product. Join the waitlist to get early access before the public release.
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <CountdownUnit value={countdown.days} label="Days" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-1.5rem]">:</span>
            <CountdownUnit value={countdown.hours} label="Hours" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-1.5rem]">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-1.5rem]">:</span>
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </div>

          {/* Email Capture */}
          <div className="w-full max-w-md mx-auto mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {!isSuccess ? (
              <>
                <form 
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-border focus-within:border-primary/50 transition-colors shadow-lg shadow-primary/5"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-2 text-sm h-10"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    className="btn-shine whitespace-nowrap px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      "Join Waitlist"
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                  <span className="text-foreground font-medium">Join 2,000+</span> professionals already on the list. No spam, ever.
                </p>
              </>
            ) : (
              <div className="p-8 bg-card rounded-2xl border border-primary/30 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">You're on the list!</h3>
                <p className="text-muted-foreground text-sm">
                  We'll notify you as soon as specmaster is ready for launch.
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 mt-16 pt-8 border-t border-border/50 w-full max-w-3xl opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-col items-center gap-1 group">
              <span className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">5</span>
              <span className="text-sm text-muted-foreground font-medium">AI Agents</span>
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <span className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400 transition-colors">10x</span>
              <span className="text-sm text-muted-foreground font-medium">Faster Specs</span>
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <span className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                <Infinity className="w-8 h-8" />
              </span>
              <span className="text-sm text-muted-foreground font-medium">Possibilities</span>
            </div>
          </div>
        </div>

        {/* Workflows Section (Carousel) */}
        <div className="w-full mt-32 overflow-hidden">
          <div className="text-center mb-12 px-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-4">Workflows and integrations</h2>
            <p className="text-muted-foreground text-lg">Collaborate across tools and teams</p>
            <p className="text-muted-foreground/70 text-sm mt-2">Expand your capabilities with AI agents that keep everyone in your organization aligned.</p>
          </div>

          <div className="relative w-full carousel-mask">
            {/* Carousel Track */}
            <div className="flex animate-scroll w-max pause gap-6 py-4">
              {/* Items Set 1 */}
              <div className="flex gap-6 items-stretch">
                {featureCards.map((card, index) => (
                  <FeatureCard key={`set1-${index}`} {...card} />
                ))}
              </div>
              {/* Items Set 2 (Duplicate for Loop) */}
              <div className="flex gap-6 items-stretch">
                {featureCards.map((card, index) => (
                  <FeatureCard key={`set2-${index}`} {...card} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-4xl mx-auto mt-32 mb-10 px-6">
          <div className="relative rounded-3xl bg-card border border-border/50 p-12 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
                <Users className="w-3 h-3" />
                <span>Join 2,000+ professionals</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-6">
                Ready to Transform Your Workflow?
              </h2>
              
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                Don't miss the opportunity to be among the first to experience the future of project specification.
              </p>

              {!isSuccess && (
                <Button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="btn-shine px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center gap-2 text-lg shadow-xl shadow-primary/20 h-12"
                >
                  <Stars className="w-5 h-5" />
                  Join the Waitlist Now
                </Button>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border/50 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">spec<span className="text-primary">master</span></span>
          </div>
          
          <span className="text-xs text-muted-foreground/60">© 2025 Specmaster. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
