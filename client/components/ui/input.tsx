"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", startAdornment, endAdornment, ...props }, ref) => {
    const hasAdornment = startAdornment || endAdornment;

    return (
      <div
        className={cn(
          "relative flex items-center rounded-md border border-border bg-surface text-body transition focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/30"
        )}
      >
        {startAdornment ? (
          <span className="pl-4 text-muted text-sm">{startAdornment}</span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full bg-transparent px-4 py-3 text-base outline-none",
            hasAdornment ? "px-4" : undefined,
            className
          )}
          suppressHydrationWarning
          {...props}
        />
        {endAdornment ? (
          <span className="pr-4 text-muted text-sm">{endAdornment}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";


