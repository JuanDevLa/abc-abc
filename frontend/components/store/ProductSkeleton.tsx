import Navbar from '@/components/Navbar';

export default function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-theme-bg text-th-primary font-sans">
      <Navbar />
      <div className="pt-24 md:pt-32 pb-20 container mx-auto px-6">
        <div className="h-4 w-64 bg-slate-300/50 dark:bg-slate-700/50 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3 overflow-hidden pb-2 md:pb-0 md:w-20 lg:w-24 flex-shrink-0">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-16 md:w-full md:aspect-square rounded-xl flex-shrink-0 bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />)}
            </div>
            <div className="flex-1 aspect-square rounded-2xl bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="mb-4 space-y-3">
              <div className="h-6 w-24 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
              <div className="h-10 md:h-12 w-3/4 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
              <div className="h-8 w-1/3 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
            </div>
            <div className="h-px w-full bg-th-border/10 my-4" />
            <div className="mb-6 space-y-2">
              <div className="h-4 w-full rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-full rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
            </div>
            <div className="mb-6">
              <div className="h-4 w-32 mb-3 rounded bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-lg bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />)}
              </div>
            </div>
            <div className="h-32 w-full rounded-xl mb-6 bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
