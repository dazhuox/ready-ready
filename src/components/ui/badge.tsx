import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-charcoal-800 text-white",
        secondary:
          "border-transparent bg-cream-200 text-charcoal-700",
        sage:
          "border-transparent bg-sage-500/10 text-sage-600",
        destructive:
          "border-transparent bg-red-100 text-red-700",
        outline:
          "border-black/[0.1] text-charcoal-600 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
