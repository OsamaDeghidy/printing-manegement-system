"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-body transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30 outline-none resize-none",
        className
      )}
      {...props}
    />
  )
);

TextArea.displayName = "TextArea";


