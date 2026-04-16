import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-black/[0.08] bg-transparent px-3 py-2 text-sm text-charcoal-800 placeholder:text-warmgray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/30 focus-visible:border-sage-500/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
