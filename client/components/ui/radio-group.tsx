"use client";

import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value?: string;
  options: RadioOption[];
  onChange?: (value: string) => void;
  direction?: "row" | "column";
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  direction = "column",
}: RadioGroupProps) {
  return (
    <div
      className={cn(
        "flex gap-3 flex-wrap",
        direction === "column" ? "flex-col" : "flex-row"
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "cursor-pointer rounded-md border border-border px-4 py-3 text-sm font-medium transition hover:border-brand-teal hover:bg-brand-teal/5",
            value === option.value && "border-brand-teal bg-brand-teal/10"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className="sr-only"
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}


