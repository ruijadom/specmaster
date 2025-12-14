// Re-export from features for backwards compatibility
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllAgentConfigs } from "@/features/agents";

const AgentRotation = () => {
  const [rotation, setRotation] = useState(0);
  const agents = getAllAgentConfigs();

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative w-80 h-80">
        {agents.map((agent, index) => {
          const angle = (360 / agents.length) * index + rotation;
          const radian = (angle * Math.PI) / 180;
          const radius = 140;
          const x = Math.cos(radian) * radius;
          const y = Math.sin(radian) * radius;

          return (
            <div
              key={agent.type}
              className="absolute top-1/2 left-1/2 transition-transform duration-50"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${1 + Math.sin(radian) * 0.2})`,
                opacity: 0.4 + (Math.sin(radian) + 1) * 0.3,
              }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-60"
                  style={{ backgroundColor: agent.color, transform: "scale(1.5)" }}
                />
                <Avatar className="h-16 w-16 border-2 border-background relative z-10">
                  <AvatarFallback
                    className="text-white font-semibold text-sm"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute top-1/2 left-1/2 h-0.5 origin-left opacity-20"
                  style={{
                    width: `${radius}px`,
                    backgroundColor: agent.color,
                    transform: `translate(-${x}px, -${y}px) rotate(${-angle}deg)`,
                  }}
                />
              </div>
            </div>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-primary/40 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[340px] h-[340px] rounded-full border border-primary/10" />
        <div className="absolute inset-4 rounded-full border border-primary/5" />
      </div>
    </div>
  );
};

export default AgentRotation;
