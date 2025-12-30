"use client";

import { ReactElement, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0a8e6e] text-white hover:bg-[#0a8e6e]/90 focus-visible:ring-[#0a8e6e]/40 border border-[#0a8e6e]",
  secondary:
    "bg-white text-[#111144] border border-[#d8dee8] hover:bg-[#f1f4f8]",
  ghost:
    "bg-transparent text-[#111144] hover:bg-[#0a8e6e]/10 focus-visible:ring-[#0a8e6e]/20",
  danger:
    "bg-[#E53935] text-white hover:bg-[#d72521] focus-visible:ring-[#E53935]/40 border border-[#E53935]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-12 px-6 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      asChild = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full",
      className
    );

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: cn(child.props.className, classes),
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";


