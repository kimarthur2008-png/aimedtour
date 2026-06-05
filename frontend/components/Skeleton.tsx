// Переиспользуемые skeleton-блоки для состояния загрузки

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
  );
}

export function TicketSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border-2 border-gray-100 space-y-2">
          <SkeletonBox className="h-3.5 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
          <SkeletonBox className="h-3 w-1/3" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ClinicSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <SkeletonBox className="h-4 w-2/3" />
            <SkeletonBox className="h-5 w-12 rounded" />
          </div>
          <SkeletonBox className="h-3 w-1/2" />
          <div className="flex gap-1">
            <SkeletonBox className="h-5 w-20 rounded" />
            <SkeletonBox className="h-5 w-24 rounded" />
          </div>
          <SkeletonBox className="h-3 w-full" />
          <SkeletonBox className="h-3 w-4/5" />
          <div className="flex gap-2 pt-1">
            <SkeletonBox className="h-7 flex-1 rounded" />
            <SkeletonBox className="h-7 flex-1 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
