export function QuestionCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border bg-card px-5 py-4 animate-pulse">
      <div className="flex flex-1 flex-col gap-2.5 min-w-0">
        <div className="h-4 w-3/5 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-4 w-14 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="h-8 w-24 shrink-0 rounded-md bg-muted" />
    </div>
  )
}
