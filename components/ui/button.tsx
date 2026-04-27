"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white hover:from-fuchsia-400 hover:to-violet-500 shadow-lg shadow-fuchsia-900/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5",
        outline:
          "border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-foreground",
        ghost:
          "hover:bg-white/[0.06] text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        gold:
          "bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 hover:from-amber-300 hover:to-orange-400 font-bold shadow-lg shadow-amber-900/30",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
