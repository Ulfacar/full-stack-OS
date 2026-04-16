import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-[#3B82F6] text-white hover:bg-[#2563EB] active:scale-[0.98] shadow-[0_0_15px_rgba(59,130,246,0.3)]',
      outline: 'bg-transparent text-[#FAFAFA] border border-[#262626] hover:bg-[#1A1A1A] hover:border-[#3B82F6]/30',
      ghost: 'text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-[#FAFAFA]',
      destructive: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98]',
      secondary: 'bg-[#1A1A1A] text-[#FAFAFA] border border-[#262626] hover:bg-[#262626]',
    }

    const sizes = {
      default: 'h-10 px-5 py-2.5',
      sm: 'h-9 px-4 text-sm',
      lg: 'h-11 px-6 text-sm',
      icon: 'h-10 w-10',
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] disabled:pointer-events-none disabled:opacity-50',
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
