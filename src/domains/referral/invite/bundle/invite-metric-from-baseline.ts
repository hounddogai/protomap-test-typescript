import { classifyManualTierPolicy } from "../../tier/manifest/manual-tier-policy-policy.js";
import { TierBaseline } from "../../tier/manifest/tier-baseline.js";
import { InviteMetric, newInviteMetric } from "./invite-metric.js";

export function summarizeTierBaselinesForMetric(items: TierBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveInviteMetricsFromBaseline(items: TierBaseline[]): InviteMetric[] {
  const out: InviteMetric[] = [];
  for (const item of items) {
    const derived = newInviteMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeInviteMetric(item: InviteMetric): string {
  return classifyManualTierPolicy(item.projectedLoad());
}
