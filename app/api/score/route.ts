import { NextRequest, NextResponse } from "next/server";
import { scoreClaim, DEFAULT_THRESHOLD } from "@/lib/ml/infer";
import { FEATURES, type ClaimInput } from "@/lib/ml/schema";

export const runtime = "edge";

/** Basic shape + bounds validation. Never trust client input. */
function parseClaim(body: unknown): ClaimInput | { error: string } {
  if (typeof body !== "object" || body === null)
    return { error: "Body must be a JSON object." };
  const b = body as Record<string, unknown>;
  const out: Record<string, number | string> = {};

  for (const f of FEATURES) {
    const v = b[f.key];
    if (v === undefined || v === null)
      return { error: `Missing field: ${f.key}` };
    if (f.type === "numeric") {
      const n = Number(v);
      if (!Number.isFinite(n)) return { error: `${f.key} must be a number.` };
      const [lo, hi] = f.range!;
      out[f.key] = Math.min(hi, Math.max(lo, n));
    } else {
      const s = String(v);
      if (!f.options!.includes(s))
        return { error: `${f.key} must be one of ${f.options!.join(", ")}` };
      out[f.key] = s;
    }
  }
  return out as unknown as ClaimInput;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const claim = parseClaim((body as Record<string, unknown>)?.claim ?? body);
  if ("error" in claim)
    return NextResponse.json({ error: claim.error }, { status: 400 });

  const rawThreshold = (body as Record<string, unknown>)?.threshold;
  const threshold =
    rawThreshold === undefined
      ? DEFAULT_THRESHOLD
      : Math.min(1, Math.max(0, Number(rawThreshold)));

  const result = scoreClaim(claim, threshold);
  return NextResponse.json(result);
}
