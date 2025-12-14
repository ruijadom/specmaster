interface NavTitleProps {
  title: string;
  description?: string;
}

export const NavTitle = ({ title, description }: NavTitleProps) => {
  return (
    <div className="min-w-0">
      <h1 className="text-lg font-semibold text-foreground leading-none truncate">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {description}
        </p>
      )}
    </div>
  );
};
