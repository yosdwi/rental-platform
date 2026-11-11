"use client";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger" | "wa" | "white";
type Size = "lg" | "md" | "sm" | "icon";

const V: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-500 active:bg-brand-700 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset]",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong",
  ghost: "text-ink-2 hover:bg-black/[0.04]",
  soft: "bg-brand-soft text-brand hover:bg-[#e2e5f6]",
  danger: "bg-danger text-white hover:brightness-105",
  wa: "bg-wa text-white hover:brightness-105",
  white: "bg-white text-brand hover:bg-white/90",
};
const S: Record<Size, string> = {
  lg: "h-14 px-6 rounded-2xl text-[15px] font-semibold gap-2",
  md: "h-11 px-4 rounded-[14px] text-sm font-semibold gap-2",
  sm: "h-9 px-3 rounded-xl text-[13px] font-semibold gap-1.5",
  icon: "h-10 w-10 rounded-full",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "press inline-flex select-none items-center justify-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-45 disabled:active:scale-100",
        V[variant], S[size], block && "w-full", className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
});
