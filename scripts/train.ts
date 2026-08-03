/**
 * Build-time training pipeline.
 *
 * Runs before `next build` (see package.json). Generates the synthetic dataset,
 * trains the cost-sensitive tree, evaluates it on a held-out set, and writes a
 * single JSON artifact the app loads at runtime. Training never happens on the
 * request path — inference is pure tree traversal.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { FEATURES } from "../lib/ml/schema.js";
import { generateDataset, trainTestSplit, DEFAULT_GEN } from "../lib/ml/data.js";
import {
  trainTree,
  featureImportances,
  DEFAULT_CONFIG,
  type TreeNode,
} from "../lib/ml/tree.js";
import {
  scoreSet,
  sweepThresholds,
  bestCostThreshold,
  bestF1Threshold,
  auc,
  metricsFromConfusion,
  confusionAt,
  DEFAULT_COST,
} from "../lib/ml/metrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "lib", "ml", "artifact");

function countLeaves(node: TreeNode): number {
  if (node.left && node.right) return countLeaves(node.left) + countLeaves(node.right);
  return 1;
}
function maxDepthOf(node: TreeNode): number {
  if (node.left && node.right)
    return 1 + Math.max(maxDepthOf(node.left), maxDepthOf(node.right));
  return 0;
}

function main() {
  const t0 = Date.now();
  console.log("[train] generating dataset…");
  const data = generateDataset(DEFAULT_GEN);
  const { train, test } = trainTestSplit(data, 0.25, 7);

  const fraudTrain = train.filter((s) => s.y === 1).length;
  const fraudTest = test.filter((s) => s.y === 1).length;
  console.log(
    `[train] ${train.length} train (${fraudTrain} fraud) / ${test.length} test (${fraudTest} fraud)`,
  );

  console.log("[train] fitting cost-sensitive CART…");
  const tree = trainTree(train, DEFAULT_CONFIG);

  const importancesRaw = featureImportances(
    tree,
    FEATURES.length,
    DEFAULT_CONFIG.classWeights,
  );
  const importances = FEATURES.map((f, i) => ({
    key: f.key,
    label: f.label,
    importance: importancesRaw[i],
  })).sort((a, b) => b.importance - a.importance);

  // Evaluate on held-out test set.
  const { probs, labels } = scoreSet(tree, test);
  const sweep = sweepThresholds(probs, labels, DEFAULT_COST);
  const costOpt = bestCostThreshold(sweep);
  const f1Opt = bestF1Threshold(sweep);
  const rocAuc = auc(sweep);

  // Default operating point = F1-optimal threshold (defensible balance of
  // precision and recall). The cost-optimal threshold is exposed alongside so
  // the UI can let an analyst trade precision for recall interactively.
  const operating = metricsFromConfusion(
    confusionAt(probs, labels, f1Opt.threshold),
    f1Opt.threshold,
    DEFAULT_COST,
  );

  // Baseline: what a naive "flag nothing" or "flag by accuracy-optimal" costs,
  // to show the cost-sensitive win.
  const at50 = metricsFromConfusion(
    confusionAt(probs, labels, 0.5),
    0.5,
    DEFAULT_COST,
  );

  const artifact = {
    meta: {
      generatedAt: new Date().toISOString(),
      trainSize: train.length,
      testSize: test.length,
      fraudRateTrain: fraudTrain / train.length,
      fraudRateTest: fraudTest / test.length,
      config: DEFAULT_CONFIG,
      cost: DEFAULT_COST,
      leaves: countLeaves(tree),
      depth: maxDepthOf(tree),
      rocAuc,
    },
    features: FEATURES,
    importances,
    tree,
    operatingPoint: operating,
    costPoint: metricsFromConfusion(
      confusionAt(probs, labels, costOpt.threshold),
      costOpt.threshold,
      DEFAULT_COST,
    ),
    thresholds: {
      costOptimal: costOpt.threshold,
      f1Optimal: f1Opt.threshold,
    },
    baselineAt50: at50,
    sweep: sweep.map((m) => ({
      threshold: m.threshold,
      precision: m.precision,
      recall: m.recall,
      f1: m.f1,
      fpr: m.fpr,
      expectedCost: m.expectedCost,
    })),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, "model.json");
  writeFileSync(outPath, JSON.stringify(artifact, null, 2));

  const costPoint = metricsFromConfusion(
    confusionAt(probs, labels, costOpt.threshold),
    costOpt.threshold,
    DEFAULT_COST,
  );
  console.log(
    `[train] done in ${Date.now() - t0}ms → ${outPath}\n` +
      `        AUC=${rocAuc.toFixed(3)}  depth=${artifact.meta.depth}  leaves=${artifact.meta.leaves}\n` +
      `        F1-optimal@${operating.threshold.toFixed(2)}  ` +
      `P=${operating.precision.toFixed(3)} R=${operating.recall.toFixed(3)} F1=${operating.f1.toFixed(3)}\n` +
      `        cost-optimal@${costPoint.threshold.toFixed(2)}  ` +
      `P=${costPoint.precision.toFixed(3)} R=${costPoint.recall.toFixed(3)}  ` +
      `saves ₺${Math.round(at50.expectedCost - costPoint.expectedCost).toLocaleString()} vs 0.50 threshold`,
  );
}

main();
