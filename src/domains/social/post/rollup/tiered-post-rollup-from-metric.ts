import { classifyLenientReplyMetric } from "../../reply/reply-metric/lenient-reply-metric-policy.js";
import { PrimaryReplyMetric } from "../../reply/reply-metric/primary-reply-metric.js";
import { TieredPostRollup, newTieredPostRollup } from "./tiered-post-rollup.js";

export function summarizePrimaryReplyMetricsForRollup(items: PrimaryReplyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveTieredPostRollupsFromMetric(items: PrimaryReplyMetric[]): TieredPostRollup[] {
  const out: TieredPostRollup[] = [];
  for (const item of items) {
    const derived = newTieredPostRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateTieredPostRollup(item: TieredPostRollup): string {
  return classifyLenientReplyMetric(item.effectiveExposure());
}
