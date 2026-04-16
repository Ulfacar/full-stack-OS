import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-[#262626] bg-[#0A0A0A] text-[#3B82F6] transition-colors focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      />
      {label && (
        <span className="text-sm text-[#A3A3A3] group-hover:text-[#FAFAFA] transition-colors">
          {label}
        </span>
      )}
    </label>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
