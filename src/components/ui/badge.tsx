import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]",
        secondary:
          "border-transparent bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 border border-secondary/40 backdrop-blur-sm",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground hover:bg-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.3)]",
        outline: "text-foreground border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10",
        glass: "border-white/10 bg-white/5 backdrop-blur-md text-foreground hover:bg-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
