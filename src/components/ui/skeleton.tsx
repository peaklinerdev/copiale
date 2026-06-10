import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-sm bg-[#2b3139]/60",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
