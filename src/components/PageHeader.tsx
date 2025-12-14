import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  description?: string;
  metadata?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, description, metadata, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-6 mb-12">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          {metadata && (
            <p className="text-sm text-muted-foreground font-medium">
              {metadata}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{subtitle}</h2>
        {description && (
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
