import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/90 text-primary-foreground hover:bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
        secondary:
          "border-white/[0.15] bg-white/[0.08] text-secondary-foreground hover:bg-white/[0.15] backdrop-blur-[12px] backdrop-saturate-[1.4] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
        destructive:
          "border-transparent bg-destructive/90 text-destructive-foreground hover:bg-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
        outline: "text-foreground border-white/[0.15] bg-white/[0.06] backdrop-blur-[12px] hover:bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        glass: "border-white/[0.15] bg-white/[0.08] backdrop-blur-[16px] backdrop-saturate-[1.6] text-foreground hover:bg-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
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
