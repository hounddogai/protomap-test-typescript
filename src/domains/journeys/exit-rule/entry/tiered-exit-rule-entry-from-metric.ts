import { classifyBranchMetric } from "../../branch/entry/branch-metric-policy.js";
import { BranchMetric } from "../../branch/entry/branch-metric.js";
import { TieredExitRuleEntry, newTieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

export function summarizeBranchMetricsForEntry(items: BranchMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveTieredExitRuleEntriesFromMetric(items: BranchMetric[]): TieredExitRuleEntry[] {
  const out: TieredExitRuleEntry[] = [];
  for (const item of items) {
    const derived = newTieredExitRuleEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyTieredExitRuleEntry(item: TieredExitRuleEntry): string {
  return classifyBranchMetric(item.projectedTotal());
}
