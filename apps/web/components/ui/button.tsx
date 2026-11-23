import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium font-sans transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[12px]";

    const sizeStyles = {
      sm: "px-[16px] py-[8px] text-[12px] font-medium leading-[1.63]",
      md: "px-[20px] py-[12px] text-[14px] font-medium leading-[1.63]",
      lg: "px-[24px] py-[16px] text-[16px] font-semibold leading-[1.63]",
    }[size];

    const variantStyles = {
      primary:
        "bg-[#B34A0E] text-white hover:bg-[#8F3B0B] active:scale-[0.98] shadow-sm",
      secondary:
        "bg-[#FAD7A0] text-[#2D0E03] hover:bg-[#F7C682] active:scale-[0.98]",
      outline:
        "border-[0.8px] border-[#6E250A]/20 bg-white text-[#2D0E03] hover:bg-[#FEF5E7] hover:border-[#6E250A]/40",
      ghost:
        "bg-transparent text-[#2D0E03] hover:bg-[#6E250A]/5 active:bg-[#6E250A]/10",
      destructive:
        "bg-red-700 text-white hover:bg-red-800 active:scale-[0.98]",
    }[variant];

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
