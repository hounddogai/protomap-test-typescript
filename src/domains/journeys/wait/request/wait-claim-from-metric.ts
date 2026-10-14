import { LenientBranchMetric } from "../../branch/metric/lenient-branch-metric.js";
import { lenientBranchTargetWeight } from "../../branch/metric/lenient-branch-target-policy.js";
import { WaitClaim, newWaitClaim } from "./wait-claim.js";

export function summarizeLenientBranchMetricsForClaim(items: LenientBranchMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWaitClaimsFromMetric(items: LenientBranchMetric[]): WaitClaim[] {
  const out: WaitClaim[] = [];
  for (const item of items) {
    const derived = newWaitClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWaitClaim(item: WaitClaim): number {
  return lenientBranchTargetWeight(6, true);
}
