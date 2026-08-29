import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Grey block standing in for a line of text while it loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

/**
 * Rows shaped like the content they replace, so the layout doesn't jump when real
 * data arrives. A spinner would say "something is happening"; this says "a list of
 * roughly this shape is coming", which is what makes the wait feel shorter.
 */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-ink-200/70">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * An empty state should say what the thing is, why it's empty, and what to do
 * about it. "No data" answers none of those.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="text-title text-ink-800">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-ink-500">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Inline error. Never a toast — the user needs it next to the thing that failed. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="animate-rise rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
      {children}
    </p>
  );
}
