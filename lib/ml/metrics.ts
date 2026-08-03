/**
 * Classification metrics with a fraud-domain cost model.
 *
 * The core idea from cost-sensitive learning: the "best" threshold is not the
 * one with the highest accuracy, but the one that minimizes expected business
 * cost, where a false negative (paid-out fraud) dwarfs a false positive (an
 * analyst-hour spent reviewing a clean claim).
 */

import type { LabeledSample } from "./schema";
import { predictProba, type TreeNode } from "./tree";

export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ThresholdMetrics {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  accuracy: number;
  confusion: Confusion;
  expectedCost: number;
}

export interface CostModel {
  /** Avg payout lost on a missed fraud. */
  falseNegative: number;
  /** Analyst review cost + customer-friction cost on a false alarm. */
  falsePositive: number;
}

export const DEFAULT_COST: CostModel = {
  falseNegative: 12000,
  falsePositive: 1500,
};

export function confusionAt(
  probs: number[],
  labels: (0 | 1)[],
  threshold: number,
): Confusion {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (let i = 0; i < probs.length; i++) {
    const pred = probs[i] >= threshold ? 1 : 0;
    if (pred === 1 && labels[i] === 1) tp++;
    else if (pred === 1 && labels[i] === 0) fp++;
    else if (pred === 0 && labels[i] === 0) tn++;
    else fn++;
  }
  return { tp, fp, tn, fn };
}

export function metricsFromConfusion(
  c: Confusion,
  threshold: number,
  cost: CostModel,
): ThresholdMetrics {
  const precision = c.tp + c.fp === 0 ? 0 : c.tp / (c.tp + c.fp);
  const recall = c.tp + c.fn === 0 ? 0 : c.tp / (c.tp + c.fn);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  const fpr = c.fp + c.tn === 0 ? 0 : c.fp / (c.fp + c.tn);
  const accuracy = (c.tp + c.tn) / (c.tp + c.fp + c.tn + c.fn);
  const expectedCost =
    c.fn * cost.falseNegative + c.fp * cost.falsePositive;
  return { threshold, precision, recall, f1, fpr, accuracy, confusion: c, expectedCost };
}

/** Score a held-out set, returning probabilities aligned with labels. */
export function scoreSet(
  tree: TreeNode,
  set: LabeledSample[],
): { probs: number[]; labels: (0 | 1)[] } {
  const probs = set.map((s) => predictProba(tree, s.x));
  const labels = set.map((s) => s.y);
  return { probs, labels };
}

/** Sweep thresholds 0..1 and compute the full metric curve. */
export function sweepThresholds(
  probs: number[],
  labels: (0 | 1)[],
  cost: CostModel = DEFAULT_COST,
  steps = 101,
): ThresholdMetrics[] {
  const out: ThresholdMetrics[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    out.push(metricsFromConfusion(confusionAt(probs, labels, t), t, cost));
  }
  return out;
}

/** Threshold that minimizes expected business cost. */
export function bestCostThreshold(sweep: ThresholdMetrics[]): ThresholdMetrics {
  return sweep.reduce((best, m) =>
    m.expectedCost < best.expectedCost ? m : best,
  );
}

/** Threshold that maximizes F1 (balance point, cost-agnostic). */
export function bestF1Threshold(sweep: ThresholdMetrics[]): ThresholdMetrics {
  return sweep.reduce((best, m) => (m.f1 > best.f1 ? m : best));
}

/** Area under the ROC curve via trapezoidal integration over the sweep. */
export function auc(sweep: ThresholdMetrics[]): number {
  // Sort by FPR ascending; recall == TPR.
  const pts = [...sweep]
    .map((m) => ({ x: m.fpr, y: m.recall }))
    .sort((a, b) => a.x - b.x);
  let area = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    area += (dx * (pts[i].y + pts[i - 1].y)) / 2;
  }
  return area;
}
