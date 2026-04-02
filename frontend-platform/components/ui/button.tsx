import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm',
      outline: 'border-2 border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50',
      ghost: 'hover:bg-neutral-100 text-neutral-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    }

    const sizes = {
      default: 'h-10 px-6 py-2',
      sm: 'h-8 px-4 text-sm',
      lg: 'h-12 px-8',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
