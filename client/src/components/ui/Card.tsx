import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lifts on hover. Only for cards that are themselves a link or button. */
  interactive?: boolean;
}

export function Card({ className = "", interactive = false, ...props }: CardProps) {
  return (
    <div
      className={
        "rounded-xl border border-ink-200/70 bg-white p-4 shadow-card " +
        // Tailwind v4 already scopes hover: to (hover: hover), so touch devices
        // won't get stuck in the lifted state after a tap.
        (interactive
          ? "transition-[transform,box-shadow,border-color] duration-200 ease-out-strong " +
            "hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-lift " +
            "active:translate-y-0 active:shadow-card active:duration-100"
          : "") +
        ` ${className}`
      }
      {...props}
    />
  );
}
