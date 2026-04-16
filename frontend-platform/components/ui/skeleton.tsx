import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-md h-4", className)} {...props} />
}

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-[#0A0A0A] border border-[#262626] p-6 space-y-3">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export { Skeleton, CardSkeleton }
