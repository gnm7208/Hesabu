import { useLayoutEffect, useRef } from "react";

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}

/**
 * Tabs with an indicator that travels between labels rather than cutting.
 *
 * The bar is 1px wide, moved with translateX and stretched with scaleX, so the
 * whole thing runs on the compositor — animating `left`/`width` would relayout on
 * every frame. Position is written straight to the node in a layout effect (before
 * paint), so the bar never flashes at the wrong place and no extra render is
 * queued. The transition is attached only after the first positioning, otherwise
 * the bar would visibly slide in from the left edge on mount.
 */
export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const hasMeasured = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;

    function measure() {
      const active = list?.querySelector<HTMLElement>(`[data-tab="${value}"]`);
      if (!active || !bar) return;
      bar.style.transform = `translateX(${active.offsetLeft}px) scaleX(${active.offsetWidth})`;
      if (!hasMeasured.current) {
        hasMeasured.current = true;
        // Wait one frame so the initial transform lands untransitioned.
        requestAnimationFrame(() => {
          bar.style.transition = "transform 300ms var(--ease-in-out-strong)";
        });
      }
    }

    measure();
    // Labels reflow on resize and when webfonts settle; a stale bar would sit
    // under the wrong tab until the next click.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value, tabs]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === value);
    // Wrap, so the arrows never dead-end.
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    onChange(next.id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className="relative -mb-px flex gap-1 border-b border-ink-200"
    >
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            data-tab={t.id}
            role="tab"
            aria-selected={selected}
            // Only the active tab is in the tab order; arrows move between them.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={
              "relative rounded-t-md px-3 py-2 text-sm font-medium " +
              "transition-colors duration-150 ease-out-strong " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40 " +
              (selected ? "text-chama-700" : "text-ink-500 hover:text-ink-800")
            }
          >
            {t.label}
          </button>
        );
      })}

      <span
        ref={barRef}
        aria-hidden
        className="absolute bottom-0 left-0 h-0.5 w-px origin-left rounded-full bg-chama-600"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
