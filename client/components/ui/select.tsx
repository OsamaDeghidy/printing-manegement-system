"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    value = "", 
    onChange, 
    options, 
    disabled = false, 
    placeholder,
    startAdornment,
    endAdornment,
    className = "",
    ...props 
  }, ref) => {
    const hasAdornment = startAdornment || endAdornment;

    // Ensure onChange is always defined
    const handleChange = onChange || (() => {});

    return (
      <div
        className={cn(
          "relative flex items-center rounded-md border border-border bg-surface text-body transition focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {startAdornment ? (
          <span className="pl-4 text-muted text-sm">{startAdornment}</span>
        ) : null}
        <select
          ref={ref}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full appearance-none bg-transparent py-3 text-base outline-none cursor-pointer",
            hasAdornment ? "px-4" : "pr-4 pl-10",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {!endAdornment && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        {endAdornment ? (
          <span className="pr-4 text-muted text-sm">{endAdornment}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
