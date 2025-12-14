import { Button } from "@/components/ui/button";
import { Lock, Unlock, TrendingUp, Users, Target, FileText, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import type { AgentType, Message, Capability } from "../types";

const AGENT_CAPABILITIES: Record<AgentType, Capability[]> = {
  ba: [
    {
      id: "pain-points",
      name: "Pain Points Analysis",
      description: "Identify and analyze user pain points",
      icon: <AlertCircle className="h-4 w-4" />,
      minMessages: 6,
      prompt: "Based on our discussion so far, please help me explicitly identify and understand the specific frustrations and problems our target users face with existing solutions. Let's create a comprehensive list of pain points with context and impact."
    },
    {
      id: "user-personas",
      name: "User Personas",
      description: "Define detailed user personas",
      icon: <Users className="h-4 w-4" />,
      minMessages: 10,
      prompt: "Now that we've identified the pain points, please create detailed user personas including demographics, goals, pain points, and behaviors. Make sure to incorporate the pain points we've discussed to create truly accurate personas."
    },
    {
      id: "value-proposition",
      name: "Value Proposition",
      description: "Craft the value proposition canvas",
      icon: <Sparkles className="h-4 w-4" />,
      minMessages: 12,
      prompt: "Please help me create a value proposition canvas that clearly articulates the unique value our solution brings to users, addressing the pain points we've identified."
    },
    {
      id: "market-analysis",
      name: "Market Analysis",
      description: "Request a comprehensive market analysis",
      icon: <TrendingUp className="h-4 w-4" />,
      minMessages: 14,
      prompt: "Based on our discussion so far, please provide a comprehensive market analysis including market size, trends, opportunities, and competitive landscape for our project."
    },
    {
      id: "competitor-analysis",
      name: "Competitor Analysis",
      description: "Analyze competitors and positioning",
      icon: <Target className="h-4 w-4" />,
      minMessages: 16,
      prompt: "Please analyze our main competitors, their strengths and weaknesses, and suggest how we can differentiate our solution in the market."
    }
  ],
  pm: [
    {
      id: "user-stories",
      name: "User Stories",
      description: "Generate comprehensive user stories",
      icon: <FileText className="h-4 w-4" />,
      minMessages: 8,
      prompt: "Based on our requirements discussion, please generate a comprehensive set of user stories with acceptance criteria for the main features."
    },
    {
      id: "success-metrics",
      name: "Success Metrics",
      description: "Define KPIs and success metrics",
      icon: <TrendingUp className="h-4 w-4" />,
      minMessages: 10,
      prompt: "Please help me define clear success metrics and KPIs to measure the product's performance and user satisfaction after launch."
    },
    {
      id: "feature-prioritization",
      name: "Feature Prioritization",
      description: "Prioritize features using frameworks",
      icon: <Target className="h-4 w-4" />,
      minMessages: 12,
      prompt: "Please help me prioritize the features we've discussed using a framework like MoSCoW or RICE, explaining the rationale for each priority level."
    },
    {
      id: "mvp-scope",
      name: "MVP Scope",
      description: "Define MVP scope and roadmap",
      icon: <Lightbulb className="h-4 w-4" />,
      minMessages: 14,
      prompt: "Based on our requirements, please help me define a clear MVP scope, explaining what should be in the first release and what can be deferred to future iterations."
    }
  ],
  ux: [
    {
      id: "wireframes",
      name: "Wireframes",
      description: "Create wireframe descriptions",
      icon: <FileText className="h-4 w-4" />,
      minMessages: 8,
      prompt: "Based on the PRD, please create detailed wireframe descriptions for the main screens and user flows, focusing on layout, components, and interactions."
    },
    {
      id: "user-flows",
      name: "User Flows",
      description: "Design user journey flows",
      icon: <Target className="h-4 w-4" />,
      minMessages: 10,
      prompt: "Please design the key user flows for our application, describing each step, decision point, and how users navigate between screens."
    },
    {
      id: "accessibility",
      name: "Accessibility Review",
      description: "Ensure WCAG compliance",
      icon: <Users className="h-4 w-4" />,
      minMessages: 12,
      prompt: "Please review the UX design for accessibility, ensuring WCAG 2.1 compliance and providing recommendations for keyboard navigation, screen readers, and color contrast."
    },
    {
      id: "design-system",
      name: "Design System",
      description: "Define design system tokens",
      icon: <Sparkles className="h-4 w-4" />,
      minMessages: 14,
      prompt: "Please help me establish a design system including color palettes, typography scale, spacing system, and component patterns for consistent UI."
    }
  ],
  architect: [
    {
      id: "tech-stack",
      name: "Tech Stack Recommendation",
      description: "Recommend optimal technology stack",
      icon: <Sparkles className="h-4 w-4" />,
      minMessages: 8,
      prompt: "Based on our requirements and constraints, please recommend a complete technology stack with justification for each choice."
    },
    {
      id: "data-model",
      name: "Data Model",
      description: "Design database schema and relationships",
      icon: <FileText className="h-4 w-4" />,
      minMessages: 10,
      prompt: "Please design a comprehensive data model including entity relationships, key attributes, and considerations for scalability."
    },
    {
      id: "api-design",
      name: "API Design",
      description: "Define API endpoints and contracts",
      icon: <Target className="h-4 w-4" />,
      minMessages: 12,
      prompt: "Please design the main API endpoints we'll need, including request/response formats and authentication considerations."
    },
    {
      id: "security-review",
      name: "Security Review",
      description: "Assess security requirements and risks",
      icon: <Lock className="h-4 w-4" />,
      minMessages: 14,
      prompt: "Please provide a security review covering authentication, authorization, data protection, and potential vulnerabilities we should address."
    }
  ],
  sm: [
    {
      id: "backlog-refinement",
      name: "Backlog Refinement",
      description: "Refine and prioritize backlog",
      icon: <FileText className="h-4 w-4" />,
      minMessages: 8,
      prompt: "Please help me refine the product backlog, breaking down epics into smaller stories and ensuring they follow INVEST principles."
    },
    {
      id: "acceptance-criteria",
      name: "Acceptance Criteria",
      description: "Define detailed acceptance criteria",
      icon: <Sparkles className="h-4 w-4" />,
      minMessages: 10,
      prompt: "Please create detailed acceptance criteria for the key user stories, ensuring they are testable and complete."
    },
    {
      id: "dependency-mapping",
      name: "Dependency Mapping",
      description: "Identify story dependencies",
      icon: <TrendingUp className="h-4 w-4" />,
      minMessages: 12,
      prompt: "Please analyze the user stories and identify dependencies between them, suggesting an optimal implementation sequence."
    },
    {
      id: "sprint-planning",
      name: "Sprint Planning",
      description: "Plan sprint with story points",
      icon: <Target className="h-4 w-4" />,
      minMessages: 14,
      prompt: "Please help me organize the user stories into a sprint plan with story point estimates and sprint goals."
    }
  ]
};

interface AgentCapabilitiesProps {
  currentAgent: AgentType;
  messages: Message[];
  onCapabilityClick: (prompt: string, analysisId: string) => void;
  isProcessing: boolean;
  savedAnalyses?: Set<string>;
}

export const AgentCapabilities = ({ 
  currentAgent, 
  messages, 
  onCapabilityClick, 
  isProcessing, 
  savedAnalyses = new Set() 
}: AgentCapabilitiesProps) => {
  const capabilities = AGENT_CAPABILITIES[currentAgent];
  const messageCount = messages.length;

  const isCapabilityUnlocked = (capability: Capability) => {
    if (messageCount < capability.minMessages) {
      return false;
    }
    
    if (capability.id === "market-analysis" && currentAgent === "ba") {
      return savedAnalyses.has("pain-points");
    }
    
    return true;
  };

  return (
    <div className="space-y-2">
      {capabilities.map((capability) => {
        const isUnlocked = isCapabilityUnlocked(capability);
        
        return (
          <div
            key={capability.id}
            className={`group p-4 rounded-lg border transition-all ${
              isUnlocked
                ? "border-border/20 bg-card hover:bg-muted/80 cursor-pointer"
                : "border-dashed border-border/80 bg-card/50 hover:bg-card cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                <div className="flex-shrink-0">
                  {capability.icon}
                </div>
                <span className="text-sm font-medium">{capability.name}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border ${
                isUnlocked 
                  ? "bg-green-500/10 text-green-500 border-green-500/10" 
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {isUnlocked ? (
                  <>
                    <Unlock className="w-3 h-3" strokeWidth={1.5} />
                    Ready
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" strokeWidth={1.5} />
                    {capability.id === "market-analysis" && currentAgent === "ba" && !savedAnalyses.has("pain-points")
                      ? "Save Pain Points first"
                      : `${capability.minMessages - messageCount} more`
                    }
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 pl-6">
              {capability.description}
            </p>
            {isUnlocked && (
              <Button
                size="sm"
                variant="outline"
                disabled={isProcessing}
                onClick={() => onCapabilityClick(capability.prompt, capability.id)}
                className="h-7 text-xs w-full"
              >
                Request Analysis
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { AGENT_CAPABILITIES };
