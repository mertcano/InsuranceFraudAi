/**
 * Runtime inference: load the trained artifact and score a claim.
 *
 * No training happens here. The artifact is a static JSON produced at build
 * time (scripts/train.ts); scoring is pure tree traversal plus a threshold, so
 * it runs in microseconds on the server or in the browser.
 */

import model from "./artifact/model.json";
import {
  encodeClaim,
  FEATURES,
  type ClaimInput,
  type FeatureSpec,
} from "./schema";
import {
  predictProba,
  decisionPath,
  type TreeNode,
  type PathStep,
} from "./tree";

const TREE = model.tree as TreeNode;

export type RiskBand = "clear" | "review" | "high";

export interface ExplainedStep {
  feature: FeatureSpec;
  value: number;
  threshold: number;
  /** True if the claim satisfied the split as "<= threshold". */
  wentLeft: boolean;
  /** Plain-English reading of this branch. */
  reason: string;
}

export interface ScoreResult {
  probability: number;
  /** True when probability >= the active decision threshold. */
  flagged: boolean;
  band: RiskBand;
  threshold: number;
  path: ExplainedStep[];
  /** Top contributing features present on the path, most decisive first. */
  topFactors: string[];
}

export const ARTIFACT_META = model.meta;
export const IMPORTANCES = model.importances;
export const OPERATING_POINT = model.operatingPoint;
export const COST_POINT = model.costPoint;
export const THRESHOLDS = model.thresholds;
export const SWEEP = model.sweep;
export const BASELINE_AT_50 = model.baselineAt50;

/** Default decision threshold = F1-optimal from evaluation. */
export const DEFAULT_THRESHOLD = model.thresholds.f1Optimal as number;

function bandFor(probability: number, threshold: number): RiskBand {
  if (probability >= Math.min(0.65, threshold + 0.2)) return "high";
  if (probability >= threshold) return "review";
  return "clear";
}

/** Render a single decision-path step into an analyst-readable sentence. */
function explainStep(step: PathStep): ExplainedStep {
  const feature = FEATURES[step.featureIndex];
  const t = step.threshold;
  let reason: string;

  if (feature.type === "categorical") {
    const label =
      feature.options?.[Math.round(step.value)] ?? String(step.value);
    reason = `${feature.label} is “${label}”`;
  } else {
    const cmp = step.wentLeft ? "≤" : ">";
    const shown =
      feature.key === "claimAmount"
        ? `₺${Math.round(step.value).toLocaleString()}`
        : `${Math.round(step.value)}${feature.unit ? " " + feature.unit : ""}`;
    const bound =
      feature.key === "claimAmount"
        ? `₺${Math.round(t).toLocaleString()}`
        : `${Math.round(t)}${feature.unit ? " " + feature.unit : ""}`;
    reason = `${feature.label} ${shown} (${cmp} ${bound})`;
  }
  return {
    feature,
    value: step.value,
    threshold: t,
    wentLeft: step.wentLeft,
    reason,
  };
}

/**
 * Score a claim. `threshold` lets the caller move the precision/recall
 * operating point (e.g. from a UI slider); defaults to the F1-optimal point.
 */
export function scoreClaim(
  input: ClaimInput,
  threshold: number = DEFAULT_THRESHOLD,
): ScoreResult {
  const x = encodeClaim(input);
  const probability = predictProba(TREE, x);
  const rawPath = decisionPath(TREE, x);
  const path = rawPath.map(explainStep);

  // "Top factors" = features whose branch pushed toward the fraud side of the
  // tree, i.e. numeric ">" splits or risky categorical values, deduped.
  const topFactors: string[] = [];
  const seen = new Set<string>();
  for (const step of path) {
    if (seen.has(step.feature.key)) continue;
    const risky =
      (step.feature.type === "numeric" && !step.wentLeft) ||
      (step.feature.key === "policyAgeDays" && step.wentLeft) ||
      (step.feature.key === "witnessPresent" && step.value === 0) ||
      (step.feature.key === "policeReportFiled" && step.value === 0);
    if (risky) {
      topFactors.push(step.reason);
      seen.add(step.feature.key);
    }
  }

  return {
    probability,
    flagged: probability >= threshold,
    band: bandFor(probability, threshold),
    threshold,
    path,
    topFactors: topFactors.slice(0, 4),
  };
}
