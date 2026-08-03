/**
 * Feature schema for the insurance-claim fraud model.
 *
 * Features are chosen to mirror the signals a real SIU (Special Investigations
 * Unit) triages on. Each one has a documented business rationale so the model's
 * decision paths stay auditable — a hard requirement in regulated insurance.
 */

export type FeatureType = "numeric" | "categorical";

export interface FeatureSpec {
  key: string;
  label: string;
  type: FeatureType;
  /** For numeric: [min, max] UI bounds. */
  range?: [number, number];
  /** For categorical: allowed values (index used internally). */
  options?: string[];
  unit?: string;
  /** Short "why this matters for fraud" note, surfaced in the UI. */
  rationale: string;
}

export const FEATURES: FeatureSpec[] = [
  {
    key: "policyAgeDays",
    label: "Policy Age",
    type: "numeric",
    range: [0, 1460],
    unit: "days",
    rationale:
      "Claims filed days after a policy starts are a classic fraud pattern (buy cover, then 'discover' a loss).",
  },
  {
    key: "claimAmount",
    label: "Claim Amount",
    type: "numeric",
    range: [500, 250000],
    unit: "₺",
    rationale:
      "Unusually large payouts relative to the policy raise expected loss and warrant closer review.",
  },
  {
    key: "incidentHour",
    label: "Incident Hour",
    type: "numeric",
    range: [0, 23],
    unit: "h",
    rationale:
      "Late-night incidents (00:00–05:00) with no witnesses are over-represented in staged accidents.",
  },
  {
    key: "daysToReport",
    label: "Days to Report",
    type: "numeric",
    range: [0, 90],
    unit: "days",
    rationale:
      "A long gap between incident and report can indicate a fabricated or backdated claim.",
  },
  {
    key: "expertReportScore",
    label: "Adjuster Suspicion Score",
    type: "numeric",
    range: [0, 100],
    unit: "/100",
    rationale:
      "The field adjuster's structured suspicion score — the single strongest human signal.",
  },
  {
    key: "priorClaims12m",
    label: "Prior Claims (12m)",
    type: "numeric",
    range: [0, 8],
    unit: "claims",
    rationale:
      "Frequent claimants have a higher base rate of fraudulent filings.",
  },
  {
    key: "witnessPresent",
    label: "Witness Present",
    type: "categorical",
    options: ["No", "Yes"],
    rationale:
      "Independent witnesses make staging harder; their absence slightly raises risk.",
  },
  {
    key: "policeReportFiled",
    label: "Police Report Filed",
    type: "categorical",
    options: ["No", "Yes"],
    rationale:
      "A missing police report on a significant incident is a common red flag.",
  },
  {
    key: "channel",
    label: "Acquisition Channel",
    type: "categorical",
    options: ["Agent", "Online", "Broker"],
    rationale:
      "Channel correlates with underwriting scrutiny and observed fraud rates.",
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

/** A single claim as a flat record of feature -> numeric value (categoricals as index). */
export type FeatureVector = number[];

export interface LabeledSample {
  x: FeatureVector;
  y: 0 | 1; // 1 = fraud
}

/** Human-facing claim input (categoricals as their string label). */
export interface ClaimInput {
  policyAgeDays: number;
  claimAmount: number;
  incidentHour: number;
  daysToReport: number;
  expertReportScore: number;
  priorClaims12m: number;
  witnessPresent: string;
  policeReportFiled: string;
  channel: string;
}

/** Encode a human claim into the numeric vector the tree consumes. */
export function encodeClaim(input: ClaimInput): FeatureVector {
  return FEATURES.map((f) => {
    const raw = (input as unknown as Record<string, unknown>)[f.key];
    if (f.type === "categorical") {
      const idx = f.options!.indexOf(String(raw));
      return idx < 0 ? 0 : idx;
    }
    return Number(raw);
  });
}
