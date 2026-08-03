/**
 * CART decision tree with cost-sensitive learning.
 *
 * Why a decision tree for fraud triage:
 *  - Fraud follows rule-like chains ("new policy" AND "night incident" AND
 *    "no police report"), which axis-aligned splits capture directly.
 *  - Every prediction yields a human-readable decision path — essential for
 *    audit and for the SIU analyst who must justify opening an investigation.
 *
 * Cost-sensitive learning:
 *  Missing a fraud (false negative) is far more expensive than reviewing a
 *  clean claim (false positive). We inject a class-weight vector into the Gini
 *  impurity and the leaf-vote so the tree is pulled toward catching fraud, then
 *  we tune the decision threshold separately for the precision/recall trade-off.
 */

import type { LabeledSample } from "./schema";

export interface TreeNode {
  /** Leaf probability of fraud in [0,1]; present only on leaves. */
  probability?: number;
  /** Split feature index; present only on internal nodes. */
  featureIndex?: number;
  /** Split threshold: go left if value <= threshold. */
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  /** Weighted sample count reaching this node (for viz + importance). */
  samples: number;
  /** Raw class counts [clean, fraud] reaching this node. */
  counts: [number, number];
}

export interface TrainConfig {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  /** [weightClean, weightFraud]; fraud > clean makes false negatives costly. */
  classWeights: [number, number];
}

/**
 * Mild class weighting keeps the minority (fraud) class from being ignored
 * during splitting. The heavy business cost asymmetry is applied separately, at
 * the decision *threshold* (see metrics.ts) — the principled place for it per
 * Elkan's theorem on cost-sensitive classification.
 */
export const DEFAULT_CONFIG: TrainConfig = {
  maxDepth: 6,
  minSamplesSplit: 30,
  minSamplesLeaf: 30,
  classWeights: [1, 3],
};

/** Weighted Gini impurity of a class-count pair. */
function weightedGini(
  counts: [number, number],
  w: [number, number],
): number {
  const c0 = counts[0] * w[0];
  const c1 = counts[1] * w[1];
  const total = c0 + c1;
  if (total === 0) return 0;
  const p0 = c0 / total;
  const p1 = c1 / total;
  return 1 - (p0 * p0 + p1 * p1);
}

function classCounts(samples: LabeledSample[]): [number, number] {
  let c0 = 0;
  let c1 = 0;
  for (const s of samples) s.y === 1 ? c1++ : c0++;
  return [c0, c1];
}

/** Weighted fraud probability at a leaf (cost-sensitive vote). */
function leafProbability(
  counts: [number, number],
  w: [number, number],
): number {
  const c0 = counts[0] * w[0];
  const c1 = counts[1] * w[1];
  const total = c0 + c1;
  return total === 0 ? 0 : c1 / total;
}

interface BestSplit {
  featureIndex: number;
  threshold: number;
  gain: number;
  left: LabeledSample[];
  right: LabeledSample[];
}

/**
 * Find the split maximizing weighted-Gini reduction. Candidate thresholds are
 * midpoints between consecutive unique sorted values per feature — the standard
 * CART search, exact for the sample sizes used here.
 */
function findBestSplit(
  samples: LabeledSample[],
  nFeatures: number,
  cfg: TrainConfig,
): BestSplit | null {
  const parentCounts = classCounts(samples);
  const parentImpurity = weightedGini(parentCounts, cfg.classWeights);
  let best: BestSplit | null = null;

  for (let f = 0; f < nFeatures; f++) {
    const sorted = [...samples].sort((a, b) => a.x[f] - b.x[f]);
    for (let i = 0; i < sorted.length - 1; i++) {
      const v = sorted[i].x[f];
      const next = sorted[i + 1].x[f];
      if (v === next) continue; // no valid split between identical values
      const threshold = (v + next) / 2;

      const left = sorted.slice(0, i + 1);
      const right = sorted.slice(i + 1);
      if (
        left.length < cfg.minSamplesLeaf ||
        right.length < cfg.minSamplesLeaf
      )
        continue;

      const lC = classCounts(left);
      const rC = classCounts(right);
      const wL = (lC[0] * cfg.classWeights[0] + lC[1] * cfg.classWeights[1]);
      const wR = (rC[0] * cfg.classWeights[0] + rC[1] * cfg.classWeights[1]);
      const wTotal = wL + wR;

      const childImpurity =
        (wL / wTotal) * weightedGini(lC, cfg.classWeights) +
        (wR / wTotal) * weightedGini(rC, cfg.classWeights);
      const gain = parentImpurity - childImpurity;

      if (!best || gain > best.gain) {
        best = { featureIndex: f, threshold, gain, left, right };
      }
    }
  }
  return best && best.gain > 1e-7 ? best : null;
}

