import * as React from "react";
import { cn } from "./button";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "peach" | "terracotta" | "success" | "outline" | "espresso";
}

export function Badge({ className, variant = "peach", ...props }: BadgeProps) {
  const variantStyles = {
    peach: "bg-[#FAD7A0] text-[#2D0E03] border-[#E67E22]/30",
    terracotta: "bg-[#B34A0E] text-white border-transparent",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    outline: "bg-transparent text-[#2D0E03] border-[#6E250A]/20",
    espresso: "bg-[#2D0E03] text-white border-transparent",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors font-sans",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
