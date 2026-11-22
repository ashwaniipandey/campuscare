import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-teal-600 text-white shadow-sm",
        secondary:
          "border border-transparent bg-sky-100 text-sky-800",
        teal:
          "border border-teal-200/80 bg-teal-50 text-teal-800",
        destructive:
          "border border-transparent bg-rose-100 text-rose-700",
        outline:
          "border border-slate-200 text-slate-700 bg-white",
        success:
          "border border-emerald-200 bg-emerald-50 text-emerald-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
