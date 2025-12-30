import { cn } from "@/lib/utils";

type BadgeTone = "info" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  info: "bg-brand-blue/10 text-brand-blue border-brand-blue/30",
  success: "bg-brand-teal/10 text-brand-teal border-brand-teal/30",
  warning: "bg-[#FFC107]/15 text-[#9E7700] border-[#FFC107]/40",
  danger: "bg-[#E53935]/15 text-[#B71C1C] border-[#E53935]/40",
  neutral: "bg-brand-gray-100 text-muted border-border",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  soft?: boolean;
}

export function Badge({
  className,
  tone = "neutral",
  soft = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        soft && "border-transparent",
        className
      )}
      {...props}
    />
  );
}


