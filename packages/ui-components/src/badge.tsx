import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-sm font-mono",
  {
    variants: {
      variant: {
        default: "border-primary-500/30 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20",
        secondary: "border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50",
        destructive: "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-glow-destructive",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
        outline: "text-slate-400 border-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };