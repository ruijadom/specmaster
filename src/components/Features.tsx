import { Card } from "@/components/ui/card";
import { useState } from "react";
import { 
  Brain, 
  GitBranch, 
  Layers, 
  MessageSquare, 
  Workflow,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Agent Orchestration",
    description: "Multiple specialized AI agents work together—Analyst, Product Manager, Architect, and Scrum Master—each handling their domain expertly.",
    color: "text-primary"
  },
  {
    icon: Workflow,
    title: "Structured Methodology",
    description: "Follow a proven structured workflow: Ideation → Planning → Architecture → Backlog. Each phase builds on the previous with context awareness.",
    color: "text-secondary"
  },
  {
    icon: Layers,
    title: "Living Documentation",
    description: "Documents evolve in real-time as you collaborate with agents. Edit, approve, and watch specs transform into actionable items.",
    color: "text-accent"
  },
  {
    icon: MessageSquare,
    title: "Natural Conversation",
    description: "No complex forms or rigid templates. Just describe your vision naturally and let agents ask clarifying questions.",
    color: "text-primary"
  },
  {
    icon: GitBranch,
    title: "Context Preservation",
    description: "Every decision, requirement, and architectural choice is captured and available as context for downstream phases.",
    color: "text-secondary"
  },
  {
    icon: Zap,
    title: "Export Anywhere",
    description: "Sync generated tasks directly to Jira, Linear, GitHub Issues, or Trello. Your backlog is deployment-ready instantly.",
    color: "text-accent"
  }
];

const Features = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="features" className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Workflows and integrations
          </h2>
          <p className="text-lg text-muted-foreground mb-3">
            Collaborate across tools and teams
          </p>
          <p className="text-base text-muted-foreground">
            Expand your capabilities with AI agents that keep everyone in your organization aligned and focused.
          </p>
        </div>

        {/* Feature Navigation */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`p-4 rounded-lg border transition-all duration-300 text-left ${
                  activeIndex === index
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/50 hover:border-border hover:bg-card/50'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                  activeIndex === index ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <feature.icon className={`h-4 w-4 transition-colors ${
                    activeIndex === index ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <h3 className={`text-sm font-medium transition-colors ${
                  activeIndex === index ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {feature.title}
                </h3>
              </button>
            ))}
          </div>
        </div>

        {/* Active Feature Display */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 border-border/50 bg-gradient-to-br from-card to-card/50 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 rounded-lg bg-primary/10 items-center justify-center">
                  {(() => {
                    const IconComponent = features[activeIndex].icon;
                    return <IconComponent className="h-6 w-6 text-primary" />;
                  })()}
                </div>
                <h3 className="text-2xl font-bold">{features[activeIndex].title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {features[activeIndex].description}
                </p>
              </div>
              
              {/* Visual representation */}
              <div className="relative h-64 md:h-80 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent" />
                {(() => {
                  const IconComponent = features[activeIndex].icon;
                  return <IconComponent className="h-32 w-32 text-primary/20 relative z-10" />;
                })()}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-secondary/20 to-transparent rounded-tl-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;
