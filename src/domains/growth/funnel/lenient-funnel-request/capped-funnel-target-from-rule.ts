import { BatchedFunnelRule } from "../funnel-variance/batched-funnel-rule.js";
import { normalizeScheduledFunnelVarianceCode } from "../funnel-variance/scheduled-funnel-variance-policy.js";
import { CappedFunnelTarget, newCappedFunnelTarget } from "./capped-funnel-target.js";

export function summarizeBatchedFunnelRulesForTarget(items: BatchedFunnelRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCappedFunnelTargetsFromRule(items: BatchedFunnelRule[]): CappedFunnelTarget[] {
  const out: CappedFunnelTarget[] = [];
  for (const item of items) {
    const derived = newCappedFunnelTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCappedFunnelTarget(item: CappedFunnelTarget): string {
  return normalizeScheduledFunnelVarianceCode(item.code);
}
