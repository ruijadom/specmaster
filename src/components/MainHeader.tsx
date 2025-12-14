import { ReactNode } from "react";
import { NavTitle } from "./NavTitle";

interface MainHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const MainHeader = ({ title, description, actions }: MainHeaderProps) => {
  return (
    <header className="h-14 border-b border-border bg-background sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4 min-w-0">
          <NavTitle title={title} description={description} />
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
