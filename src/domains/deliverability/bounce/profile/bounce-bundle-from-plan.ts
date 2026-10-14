import { WarmupPlan } from "../../warmup/variance/warmup-plan.js";
import { normalizeWarmupVarianceCode } from "../../warmup/variance/warmup-variance-policy.js";
import { BounceBundle, newBounceBundle } from "./bounce-bundle.js";

export function summarizeWarmupPlansForBundle(items: WarmupPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveBounceBundlesFromPlan(items: WarmupPlan[]): BounceBundle[] {
  const out: BounceBundle[] = [];
  for (const item of items) {
    const derived = newBounceBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBounceBundle(item: BounceBundle): string {
  return normalizeWarmupVarianceCode(item.code);
}
