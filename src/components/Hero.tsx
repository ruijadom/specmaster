import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, PlayCircle, FolderOpen, Search, Users, Settings2, ArrowLeft, FileText, Sparkles, MoreHorizontal, ChevronDown, CheckCircle2, Circle, ChevronRight, Lightbulb, ArrowUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartProject = () => {
    if (user) {
      navigate("/projects?new=true");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-grid-bg pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-6 py-32">
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-default">
            <Zap className="h-4 w-4" />
            <span className="tracking-wide">AI-Powered Product Development</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground mb-8 leading-[1.1]">
            Transform ideas into
            <br />
            <span className="text-brand-gradient">production-ready specs</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 font-light">
            Orchestrate autonomous AI agents to generate complete project documentation—from hazy vision to actionable backlog in minutes.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-20">
            <Button 
              size="lg" 
              onClick={handleStartProject}
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-foreground text-background text-lg font-medium hover:bg-foreground/90 transition-all duration-300 shadow-[0_0_20px_hsl(var(--foreground)/0.3)] hover:shadow-[0_0_30px_hsl(var(--foreground)/0.4)]"
            >
              Start your project
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto h-14 px-8 rounded-full border-border/50 bg-card/50 text-muted-foreground text-lg font-medium hover:bg-card hover:text-foreground hover:border-border transition-all duration-300 backdrop-blur-md"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              See how it works
            </Button>
          </div>

          {/* Mission Control UI Mockup */}
          <div className="relative w-full max-w-6xl mx-auto">
            {/* Glow behind visual */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 rounded-2xl blur-2xl opacity-20 animate-pulse" />
            
            {/* Main Interface Container */}
            <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl flex h-[680px] text-left">
              
              {/* 1. Left Icon Sidebar */}
              <div className="hidden md:flex w-14 border-r border-border flex-col items-center py-5 gap-6 bg-card">
                {/* Brand/Home */}
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-[0_0_10px_hsl(var(--primary)/0.3)]">sm</div>
                
                {/* Nav Items */}
                <div className="flex flex-col gap-6 mt-2">
                  <button className="text-foreground opacity-100 relative group">
                    <FolderOpen className="w-5 h-5" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-8 bg-foreground rounded-r-full" />
                  </button>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                  <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    <Settings2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom User */}
                <div className="mt-auto pb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-medium text-primary">RU</div>
                </div>
              </div>

              {/* 2. Main Content Column */}
              <div className="flex-1 flex flex-col bg-card min-w-0">
                
                {/* Header */}
                <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-foreground truncate text-sm">building houses</span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-muted-foreground border border-border">Ideation</span>
                    <span className="hidden lg:inline text-[11px] text-muted-foreground/50">Mission Control • Updated just now</span>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button className="hidden sm:flex text-xs font-medium text-muted-foreground hover:text-foreground items-center gap-2 px-3 py-1.5 rounded hover:bg-accent transition-colors">
                      <FileText className="w-3.5 h-3.5" /> 
                      View Documents
                    </button>
                    <button className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded flex items-center gap-2 transition-colors hover:bg-emerald-500/20">
                      <Sparkles className="w-3.5 h-3.5" /> 
                      Analyses 
                      <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">4</span>
                    </button>
                    <button className="text-muted-foreground hover:text-foreground p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Toolbar & Dropdowns */}
                <div className="h-14 border-b border-border flex items-center px-6 gap-3 relative z-30 shrink-0">
                  
                  {/* Dropdown 1: Phase (Active) */}
                  <div className="relative">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground shadow-sm">
                      Ideation 
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Expanded Menu Mockup */}
                    <div className="absolute top-full mt-2 left-0 w-64 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col p-1.5 z-50">
                      {/* Item 1: Ideation (Selected) */}
                      <div className="flex items-center justify-between px-3 py-2 bg-accent rounded-lg text-sm text-foreground cursor-default">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">Ideation</span>
                        </div>
                      </div>
                      {/* Item 2: Planning */}
                      <button className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-lg text-sm text-muted-foreground group transition-colors text-left w-full">
                        <div className="flex items-center gap-3">
                          <Circle className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                          <span className="group-hover:text-foreground/80">Planning</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
                      </button>
                      {/* Item 3: Architecture */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <Circle className="w-4 h-4 text-muted-foreground/30" />
                          <span>Architecture</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground/50 px-1.5 py-0.5 rounded border border-border">Pro</span>
                      </div>
                      {/* Item 4: Backlog */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <Circle className="w-4 h-4 text-muted-foreground/30" />
                          <span>Backlog</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-primary/50 px-1.5 py-0.5 rounded border border-primary/10 bg-primary/5">Premium</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-4 w-px bg-border mx-1" />

                  {/* Dropdown 2: Agent */}
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all group">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Nova - Business Analyst
                    <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                  </button>
                </div>

                {/* Scrollable Document Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                  <div className="max-w-3xl mx-auto space-y-8">
                    
                    {/* Section 1 */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Problem with Reactive Issue Notification:</h3>
                          <div className="pl-0 space-y-4">
                            <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm leading-relaxed text-muted-foreground">
                              <span className="text-foreground/80 font-medium">Frustration:</span>{" "}
                              He receives project updates only at pre-scheduled, infrequent intervals (e.g., weekly meetings), often after problems have already escalated. This "Lack of Transparency" means he cannot proactively address issues or make timely strategic decisions.
                              
                              {/* Sub-agent badges */}
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                                  <CheckCircle2 className="w-3 h-3" /> PRD
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs">
                                  <Sparkles className="w-3 h-3" /> UX Design
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2">Missing Information Gathering:</h3>
                          <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm leading-relaxed text-muted-foreground">
                            <span className="text-foreground/80 font-medium">Frustration:</span>{" "}
                            He is forced to "Time Spent Chasing Updates" from project managers or engineers, distracting him from his primary investment responsibilities.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Text */}
                    <div className="pt-4 border-t border-border text-sm text-muted-foreground/60 leading-relaxed italic">
                      This explicit articulation drives home the "why" behind your app even more clearly. It shows precisely where the gaps in existing methods lie.
                    </div>
                  </div>
                </div>

                {/* Chat Input Area */}
                <div className="p-6 border-t border-border bg-card z-20">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-muted border border-border rounded-2xl p-2 pl-4 flex items-center gap-3 shadow-lg">
                      <Lightbulb className="w-4 h-4 text-muted-foreground/50" />
                      <input type="text" placeholder="Ask Nova to refine the user flow..." className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder-muted-foreground/40 h-10" readOnly />
                      <div className="text-[10px] text-muted-foreground/50 font-mono hidden sm:block mr-2">19 messages left</div>
                      <button className="w-9 h-9 rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground flex items-center justify-center transition-colors">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-center mt-3">
                      <p className="text-[10px] text-muted-foreground/50">AI can make mistakes. Verify important info.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Right Analysis Panel */}
              <div className="hidden lg:flex w-80 border-l border-border bg-card flex-col shrink-0 z-20">
                <div className="h-14 border-b border-border flex items-center justify-between px-5 shrink-0">
                  <span className="text-[11px] font-semibold text-muted-foreground tracking-wider">AVAILABLE ANALYSES</span>
                  <span className="text-[10px] bg-muted border border-border text-muted-foreground/60 px-1.5 py-0.5 rounded">Auto-updating</span>
                </div>
                
                <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                  <div className="text-xs font-medium text-muted-foreground/60">Ready for review</div>
                  
                  {/* Analysis Card 1 */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border hover:border-border/80 transition-all group cursor-pointer shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <div className="p-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        Pain Points
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed line-clamp-2">Identify and analyze user pain points based on the documentation centralization issue.</p>
                    <button className="w-full py-2 rounded-lg bg-accent hover:bg-accent/80 text-[11px] font-medium text-muted-foreground transition-colors border border-border flex items-center justify-center gap-1 group/btn">
                      Run Analysis 
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  
                  {/* Analysis Card 2 */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border hover:border-border/80 transition-all group cursor-pointer shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        User Personas
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed line-clamp-2">Define detailed user personas for construction managers and site workers.</p>
                    <button className="w-full py-2 rounded-lg bg-accent hover:bg-accent/80 text-[11px] font-medium text-muted-foreground transition-colors border border-border flex items-center justify-center gap-1 group/btn">
                      Run Analysis 
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Analysis Card 3 */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border hover:border-border/80 transition-all group cursor-pointer shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        Value Proposition
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed line-clamp-2">Needs more details on competitive advantage.</p>
                    <button className="w-full py-2 rounded-lg bg-accent hover:bg-accent/80 text-[11px] font-medium text-muted-foreground transition-colors border border-border flex items-center justify-center gap-1 group/btn">
                      Run Analysis 
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Bottom Generate Button */}
                <div className="p-5 border-t border-border bg-card">
                  <div className="text-[10px] text-muted-foreground/60 mb-2 pl-1">Pending inputs</div>
                  <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900/80 dark:to-teal-900/80 hover:from-emerald-500 hover:to-teal-500 dark:hover:from-emerald-800/80 dark:hover:to-teal-800/80 border border-emerald-500/30 text-white dark:text-emerald-100 text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20 flex items-center justify-center gap-2 group">
                    <Sparkles className="w-4 h-4 text-emerald-100 dark:text-emerald-300" />
                    Generate Project Brief
                    <span className="bg-black/20 text-emerald-100/70 dark:text-emerald-200/70 text-[10px] px-1.5 rounded border border-white/10 ml-auto group-hover:bg-black/30 transition-colors">Enter</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
