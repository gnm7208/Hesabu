import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

export interface NavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Rendered as a count pill. `attention` turns it amber — something is waiting. */
  count?: number;
  attention?: boolean;
}

/**
 * Workspace navigation: a rail on wide screens, a scrolling row on narrow ones.
 *
 * Replaces the underline tabs. Tabs implied four peer views; a rail with live
 * counts says what is *in* each one — a treasurer can see there is one payment to
 * match and six members behind without opening either view. Selection is a filled
 * pill rather than a moving underline, which reads identically in both
 * orientations and needs no measurement.
 */
export function SideNav<T extends string>({
  items,
  value,
  onChange,
}: {
  items: NavItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    const keys =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (!keys) return;
    e.preventDefault();
    const i = items.findIndex((it) => it.id === value);
    const next = items[(i + keys + items.length) % items.length];
    onChange(next.id);
    ref.current?.querySelector<HTMLElement>(`[data-nav="${next.id}"]`)?.focus();
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {items.map((item) => {
        const selected = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            data-nav={item.id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={
              "group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium " +
              "transition-[background-color,color,transform] duration-150 ease-out-strong " +
              "active:scale-[0.98] active:duration-100 " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40 " +
              "lg:w-full " +
              (selected
                ? "bg-chama-50 text-chama-800"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900")
            }
          >
            <Icon
              size={16}
              strokeWidth={2}
              className={selected ? "text-chama-600" : "text-ink-400"}
            />
            <span className="lg:flex-1 lg:text-left">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={
                  "tnum rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold " +
                  (item.attention
                    ? "bg-amber-100 text-amber-800"
                    : selected
                      ? "bg-chama-100 text-chama-700"
                      : "bg-ink-200/70 text-ink-600")
                }
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
