import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "soft" | "card";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const shadowMap = {
  none: "",
  soft: "shadow-[var(--shadow-soft)]",
  card: "shadow-[var(--shadow-card)]",
};

export function Card({
  className,
  children,
  padding = "md",
  shadow = "card",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-lg border border-border/80",
        paddingMap[padding],
        shadowMap[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex items-center justify-between gap-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold text-heading", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4 text-sm text-body", className)} {...props} />
  );
}