function buildNode(
  samples: LabeledSample[],
  depth: number,
  nFeatures: number,
  cfg: TrainConfig,
): TreeNode {
  const counts = classCounts(samples);
  const weighted =
    counts[0] * cfg.classWeights[0] + counts[1] * cfg.classWeights[1];

  const asLeaf = (): TreeNode => ({
    probability: leafProbability(counts, cfg.classWeights),
    samples: weighted,
    counts,
  });

  if (
    depth >= cfg.maxDepth ||
    samples.length < cfg.minSamplesSplit ||
    counts[0] === 0 ||
    counts[1] === 0
  ) {
    return asLeaf();
  }

  const split = findBestSplit(samples, nFeatures, cfg);
  if (!split) return asLeaf();

  return {
    featureIndex: split.featureIndex,
    threshold: split.threshold,
    samples: weighted,
    counts,
    left: buildNode(split.left, depth + 1, nFeatures, cfg),
    right: buildNode(split.right, depth + 1, nFeatures, cfg),
  };
}

export function trainTree(
  samples: LabeledSample[],
  cfg: TrainConfig = DEFAULT_CONFIG,
): TreeNode {
  const nFeatures = samples[0].x.length;
  return buildNode(samples, 0, nFeatures, cfg);
}

/** Predict fraud probability for one feature vector. */
export function predictProba(tree: TreeNode, x: number[]): number {
  let node = tree;
  while (node.featureIndex !== undefined && node.left && node.right) {
    node = x[node.featureIndex] <= node.threshold! ? node.left : node.right;
  }
  return node.probability ?? 0;
}

/** Walk the tree and return the ordered decision path for explainability. */
export interface PathStep {
  featureIndex: number;
  threshold: number;
  value: number;
  direction: "left" | "right";
  wentLeft: boolean;
}

export function decisionPath(tree: TreeNode, x: number[]): PathStep[] {
  const path: PathStep[] = [];
  let node = tree;
  while (node.featureIndex !== undefined && node.left && node.right) {
    const wentLeft = x[node.featureIndex] <= node.threshold!;
    path.push({
      featureIndex: node.featureIndex,
      threshold: node.threshold!,
      value: x[node.featureIndex],
      direction: wentLeft ? "left" : "right",
      wentLeft,
    });
    node = wentLeft ? node.left : node.right;
  }
  return path;
}

/**
 * Gini-based feature importance: total impurity reduction attributed to each
 * feature, weighted by samples reaching the node, normalized to sum to 1.
 */
export function featureImportances(
  tree: TreeNode,
  nFeatures: number,
  classWeights: [number, number],
): number[] {
  const imp = new Array(nFeatures).fill(0);

  const visit = (node: TreeNode) => {
    if (node.featureIndex === undefined || !node.left || !node.right) return;
    const parentG = weightedGini(node.counts, classWeights) * node.samples;
    const leftG =
      weightedGini(node.left.counts, classWeights) * node.left.samples;
    const rightG =
      weightedGini(node.right.counts, classWeights) * node.right.samples;
    imp[node.featureIndex] += parentG - leftG - rightG;
    visit(node.left);
    visit(node.right);
  };
  visit(tree);

  const total = imp.reduce((a, b) => a + b, 0);
  return total > 0 ? imp.map((v) => v / total) : imp;
}
