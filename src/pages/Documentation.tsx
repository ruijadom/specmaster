import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Rocket, 
  FolderKanban, 
  Sparkles, 
  FileText, 
  Settings, 
  CreditCard,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Target,
  Users,
  Layers,
  GitBranch,
  CheckCircle2,
  PlayCircle,
  Moon,
  Star,
  Globe,
  Stars,
  Zap,
  BookOpen,
  MessageSquare,
  Download,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation sections
const sections = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "mission-control", label: "Mission Control", icon: Sparkles },
  { id: "agents", label: "AI Agents", icon: Users },
  { id: "phases", label: "Phases & Workflow", icon: Layers },
  { id: "documents", label: "Documentation", icon: FileText },
  { id: "integrations", label: "Integrations", icon: GitBranch },
  { id: "account", label: "Account & Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];

// Agent data
const agents = [
  {
    name: "Nova",
    role: "Business Analyst Lead",
    initials: "NO",
    color: "hsl(210, 80%, 55%)",
    icon: Sparkles,
    phase: "Ideation",
    output: "Project Brief",
    description: "Nova helps you articulate your vision, identify pain points, define user personas, and create a comprehensive project brief. She asks probing questions to understand the 'what' and 'why' behind your project.",
    capabilities: ["Pain Points Analysis", "User Personas", "Value Proposition", "Market Analysis"]
  },
  {
    name: "Max",
    role: "Product Manager",
    initials: "MX",
    color: "hsl(280, 60%, 60%)",
    icon: Star,
    phase: "Planning",
    output: "PRD (Product Requirements Document)",
    description: "Max transforms your project brief into a detailed PRD with clear requirements, success metrics, and feature prioritization. He ensures your product vision is actionable.",
    capabilities: ["User Stories", "Success Metrics", "Feature Prioritization"]
  },
  {
    name: "Luna",
    role: "UX Designer",
    initials: "LU",
    color: "hsl(335, 70%, 58%)",
    icon: Moon,
    phase: "Planning",
    output: "UX Specification",
    description: "Luna focuses on the user experience, creating wireframe descriptions, user flows, and design system recommendations. She ensures your product is intuitive and delightful.",
    capabilities: ["Wireframes", "User Flows", "Design System"]
  },
  {
    name: "Theo",
    role: "Technical Architect",
    initials: "TH",
    color: "hsl(25, 75%, 55%)",
    icon: Globe,
    phase: "Architecture",
    output: "Technical Architecture",
    description: "Theo designs the technical foundation of your project, recommending tech stacks, data models, and API structures. He ensures scalability and maintainability.",
    capabilities: ["Tech Stack", "Data Model", "API Design"]
  },
  {
    name: "Sage",
    role: "Scrum Master",
    initials: "SG",
    color: "hsl(160, 70%, 42%)",
    icon: Stars,
    phase: "Backlog",
    output: "Product Backlog",
    description: "Sage transforms all your documentation into an actionable backlog with user stories, acceptance criteria, and sprint planning. Ready to sync with Jira or Linear.",
    capabilities: ["Backlog Refinement", "Acceptance Criteria", "Sprint Planning"]
  }
];

// Phases data
const phases = [
  {
    name: "Ideation",
    agent: "Nova",
    description: "Explore and define the core vision of your project. Identify pain points, user personas, and value proposition.",
    outputs: ["Project Brief", "Pain Points Analysis", "User Personas", "Value Proposition"]
  },
  {
    name: "Planning",
    agents: ["Max", "Luna"],
    description: "Define detailed requirements and design the user experience. Create PRD and UX specifications.",
    outputs: ["PRD", "User Stories", "Wireframes", "User Flows", "Success Metrics"]
  },
  {
    name: "Architecture",
    agent: "Theo",
    description: "Design the technical infrastructure. Define tech stack, data models, and API contracts.",
    outputs: ["Tech Stack Recommendation", "Data Model", "API Design", "System Architecture"]
  },
  {
    name: "Backlog",
    agent: "Sage",
    description: "Generate user stories and tasks ready for development. Sync with your project management tools.",
    outputs: ["User Stories", "Acceptance Criteria", "Sprint Planning", "Task Breakdown"]
  }
];

const Documentation = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <DashboardLayout>
      <MainHeader
        title="Documentation"
        description="Learn how to use SpecMaster to transform your ideas into production-ready specs"
      />
      
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex w-64 border-r border-border flex-col shrink-0">
          <ScrollArea className="flex-1 py-4">
            <nav className="px-4 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {section.label}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-16">
            
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Overview</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Welcome to SpecMaster
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    SpecMaster is an AI-powered platform that transforms your product ideas into 
                    production-ready specifications. Using autonomous AI agents, we guide you through 
                    a structured workflow—from a rough vision to an actionable backlog in minutes.
                  </p>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Why SpecMaster?</h3>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span><strong>Save time:</strong> Generate complete documentation in minutes, not days</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span><strong>Structured approach:</strong> Follow a proven methodology from ideation to backlog</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span><strong>AI-powered:</strong> Specialized agents for each phase of product development</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span><strong>Integration ready:</strong> Sync your backlog directly to Jira or Linear</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => scrollToSection("getting-started")}>
                    <CardContent className="pt-6">
                      <Rocket className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Quick Start</h3>
                      <p className="text-sm text-muted-foreground">Create your first project in under 5 minutes</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => scrollToSection("mission-control")}>
                    <CardContent className="pt-6">
                      <Sparkles className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Mission Control</h3>
                      <p className="text-sm text-muted-foreground">Your central hub for AI collaboration</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => scrollToSection("agents")}>
                    <CardContent className="pt-6">
                      <Users className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">Meet the Agents</h3>
                      <p className="text-sm text-muted-foreground">5 specialized AI agents for every phase</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Getting Started Section */}
            <section id="getting-started" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Getting Started</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Create Your First Project
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Follow these simple steps to transform your idea into production-ready specifications.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Create an Account",
                      description: "Sign up with your email or continue with Google. The free plan gives you access to 2 agents and 10 interactions per month."
                    },
                    {
                      step: 2,
                      title: "Start a New Project",
                      description: "Click 'New Project' and give your project a name. Add an optional description to provide context for the AI agents."
                    },
                    {
                      step: 3,
                      title: "Enter Mission Control",
                      description: "You'll be taken to Mission Control where Nova, the Business Analyst, will greet you and start asking questions about your project."
                    },
                    {
                      step: 4,
                      title: "Collaborate with AI Agents",
                      description: "Chat naturally with each agent. They'll ask clarifying questions to understand your vision and generate insights along the way."
                    },
                    {
                      step: 5,
                      title: "Generate Documentation",
                      description: "Once you've had enough conversation, generate phase documentation. Each agent produces specific deliverables."
                    },
                    {
                      step: 6,
                      title: "Export or Sync",
                      description: "Download your documentation as PDF/Markdown or sync your backlog directly to Jira or Linear."
                    }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {item.step}
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => navigate("/projects?new=true")} className="mt-4">
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Your First Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Projects Section */}
            <section id="projects" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Projects</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Managing Your Projects
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    The Projects page is your home base for managing all your product initiatives.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Cards</CardTitle>
                    <CardDescription>Each project card shows:</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Project name and creation date</span>
                        <p className="text-sm text-muted-foreground">Quick identification of your projects</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Agent progress indicators</span>
                        <p className="text-sm text-muted-foreground">Colored avatars show which phases are completed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Quick actions</span>
                        <p className="text-sm text-muted-foreground">Resume in Mission Control or view generated documents</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Mission Control Section */}
            <section id="mission-control" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Mission Control</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Your AI Collaboration Hub
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Mission Control is the heart of SpecMaster—where you collaborate with AI agents 
                    to develop your product specifications.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Chat Interface
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Have natural conversations with AI agents. They understand context and ask 
                      clarifying questions to build comprehensive documentation.
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Phase Selector
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Switch between phases (Ideation, Planning, Architecture, Backlog) using 
                      the dropdown. Phases unlock progressively as you complete them.
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Analysis Panel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      The right sidebar shows available analyses that unlock as your conversation 
                      progresses. Run analyses to generate specific insights.
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Document Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      When you've collected enough insights, generate the phase documentation. 
                      Each agent produces specific deliverables for their phase.
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-2">Pro Tips</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Have at least 6-8 messages before generating documentation</li>
                          <li>• Use the lightbulb button to get suggestions on what to discuss next</li>
                          <li>• Run analyses to unlock deeper insights</li>
                          <li>• You can reset a phase conversation and start over if needed</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* AI Agents Section */}
            <section id="agents" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">AI Agents</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Meet Your AI Team
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    SpecMaster features 5 specialized AI agents, each an expert in their domain. 
                    They work together to transform your idea into a complete product specification.
                  </p>
                </div>

                <div className="space-y-4">
                  {agents.map((agent) => (
                    <Card key={agent.name} className="overflow-hidden">
                      <div className="flex">
                        <div 
                          className="w-2 shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                style={{ backgroundColor: agent.color }}
                              >
                                <agent.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{agent.name}</h3>
                                <p className="text-sm text-muted-foreground">{agent.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{agent.phase}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">Outputs: {agent.output}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {agent.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {agent.capabilities.map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Phases Section */}
            <section id="phases" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Phases & Workflow</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    The SpecMaster Workflow
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    SpecMaster follows a structured methodology that takes you from raw idea to 
                    development-ready backlog. Each phase builds on the previous one.
                  </p>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border hidden md:block" />
                  
                  <div className="space-y-8">
                    {phases.map((phase, index) => (
                      <div key={phase.name} className="relative pl-0 md:pl-12">
                        {/* Timeline dot */}
                        <div className="absolute left-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm hidden md:flex">
                          {index + 1}
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2 mb-2 md:hidden">
                              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                              </div>
                            </div>
                            <CardTitle className="flex items-center gap-2">
                              {phase.name}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-normal text-muted-foreground">
                                {'agent' in phase ? phase.agent : phase.agents?.join(" & ")}
                              </span>
                            </CardTitle>
                            <CardDescription>{phase.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {phase.outputs.map((output) => (
                                <Badge key={output} variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {output}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Documentation Section */}
            <section id="documents" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Documentation</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Project Documentation
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    All generated documentation is saved and accessible from the Project Documents page.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Phase Documents</CardTitle>
                      <CardDescription>Main deliverables from each phase</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Project Brief</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Product Requirements Document (PRD)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>UX Specification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Technical Architecture</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Product Backlog</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Analysis Reports</CardTitle>
                      <CardDescription>Deep-dive analyses from AI agents</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        <span>Pain Points Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>User Personas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>Value Proposition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>Market Analysis</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      Export Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Download your documentation in multiple formats:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">TXT</Badge>
                      <Badge variant="outline">Markdown</Badge>
                      <Badge variant="outline">PDF</Badge>
                    </div>
                    <p className="mt-3">You can download individual documents or all documentation at once.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Integrations Section */}
            <section id="integrations" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Integrations</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Connect Your Tools
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Sync your generated backlog directly to your project management tools.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-[#0052CC]/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#0052CC]/10 flex items-center justify-center">
                          <svg className="h-5 w-5 text-[#0052CC]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.53 2c0 2.4 1.97 4.37 4.37 4.37h.1v4.27c-2.4 0-4.37 1.97-4.37 4.37v4.99c-2.4 0-4.37-1.97-4.37-4.37V2h4.27zm.1 10.64c0-2.4-1.97-4.37-4.37-4.37H2v4.27c0 2.4 1.97 4.37 4.37 4.37V22h4.27v-4.99c2.4 0 4.37-1.97 4.37-4.37h-3.38z"/>
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Jira</CardTitle>
                          <CardDescription>Premium plan required</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Connect your Jira account</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Select or create Jira projects</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Sync user stories as Jira issues</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Check sync status in real-time</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-[#5E6AD2]/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#5E6AD2]/10 flex items-center justify-center">
                          <svg className="h-5 w-5 text-[#5E6AD2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Linear</CardTitle>
                          <CardDescription>Premium plan required</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Connect with Linear API key</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Select your Linear team</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Create issues from your backlog</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Track synchronization status</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Button variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Integrations
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Account Section */}
            <section id="account" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Account & Billing</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    Subscription Plans
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Choose the plan that fits your needs. Upgrade anytime to unlock more features.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Free
                        <Badge variant="secondary">$0/mo</Badge>
                      </CardTitle>
                      <CardDescription>Get started for free</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>2 agents (BA, PM)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>10 messages/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>1 project</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Ideation phase only</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Pro
                        <Badge>$20/mo</Badge>
                      </CardTitle>
                      <CardDescription>For growing projects</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>4 agents (BA, PM, UX, Architect)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>100 messages/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Unlimited projects</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Ideation, Planning, Architecture</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Premium
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">$50/mo</Badge>
                      </CardTitle>
                      <CardDescription>For professional teams</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>All 5 agents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Unlimited messages</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>All phases</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Jira & Linear integrations</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => navigate("/pricing")}>
                    View Pricing Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/account")}>
                    Manage Subscription
                  </Button>
                </div>
              </div>
            </section>

            {/* Settings Section */}
            <section id="settings" className="scroll-mt-8">
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4">Settings</Badge>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">
                    App Settings
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Configure your integrations and account preferences.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <GitBranch className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Integrations</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect and manage your Jira and Linear integrations. Configure API keys and default projects/teams.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <PlayCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Theme</h4>
                        <p className="text-sm text-muted-foreground">
                          Switch between light, dark, or system theme from the user menu in the sidebar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Button>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-border pt-8 mt-16">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-4">Need help? Have questions?</p>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Documentation;

