import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllAgentConfigs } from "../config";

export const AgentRotation = () => {
  const agents = getAllAgentConfigs();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % agents.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [agents.length]);

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {agents.map((agent, idx) => (
        <Avatar
          key={agent.type}
          className={`h-12 w-12 transition-all duration-500 ${
            idx === activeIndex ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-60"
          }`}
          style={{ backgroundColor: agent.color }}
        >
          <AvatarFallback
            className="text-sm font-bold text-white"
            style={{ backgroundColor: "transparent" }}
          >
            {agent.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
};
