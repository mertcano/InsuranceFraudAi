/**
 * Deterministic synthetic claim generator.
 *
 * Real fraud datasets are confidential, so we synthesize claims from documented
 * fraud patterns. A seeded RNG keeps the dataset — and therefore the trained
 * model and reported metrics — reproducible on every Vercel build.
 *
 * Design (single-stage, calibrated):
 *  1. Draw each observable feature from a realistic *population* distribution
 *     (NOT conditioned on a hidden fraud flag).
 *  2. Compute a fraud log-odds from a hand-tuned logistic model over those
 *     features, with the intercept calibrated so the realized fraud rate ≈
 *     `fraudBaseRate`.
 *  3. Add logistic noise, then sample the label once.
 *
 * This produces genuine class overlap — the reason precision and recall
 * actually trade off — instead of two cleanly separable clusters.
 */

import { FEATURES, type LabeledSample } from "./schema";

/** Mulberry32 — tiny, fast, seedable PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  // Box–Muller
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

/** Standard-logistic sample: log(u/(1-u)). Used for label noise. */
function logisticNoise(rng: () => number, scale: number): number {
  const u = clamp(rng(), 1e-9, 1 - 1e-9);
  return scale * Math.log(u / (1 - u));
}

export interface GenConfig {
  n: number;
  fraudBaseRate: number; // realistic base rate ~10-15%
  seed: number;
  /** Std-dev of extra logistic noise on the log-odds; higher = more overlap. */
  noise: number;
}

export const DEFAULT_GEN: GenConfig = {
  n: 6000,
  fraudBaseRate: 0.12,
  seed: 42,
  noise: 0.3,
};

/** Draw one claim's raw features from population distributions. */
function drawFeatures(rng: () => number): number[] {
  // policyAgeDays — most policies are established; a minority are fresh.
  const policyAgeDays = clamp(
    rng() < 0.25 ? rng() * 120 : 150 + Math.abs(randn(rng)) * 450,
    0,
    1460,
  );
  // claimAmount — right-skewed, most claims modest.
  const claimAmount = clamp(
    4000 + Math.abs(randn(rng)) * 16000 + (rng() < 0.08 ? rng() * 120000 : 0),
    500,
    250000,
  );
  // incidentHour — daytime-heavy with a night tail.
  const incidentHour =
    rng() < 0.8
      ? Math.floor(clamp(13 + randn(rng) * 4, 6, 23))
      : Math.floor(rng() * 6); // night window 0-5
  // daysToReport — usually prompt.
  const daysToReport = clamp(Math.abs(randn(rng)) * 4 + rng() * 2, 0, 90);
  // expertReportScore — centered mid-scale.
  const expertReportScore = clamp(40 + randn(rng) * 20, 0, 100);
  // priorClaims12m — mostly 0-1.
  const priorClaims12m = clamp(Math.round(Math.abs(randn(rng)) * 1.1), 0, 8);
  // witnessPresent — present ~55% of the time.
  const witnessPresent = rng() < 0.55 ? 1 : 0;
  // policeReportFiled — filed ~75% of the time.
  const policeReportFiled = rng() < 0.75 ? 1 : 0;
  // channel: 0=Agent 1=Online 2=Broker.
  const cr = rng();
  const channel = cr < 0.45 ? 0 : cr < 0.8 ? 1 : 2;

  return [
    policyAgeDays,
    claimAmount,
    incidentHour,
    daysToReport,
    expertReportScore,
    priorClaims12m,
    witnessPresent,
    policeReportFiled,
    channel,
  ];
}

/**
 * Fraud log-odds contribution from features (excluding the calibrated
 * intercept). Coefficients encode documented directional effects; magnitudes
 * are chosen so no single feature is deterministic.
 */
function fraudLogOdds(x: number[]): number {
  const [
    policyAgeDays,
    claimAmount,
    incidentHour,
    daysToReport,
    expertReportScore,
    priorClaims12m,
    witnessPresent,
    policeReportFiled,
    channel,
  ] = x;

  // A defining fraud pattern gets an interaction bonus: a brand-new policy with
  // a large, late-reported night claim is far riskier than the sum of parts.
  const newPolicy = policyAgeDays < 90 ? 1 : 0;
  const nightIncident = incidentHour <= 5 ? 1 : 0;
  const bigClaim = claimAmount > 40000 ? 1 : 0;
  const interaction = 1.6 * newPolicy * (nightIncident + bigClaim);

  return (
    3.2 * (1 - policyAgeDays / 1460) + // newer policy → higher risk
    2.4 * (claimAmount / 250000) + // larger claim → higher risk
    1.5 * nightIncident + // night incident
    1.8 * (daysToReport / 90) + // late report
    4.0 * (expertReportScore / 100 - 0.4) + // adjuster suspicion (centered)
    0.9 * (priorClaims12m / 8) +
    0.7 * (1 - witnessPresent) + // no witness
    1.0 * (1 - policeReportFiled) + // no police report
    0.5 * (channel === 1 ? 1 : 0) + // online channel
    interaction
  );
}

/**
 * Calibrate the intercept so the population fraud rate ≈ target. We solve for
 * the bias b such that mean(sigmoid(b + logOdds)) ≈ target via bisection on a
 * fixed probe sample drawn from the same seed family.
 */
function calibrateIntercept(cfg: GenConfig): number {
  const probeRng = mulberry32(cfg.seed ^ 0x9e3779b9);
  const probeN = Math.min(cfg.n, 4000);
  // Store (logOdds, noise) pairs so the calibrated rate reflects the SAME
  // noise the real sampler adds — E[sigmoid(b+lo+eps)] != sigmoid(b+lo).
  const probes: Array<[number, number]> = [];
  for (let i = 0; i < probeN; i++) {
    probes.push([
      fraudLogOdds(drawFeatures(probeRng)),
      logisticNoise(probeRng, cfg.noise),
    ]);
  }
  const rate = (b: number) =>
    probes.reduce((acc, [lo, eps]) => acc + sigmoid(b + lo + eps), 0) /
    probes.length;

  let lo = -12;
  let hi = 12;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    if (rate(mid) > cfg.fraudBaseRate) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function generateDataset(cfg: GenConfig = DEFAULT_GEN): LabeledSample[] {
  const intercept = calibrateIntercept(cfg);
  const rng = mulberry32(cfg.seed);
  const out: LabeledSample[] = [];

  for (let i = 0; i < cfg.n; i++) {
    const x = drawFeatures(rng);
    if (x.length !== FEATURES.length) {
      throw new Error(
        `Generated vector length ${x.length} != schema ${FEATURES.length}`,
      );
    }
    const z = intercept + fraudLogOdds(x) + logisticNoise(rng, cfg.noise);
    const y: 0 | 1 = rng() < sigmoid(z) ? 1 : 0;
    out.push({ x, y });
  }
  return out;
}

/** Deterministic split — seeded shuffle then cut. */
export function trainTestSplit(
  data: LabeledSample[],
  testFraction = 0.25,
  seed = 7,
): { train: LabeledSample[]; test: LabeledSample[] } {
  const rng = mulberry32(seed);
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cut = Math.floor(shuffled.length * (1 - testFraction));
  return { train: shuffled.slice(0, cut), test: shuffled.slice(cut) };
}
