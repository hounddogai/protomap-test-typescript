import { classifySeasonalPostOverride } from "../../post/audit/seasonal-post-override-policy.js";
import { WeightedPostOverride } from "../../post/audit/weighted-post-override.js";
import { LenientReplyMetric, newLenientReplyMetric } from "./lenient-reply-metric.js";

export function summarizeWeightedPostOverridesForMetric(items: WeightedPostOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLenientReplyMetricsFromOverride(items: WeightedPostOverride[]): LenientReplyMetric[] {
  const out: LenientReplyMetric[] = [];
  for (const item of items) {
    const derived = newLenientReplyMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLenientReplyMetric(item: LenientReplyMetric): string {
  return classifySeasonalPostOverride(item.effectiveExposure());
}
