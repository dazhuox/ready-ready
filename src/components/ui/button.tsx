import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-charcoal-800 text-white shadow-sm hover:bg-charcoal-900 active:scale-[0.98]",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]",
        outline:
          "border border-black/[0.08] bg-white/80 shadow-sm hover:bg-white hover:border-black/[0.14] text-charcoal-700",
        secondary:
          "bg-cream-100 text-charcoal-700 shadow-sm hover:bg-cream-200 active:scale-[0.98]",
        ghost:
          "hover:bg-black/[0.04] hover:text-charcoal-800 text-charcoal-600",
        sage:
          "bg-sage-500 text-white shadow-sm hover:bg-sage-600 active:scale-[0.98]",
        link: "text-sage-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
