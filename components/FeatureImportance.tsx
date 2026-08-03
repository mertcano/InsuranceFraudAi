"use client";

import { IMPORTANCES } from "@/lib/ml/infer";

const items = (IMPORTANCES as Array<{ label: string; importance: number }>)
  .filter((d) => d.importance > 0)
  .slice(0, 9);

const max = Math.max(...items.map((d) => d.importance), 0.0001);

export default function FeatureImportance() {
  return (
    <div className="space-y-3">
      {items.map((d, i) => {
        const w = (d.importance / max) * 100;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-right text-xs text-slate-400">
              {d.label}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-ink-800">
              <div
                className="h-6 rounded-md bg-gradient-to-r from-trust-700 to-trust-400 transition-all duration-700"
                style={{ width: `${Math.max(w, 3)}%` }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center tabular text-[11px] font-medium text-slate-200">
                {(d.importance * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-slate-500">
        Share of total Gini impurity reduction attributed to each feature across
        the tree. Ranks (not scaled input values) — robust to feature units.
      </p>
    </div>
  );
}
