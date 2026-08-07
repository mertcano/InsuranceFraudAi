# InsuranceFraudAi

https://insurancefraudai.vercel.app/

**A cost-sensitive decision tree that flags insurance claims worth investigating — before the payout leaves.**

Insurance fraud drains billions every year, and it tends to follow *rule-like* patterns: a brand-new policy, a late-night incident, a suspiciously large claim, no witnesses. InsuranceFraudAi learns those rule chains with a **CART decision tree** and raises a **Flag for Review** on the riskiest claims — always with a transparent, auditable reason for every call.

This is a portfolio project by an ML / AI engineer. The data is **synthetic** and for demonstration only; the app is a decision-support *triage* tool, not an automated claim-denial system.

---

## Table of contents

- [What this app actually does](#what-this-app-actually-does)
- [A beginner's guide — how to use the app](#a-beginners-guide--how-to-use-the-app)
- [The machine learning, in plain terms](#the-machine-learning-in-plain-terms)
- [Run it on your own computer](#run-it-on-your-own-computer)
- [Deploy it to Vercel](#deploy-it-to-vercel)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)

---

## What this app actually does

You give it the details of an insurance claim — how much money is being claimed, how old the policy is, what time the incident happened, and so on. The model instantly returns:

1. **A fraud probability** (0–100%) — how likely this claim is to be fraudulent.
2. **A decision band** — one of three actions:
   - 🟢 **Clear — auto-approve** (low risk)
   - 🟡 **Flag for Review** (a human should look at this)
   - 🔴 **High risk — escalate to SIU** (Special Investigations Unit)
3. **The exact reason** — the step-by-step rule chain the model followed to reach its decision, so an analyst can defend it to a manager or a regulator.

Everything runs **in your browser**. There is no login, no database, and no data leaves your machine.

---

## A beginner's guide — how to use the app

> You do **not** need to know anything about machine learning to use this. If you can move a slider, you can use it.

Once the app is open in your browser (see [Run it on your own computer](#run-it-on-your-own-computer) or the live Vercel link), here is what you'll see and what to do.

### Step 1 — Start with a ready-made scenario

Scroll to the **"Score a claim in real time"** section. Above the input fields there are a few **preset buttons** (e.g. a clearly clean claim, a borderline one, an obviously suspicious one). Click any of them to load a realistic example. This is the easiest way to see the model in action without typing anything.

### Step 2 — Read the result on the right

The panel on the right immediately shows:

- A big **percentage** — the fraud probability.
- A **colored badge** telling you what to do (Clear / Flag for Review / High risk).
- A **"Why this decision"** box listing the exact rules the claim triggered, e.g. *"Policy age ≤ 14 days"* or *"Claim amount > ₺45,000"*. Green arrows mean the rule pointed toward "clean"; red arrows mean it pointed toward "fraud".

### Step 3 — Change the claim and watch it re-score

Now adjust the inputs on the left. Each field is a slider or a dropdown:

| Field | What it means |
|---|---|
| **Policy age** | How many days ago the policy was bought. Fraud is more common right after a policy is created. |
| **Claim amount** | How much money is being claimed (in ₺). |
| **Incident hour** | The hour of day the incident happened (0–23). Late-night incidents are riskier. |
| **Days to report** | How long the claimant waited before reporting. |
| **Adjuster suspicion score** | The human expert's gut-feel suspicion rating. |
| **Prior claims (12m)** | How many claims this person filed in the last year. |
| **Witness present** | Was there an independent witness? |
| **Police report filed** | Was an official police report made? |
| **Channel** | How the claim was submitted (agent, online, etc.). |

As you move any slider, **the result updates instantly.** Try dragging *Claim amount* up while setting *Policy age* to just a few days — watch the probability climb and the decision band turn red. This is the core "aha" of the app: you can *see* what makes a claim look suspicious.

### Step 4 — Tune the "operating point" (optional, more advanced)

Below the result there's a **threshold slider** labeled *Operating point*. This controls how strict the model is:

- **Move it left** → the model flags *more* claims (catches more fraud, but also more false alarms). This is "catch everything" mode.
- **Move it right** → the model flags *fewer* claims (fewer false alarms, but misses more fraud). This is "only flag the obvious ones" mode.

Two shortcut buttons pick sensible presets for you:
- **Cost-optimal** — the setting that saves the insurer the most money overall (missing fraud is expensive, so this leans toward catching more).
- **Balanced / F1** — the setting that best balances catching fraud against false alarms.

There is no single "correct" threshold — it's a **business decision** about how much you fear a missed fraud vs. how much a false alarm annoys an honest customer. The app lets you feel that trade-off directly.

### Step 5 — Explore the performance charts

Scroll down to **"Model performance"** to see how good the model actually is, measured on data it never saw during training:

- **Precision / recall curve** — shows the trade-off from Step 4 as a graph.
- **Confusion matrix** — a simple 2×2 grid of "got it right" vs. "got it wrong", split into the four possible outcomes.
- **Feature importance** — which claim details matter most to the model's decisions.

**That's it.** Load a preset, read the result, move the sliders, and (if you're curious) play with the threshold. You now know how to use InsuranceFraudAi.

---

## The machine learning, in plain terms

If you want to understand what's under the hood, here's the short version.

- **Why a decision tree?** Fraud investigators think in *rules* — "new policy **and** big claim **and** no witness → look closer." A decision tree learns exactly that kind of yes/no rule chain, which makes every prediction explainable. That's a much better fit here than a black-box neural network.
- **The data is synthetic but realistic.** We generate ~6,000 fake claims with a seeded random generator, so the numbers are reproducible and no real customer data is used. About 12% are fraudulent — fraud is *rare*, which matters a lot (see below).
- **Cost-sensitive learning.** Missing a real fraud (a *false negative*) costs the insurer far more than annoying an honest customer with an extra review (a *false positive*). The model is trained to take that imbalance seriously — via class weights during training and a cost-aware decision threshold at prediction time.
- **Why not just measure "accuracy"?** Because fraud is only ~12% of claims, a lazy model that says *"everything is clean"* would be 88% accurate — and utterly useless. So we measure **precision** (of the claims we flag, how many are truly fraud) and **recall** (of all the fraud out there, how much did we catch), and the trade-off between them.

Model performance on the held-out test set (claims the model never trained on):

| Metric | Value |
|---|---|
| ROC AUC | **0.781** |
| Precision lift vs. base rate | **~3.2×** |
| Recall at cost-optimal threshold | **~76%** of all fraud caught |
| Tree shape | depth 6, 38 leaves |

The model is retrained automatically **every time you build the project** (`npm run build` runs the training script first), producing a small static `model.json` artifact that the app reads at runtime.

---

## Run it on your own computer

> **Prerequisite:** [Node.js](https://nodejs.org) version **18.17 or newer**. To check what you have, open a terminal and run `node -v`. If you don't have it, download the "LTS" version from the link.

### 1. Open a terminal in the project folder

```bash
cd InsuranceFraudAi
```

### 2. Install the dependencies (only needed the first time)

```bash
npm install
```

### 3. Train the model and start the app

For everyday development (auto-reloads when you edit code):

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

> **Note:** `npm run dev` uses the model artifact that's already in the repo. If you want to regenerate the model from scratch first, run `npm run train` once, then `npm run dev`.

### 4. (Optional) Build the production version locally

To reproduce exactly what Vercel will build — this trains the model *and* compiles the app:

```bash
npm run build
npm start
```

### Handy commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server at `localhost:3000` |
| `npm run build` | Train the model, then build the production app |
| `npm start` | Serve the production build (run after `npm run build`) |
| `npm run train` | Regenerate the model artifact only |
| `npm run typecheck` | Check the TypeScript types |
| `npm run lint` | Run the linter |

---

## Deploy it to Vercel

Vercel is the easiest way to put this on the public internet for free. The project is already configured — you don't need to change any build settings.

### Option A — the no-terminal way (recommended for beginners)

1. **Put the code on GitHub.**
   - Create a new, empty repository on [github.com](https://github.com/new) (e.g. name it `InsuranceFraudAi`).
   - In a terminal inside the project folder, run:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: InsuranceFraudAi"
     git branch -M main
     git remote add origin https://github.com/<your-username>/InsuranceFraudAi.git
     git push -u origin main
     ```
2. **Import it into Vercel.**
   - Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
   - Click **Add New… → Project**, then select your `InsuranceFraudAi` repository.
   - Vercel auto-detects Next.js. **Leave every setting at its default** — the build command (`npm run build`) already trains the model. You do **not** need any environment variables.
   - In the **Project Name** field, type **`insurancefraudai`** (Vercel lowercases it) so your URL becomes `insurancefraudai.vercel.app`.
   - Click **Deploy** and wait ~1–2 minutes.
3. **Done.** Vercel gives you a live URL. Every time you `git push` to `main`, it redeploys automatically.

### Option B — the Vercel CLI way

If you prefer the terminal:

```bash
npm install -g vercel
cd InsuranceFraudAi
vercel
```

Follow the prompts. When it asks for the project name, enter **`insurancefraudai`**. Then push it live with:

```bash
vercel --prod
```

### Why deployment "just works"

- The training step runs **at build time** on Vercel's servers (it's the first half of `npm run build`), so the freshly-trained `model.json` is baked into the deployment.
- The training is **deterministic** (seeded random numbers), so the model Vercel builds is identical to the one you get locally.
- There's no database, no secrets, and no runtime dependencies to configure.

---

## Project structure

```
InsuranceFraudAi/
├── app/
│   ├── page.tsx              # The main page (hero, scorer, metrics, explainer)
│   ├── layout.tsx            # Root layout & global styles
│   └── api/score/route.ts    # Edge API endpoint for scoring a claim
├── components/
│   ├── ClaimScorer.tsx       # The interactive scoring widget
│   ├── PrecisionRecallChart.tsx
│   ├── ConfusionMatrix.tsx
│   ├── FeatureImportance.tsx
│   └── ui.tsx                # Shared UI primitives (Badge, Card, StatTile…)
├── lib/
│   ├── ml/
│   │   ├── schema.ts         # Feature definitions & claim encoding
│   │   ├── tree.ts           # CART decision-tree implementation
│   │   ├── data.ts           # Deterministic synthetic data generator
│   │   ├── metrics.ts        # Precision/recall, ROC, cost analysis
│   │   ├── infer.ts          # Runtime inference (loads the trained model)
│   │   └── artifact/
│   │       └── model.json    # Trained model (regenerated at build time)
│   └── presets.ts            # Example claims for the demo
└── scripts/
    └── train.ts              # Training pipeline (data → tree → metrics → model.json)
```

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **TailwindCSS** for styling
- **Recharts** for the performance charts
- **lucide-react** for icons
- A hand-written **CART decision tree** and synthetic-data pipeline — no ML libraries, so the model logic is fully transparent and auditable.

---

_Synthetic data. Decision support only. Not an automated claim-denial system._
