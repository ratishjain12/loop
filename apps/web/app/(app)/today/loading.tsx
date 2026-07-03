import { QuestionCardSkeleton } from '@/components/question-card-skeleton'

export default function TodayLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-3">
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        <div className="h-1 w-full rounded-full bg-muted animate-pulse" />
      </div>

      {/* Question cards */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <QuestionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
