import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-chama-600 text-white shadow-[0_1px_2px_rgb(22_43_34/0.16)] hover:bg-chama-700 disabled:bg-chama-600/45 disabled:shadow-none",
  secondary:
    "bg-surface text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/45",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-800 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "gap-1 rounded-lg px-2.5 py-1 text-xs",
  md: "gap-1.5 rounded-lg px-3.5 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={
        "inline-flex items-center justify-center font-medium " +
        // Only transform and colour animate — both compositor-friendly. `all` would
        // sweep in layout properties and cost a frame on every hover.
        "transition-[transform,background-color,box-shadow,color] duration-150 ease-out-strong " +
        // Instant confirmation that the press registered. Scale is subtle on purpose;
        // anything below ~0.95 reads as the button flinching.
        "active:scale-[0.97] active:duration-100 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40 focus-visible:ring-offset-1 " +
        // Disabled buttons must not appear to respond to a press.
        "disabled:cursor-not-allowed disabled:active:scale-100 " +
        `${sizeClasses[size]} ${variantClasses[variant]} ${className}`
      }
      {...props}
    />
  );
}
