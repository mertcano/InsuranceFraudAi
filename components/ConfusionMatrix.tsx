"use client";

import { OPERATING_POINT } from "@/lib/ml/infer";
import { cx } from "./ui";

interface Point {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
}

const op = OPERATING_POINT as unknown as Point;
const { tp, fp, tn, fn } = op.confusion;

function Cell({
  n,
  label,
  tone,
  desc,
}: {
  n: number;
  label: string;
  tone: "safe" | "alert" | "caution";
  desc: string;
}) {
  const tones = {
    safe: "border-safe-500/25 bg-safe-500/[0.07]",
    alert: "border-alert-500/25 bg-alert-500/[0.07]",
    caution: "border-caution-500/25 bg-caution-500/[0.07]",
  };
  return (
    <div className={cx("rounded-xl border p-4", tones[tone])}>
      <div className="tabular text-2xl font-semibold text-slate-100">{n}</div>
      <div className="mt-0.5 text-xs font-medium text-slate-300">{label}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{desc}</div>
    </div>
  );
}

export default function ConfusionMatrix() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span>Held-out test set · threshold {op.threshold.toFixed(2)}</span>
        <span className="tabular">
          Precision {(op.precision * 100).toFixed(0)}% · Recall{" "}
          {(op.recall * 100).toFixed(0)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Cell
          n={tp}
          label="True positives"
          tone="safe"
          desc="Fraud correctly flagged"
        />
        <Cell
          n={fn}
          label="False negatives"
          tone="alert"
          desc="Missed fraud — costliest error"
        />
        <Cell
          n={fp}
          label="False positives"
          tone="caution"
          desc="Clean claims flagged for review"
        />
        <Cell
          n={tn}
          label="True negatives"
          tone="safe"
          desc="Clean claims auto-approved"
        />
      </div>
    </div>
  );
}
