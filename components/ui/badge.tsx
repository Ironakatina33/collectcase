import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border border-primary/30",
        secondary: "bg-white/5 text-foreground border border-white/10",
        success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        danger: "bg-red-500/15 text-red-300 border border-red-500/30",
        common: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30",
        rare: "bg-blue-500/15 text-blue-300 border border-blue-500/40",
        epic: "bg-purple-500/15 text-purple-300 border border-purple-500/40",
        legendary: "bg-amber-500/15 text-amber-300 border border-amber-500/40",
        mythic: "bg-pink-500/15 text-pink-300 border border-pink-500/40"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
