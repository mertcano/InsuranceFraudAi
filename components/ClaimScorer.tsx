"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { FEATURES, type ClaimInput } from "@/lib/ml/schema";
import { scoreClaim, THRESHOLDS } from "@/lib/ml/infer";
import { PRESETS } from "@/lib/presets";
import { Badge, Card, cx } from "./ui";

const DEFAULT_CLAIM = PRESETS[1].claim;

function formatValue(key: string, value: number): string {
  if (key === "claimAmount") return `₺${Math.round(value).toLocaleString()}`;
  const f = FEATURES.find((x) => x.key === key)!;
  return `${Math.round(value)}${f.unit ? " " + f.unit : ""}`;
}

export default function ClaimScorer() {
  const [claim, setClaim] = useState<ClaimInput>(DEFAULT_CLAIM);
  const [threshold, setThreshold] = useState<number>(
    Number(THRESHOLDS.f1Optimal.toFixed(2)),
  );
  const [activePreset, setActivePreset] = useState<string>("borderline");

  const result = useMemo(
    () => scoreClaim(claim, threshold),
    [claim, threshold],
  );

  const pct = Math.round(result.probability * 100);

  const setField = (key: string, value: number | string) => {
    setClaim((c) => ({ ...c, [key]: value }));
    setActivePreset("");
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setClaim(p.claim);
    setActivePreset(id);
  };

  const bandMeta = {
    clear: {
      tone: "safe" as const,
      label: "Clear — auto-approve",
      Icon: ShieldCheck,
      ring: "from-safe-500/30",
    },
    review: {
      tone: "caution" as const,
      label: "Flag for Review",
      Icon: ShieldQuestion,
      ring: "from-caution-500/30",
    },
    high: {
      tone: "alert" as const,
      label: "High risk — escalate to SIU",
      Icon: ShieldAlert,
      ring: "from-alert-500/30",
    },
  }[result.band];

  const { Icon } = bandMeta;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* ---- Input panel ---- */}
      <Card className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              Claim details
            </h3>
            <button
              onClick={() => applyPreset("borderline")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Load a scenario, or adjust any field to see the model re-score live.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              title={p.blurb}
              className={cx(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                activePreset === p.id
                  ? "border-trust-500/40 bg-trust-500/10 text-trust-300"
                  : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Feature inputs */}
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const value = claim[f.key as keyof ClaimInput];
            if (f.type === "categorical") {
              return (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-slate-300">
                    {f.label}
                  </span>
                  <select
                    value={String(value)}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="mt-1.5 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-trust-500/50 focus:ring-2 focus:ring-trust-500/20"
                  >
                    {f.options!.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            const [lo, hi] = f.range!;
            return (
              <label key={f.key} className="block">
                <span className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    {f.label}
                  </span>
                  <span className="tabular text-xs font-semibold text-trust-300">
                    {formatValue(f.key, Number(value))}
                  </span>
                </span>
                <input
                  type="range"
                  min={lo}
                  max={hi}
                  step={f.key === "claimAmount" ? 500 : 1}
                  value={Number(value)}
                  onChange={(e) => setField(f.key, Number(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-trust-500"
                />
              </label>
            );
          })}
        </div>
      </Card>

      {/* ---- Result panel ---- */}
      <div className="flex flex-col gap-6">
        <Card
          className={cx(
            "relative overflow-hidden bg-gradient-to-b to-transparent",
            bandMeta.ring,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Fraud probability
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular text-5xl font-semibold text-slate-100">
                  {pct}
                  <span className="text-2xl text-slate-400">%</span>
                </span>
              </div>
            </div>
            <Badge tone={bandMeta.tone} className="mt-1">
              <Icon className="h-3.5 w-3.5" />
              {bandMeta.label}
            </Badge>
          </div>

          {/* Probability bar with threshold marker */}
          <div className="relative mt-5 h-3 w-full rounded-full bg-ink-800">
            <div
              className={cx(
                "h-3 rounded-full transition-all duration-500",
                result.band === "high"
                  ? "bg-alert-500"
                  : result.band === "review"
                    ? "bg-caution-500"
                    : "bg-safe-500",
              )}
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute -top-1 h-5 w-0.5 bg-slate-200"
              style={{ left: `${threshold * 100}%` }}
              title={`Decision threshold: ${Math.round(threshold * 100)}%`}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>0%</span>
            <span>
              Decision threshold · {Math.round(threshold * 100)}%
            </span>
            <span>100%</span>
          </div>
        </Card>

        {/* Threshold control */}
        <Card>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              Operating point
            </h4>
            <span className="tabular text-xs text-slate-400">
              threshold {threshold.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Lower the threshold to catch more fraud (higher recall); raise it to
            reduce false alarms (higher precision).
          </p>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-trust-500"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() =>
                setThreshold(Number(THRESHOLDS.costOptimal.toFixed(2)))
              }
              className="cursor-pointer rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-slate-200"
            >
              Cost-optimal ({THRESHOLDS.costOptimal.toFixed(2)})
            </button>
            <button
              onClick={() =>
                setThreshold(Number(THRESHOLDS.f1Optimal.toFixed(2)))
              }
              className="cursor-pointer rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-slate-200"
            >
              Balanced / F1 ({THRESHOLDS.f1Optimal.toFixed(2)})
            </button>
          </div>
        </Card>

        {/* Decision path */}
        <Card>
          <h4 className="text-sm font-semibold text-slate-200">
            Why this decision
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            The exact rule chain the claim followed through the tree — every
            prediction is fully auditable.
          </p>
          <ol className="mt-4 space-y-2">
            {result.path.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-300"
              >
                <ChevronRight
                  className={cx(
                    "mt-0.5 h-4 w-4 shrink-0",
                    step.wentLeft ? "text-safe-400" : "text-alert-400",
                  )}
                />
                <span>{step.reason}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
