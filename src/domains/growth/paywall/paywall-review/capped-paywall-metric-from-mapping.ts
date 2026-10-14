import { classifyLenientNudgeProposal } from "../../nudge/mapping/lenient-nudge-proposal-policy.js";
import { RollingNudgeMapping } from "../../nudge/mapping/rolling-nudge-mapping.js";
import { CappedPaywallMetric, newCappedPaywallMetric } from "./capped-paywall-metric.js";

export function summarizeRollingNudgeMappingsForMetric(items: RollingNudgeMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedPaywallMetricsFromMapping(items: RollingNudgeMapping[]): CappedPaywallMetric[] {
  const out: CappedPaywallMetric[] = [];
  for (const item of items) {
    const derived = newCappedPaywallMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCappedPaywallMetric(item: CappedPaywallMetric): string {
  return classifyLenientNudgeProposal(item.netTotal());
}
