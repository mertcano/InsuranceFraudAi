"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { SWEEP, THRESHOLDS } from "@/lib/ml/infer";

// Validated CVD-safe categorical pair (blue = precision, amber = recall).
const C_PRECISION = "#3b82f6";
const C_RECALL = "#f59e0b";

const data = (SWEEP as Array<Record<string, number>>).map((d) => ({
  threshold: d.threshold,
  precision: +(d.precision * 100).toFixed(1),
  recall: +(d.recall * 100).toFixed(1),
  f1: +(d.f1 * 100).toFixed(1),
}));

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 tabular text-slate-400">
        Threshold {Number(label).toFixed(2)}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-300">{p.name}</span>
          <span className="tabular ml-auto font-semibold text-slate-100">
            {p.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PrecisionRecallChart() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: C_PRECISION }}
          />
          <span className="text-slate-300">Precision</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: C_RECALL }}
          />
          <span className="text-slate-300">Recall</span>
        </span>
        <span className="ml-auto text-slate-500">
          higher threshold → more precision, less recall
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
          >
            <CartesianGrid stroke="#1b2740" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="threshold"
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              stroke="#273452"
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              stroke="#273452"
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<TooltipBox />} />
            <ReferenceLine
              x={THRESHOLDS.f1Optimal}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: "F1-optimal",
                fill: "#94a3b8",
                fontSize: 10,
                position: "top",
              }}
            />
            <Line
              type="monotone"
              dataKey="precision"
              name="Precision"
              stroke={C_PRECISION}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="recall"
              name="Recall"
              stroke={C_RECALL}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
