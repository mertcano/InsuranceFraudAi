import type { ReactNode } from "react";

/** Small helper to compose class names. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "trust" | "safe" | "caution" | "alert";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/5 text-slate-300 border-white/10",
    trust: "bg-trust-500/10 text-trust-300 border-trust-500/20",
    safe: "bg-safe-500/10 text-safe-400 border-safe-500/20",
    caution: "bg-caution-500/10 text-caution-400 border-caution-500/20",
    alert: "bg-alert-500/10 text-alert-400 border-alert-500/20",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent = "trust",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "trust" | "safe" | "caution" | "alert";
}) {
  const accents: Record<string, string> = {
    trust: "text-trust-300",
    safe: "text-safe-400",
    caution: "text-caution-400",
    alert: "text-alert-400",
  };
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={cx("mt-2 text-3xl font-semibold tabular", accents[accent])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-trust-400">
          {eyebrow}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("card p-6", className)}>{children}</div>;
}
