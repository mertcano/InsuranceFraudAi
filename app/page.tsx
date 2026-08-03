import {
  ShieldCheck,
  GitBranch,
  Scale,
  Gauge,
  ArrowRight,
  Github,
  Activity,
} from "lucide-react";
import ClaimScorer from "@/components/ClaimScorer";
import PrecisionRecallChart from "@/components/PrecisionRecallChart";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import FeatureImportance from "@/components/FeatureImportance";
import { Badge, Card, SectionHeader, StatTile } from "@/components/ui";
import {
  ARTIFACT_META,
  OPERATING_POINT,
  COST_POINT,
  BASELINE_AT_50,
} from "@/lib/ml/infer";

const meta = ARTIFACT_META as {
  rocAuc: number;
  depth: number;
  leaves: number;
  trainSize: number;
  testSize: number;
  fraudRateTest: number;
};
const op = OPERATING_POINT as { precision: number; recall: number; f1: number };
const cost = COST_POINT as {
  recall: number;
  threshold: number;
  expectedCost: number;
};
const baseline = BASELINE_AT_50 as { expectedCost: number };
const savings = baseline.expectedCost - cost.expectedCost;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      {/* ---------- Nav ---------- */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-trust-500/15 ring-1 ring-trust-500/30">
            <ShieldCheck className="h-5 w-5 text-trust-300" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-100">
            InsuranceFraud<span className="text-trust-400">Ai</span>
          </span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <a
            href="#try"
            className="rounded-lg px-3 py-1.5 text-slate-400 transition-colors duration-200 hover:text-slate-100"
          >
            Try it
          </a>
          <a
            href="#performance"
            className="rounded-lg px-3 py-1.5 text-slate-400 transition-colors duration-200 hover:text-slate-100"
          >
            Performance
          </a>
          <a
            href="#how"
            className="rounded-lg px-3 py-1.5 text-slate-400 transition-colors duration-200 hover:text-slate-100"
          >
            How it works
          </a>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="animate-fade-up pt-10 sm:pt-16">
        <Badge tone="trust">
          <Activity className="h-3.5 w-3.5" />
          Cost-sensitive decision tree · fully explainable
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-slate-50 sm:text-6xl">
          Flag the claims worth investigating —{" "}
          <span className="bg-gradient-to-r from-trust-400 to-trust-600 bg-clip-text text-transparent">
            before the payout leaves.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Insurance fraud drains billions each year, and it follows rule-like
          patterns — a brand-new policy, a late-night incident, a suspiciously
          large claim. InsuranceFraudAi learns those rule chains with a
          cost-sensitive decision tree and raises a{" "}
          <span className="font-medium text-caution-400">Flag for Review</span>{" "}
          on the riskiest files, with a transparent reason for every call.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#try"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-trust-600 px-5 py-3 text-sm font-semibold text-white shadow-glow transition-colors duration-200 hover:bg-trust-500"
          >
            Score a claim <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#performance"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-white/5"
          >
            See the metrics
          </a>
        </div>

        {/* KPI row */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="ROC AUC"
            value={meta.rocAuc.toFixed(3)}
            hint="Held-out test set"
            accent="trust"
          />
          <StatTile
            label="Recall @ cost-optimal"
            value={`${Math.round(cost.recall * 100)}%`}
            hint={`of all fraud caught @ ${cost.threshold.toFixed(2)}`}
            accent="safe"
          />
          <StatTile
            label="Precision lift"
            value={`${(op.precision / meta.fraudRateTest).toFixed(1)}×`}
            hint="vs 12% base rate"
            accent="caution"
          />
          <StatTile
            label="Loss avoided"
            value={`₺${Math.round(savings / 1000)}k`}
            hint="vs naïve 0.50 cutoff, test set"
            accent="alert"
          />
        </div>
      </section>

      {/* ---------- Try it ---------- */}
      <section id="try" className="scroll-mt-8 pt-24">
        <SectionHeader
          eyebrow="Interactive"
          title="Score a claim in real time"
          description="Adjust the claim variables — the model re-scores instantly, entirely in your browser, and shows the exact decision path it took. Move the operating point to trade precision against recall."
        />
        <ClaimScorer />
      </section>

      {/* ---------- Performance ---------- */}
      <section id="performance" className="scroll-mt-8 pt-24">
        <SectionHeader
          eyebrow="Model performance"
          title="Precision, recall & the cost trade-off"
          description="Fraud is rare and false negatives are expensive, so accuracy is the wrong yardstick. These are the numbers that matter, measured on a held-out test set the model never saw during training."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-slate-200">
              Precision / recall vs decision threshold
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              Every threshold is a different business choice. There is no free
              lunch — catching more fraud always costs precision.
            </p>
            <PrecisionRecallChart />
          </Card>
          <Card>
            <h3 className="mb-1 text-sm font-semibold text-slate-200">
              Confusion matrix at the balanced operating point
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              Where the model is right, and — just as important — how it is
              wrong.
            </p>
            <ConfusionMatrix />
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="mb-1 text-sm font-semibold text-slate-200">
              What drives the model
            </h3>
            <p className="mb-5 text-xs text-slate-500">
              Feature importance from total impurity reduction. The adjuster
              suspicion score, policy age and claim size dominate — matching how
              a human investigator triages.
            </p>
            <FeatureImportance />
          </Card>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="scroll-mt-8 pt-24">
        <SectionHeader
          eyebrow="Under the hood"
          title="How InsuranceFraudAi works"
          description="A deliberately simple, auditable pipeline. No black boxes — every prediction can be traced to a rule chain and defended to a regulator."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: GitBranch,
              title: "CART decision tree",
              body: "A classification tree learns axis-aligned rule chains that mirror how fraud actually unfolds — exactly the structure investigators reason about.",
            },
            {
              Icon: Scale,
              title: "Cost-sensitive learning",
              body: "Class weights during training plus a cost-optimal threshold at inference encode that a missed fraud hurts far more than a false alarm.",
            },
            {
              Icon: Gauge,
              title: "Tunable operating point",
              body: "Slide the threshold to move along the precision/recall curve and hit whatever risk appetite the fraud team is working to.",
            },
            {
              Icon: ShieldCheck,
              title: "Explainable by design",
              body: "Every score ships with the decision path and the top risk factors, so an analyst can justify opening — or closing — an investigation.",
            },
          ].map(({ Icon, title, body }) => (
            <Card key={title} className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-trust-500/10 ring-1 ring-trust-500/20">
                <Icon className="h-5 w-5 text-trust-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-400">{body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Training data
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {meta.trainSize.toLocaleString()} synthetic claims, seeded &
                reproducible, ~12% fraud base rate
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Tree shape
              </div>
              <div className="mt-1 text-sm text-slate-300">
                depth {meta.depth} · {meta.leaves} leaves · evaluated on{" "}
                {meta.testSize.toLocaleString()} held-out claims
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Runtime
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Inference is pure tree traversal — microseconds, on the edge or
                in the browser
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="mt-24 border-t border-white/5 pt-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-medium text-slate-300">
              InsuranceFraudAi
            </div>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
              A portfolio project by an ML / AI engineer. Data is synthetic and
              for demonstration only; this is a decision-support triage tool, not
              an automated claim-denial system.
            </p>
          </div>
          <a
            href="https://vercel.com"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-slate-200"
          >
            <Github className="h-4 w-4" /> Built with Next.js & TypeScript
          </a>
        </div>
      </footer>
    </main>
  );
}
