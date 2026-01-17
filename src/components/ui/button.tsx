import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_hsl(var(--destructive)/0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
        outline:
          "border border-white/[0.15] bg-white/[0.08] backdrop-blur-[16px] backdrop-saturate-[1.6] hover:bg-white/[0.15] hover:border-white/[0.25] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.05)]",
        secondary:
          "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 border border-secondary/30 backdrop-blur-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        ghost: "hover:bg-white/[0.1] hover:text-accent-foreground backdrop-blur-[8px] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/[0.08] backdrop-blur-[20px] backdrop-saturate-[1.6] border border-white/[0.15] hover:bg-white/[0.15] hover:border-white/[0.25] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
