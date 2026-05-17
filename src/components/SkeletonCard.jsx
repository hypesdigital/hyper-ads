export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-1/2 rounded" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="skeleton h-2.5 w-full rounded" />
          <div className="skeleton h-2.5 w-5/6 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-2.5 w-16 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 flex-1 rounded-xl" />
          <div className="skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
