import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Field({
  label,
  children,
  className = "",
  ...props
}: { label: string; children: ReactNode } & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`} {...props}>
      <span className="font-medium text-ink-600">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-[border-color,box-shadow] duration-150 ease-out-strong focus:border-chama-500 focus:outline-none focus:ring-[3px] focus:ring-chama-500/20 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-[border-color,box-shadow] duration-150 ease-out-strong focus:border-chama-500 focus:outline-none focus:ring-[3px] focus:ring-chama-500/20 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-lg border border-ink-300 bg-surface px-3 py-2 font-mono text-sm text-ink-900 placeholder:text-ink-400 transition-[border-color,box-shadow] duration-150 ease-out-strong focus:border-chama-500 focus:outline-none focus:ring-[3px] focus:ring-chama-500/20 ${props.className ?? ""}`}
    />
  );
}
