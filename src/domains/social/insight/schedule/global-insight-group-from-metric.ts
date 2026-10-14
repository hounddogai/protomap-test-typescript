import { LenientReplyMetric } from "../../reply/reply-metric/lenient-reply-metric.js";
import { replyWindowBucket } from "../../reply/reply-metric/reply-window-policy.js";
import { GlobalInsightGroup, newGlobalInsightGroup } from "./global-insight-group.js";

export function summarizeLenientReplyMetricsForGroup(items: LenientReplyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveGlobalInsightGroupsFromMetric(items: LenientReplyMetric[]): GlobalInsightGroup[] {
  const out: GlobalInsightGroup[] = [];
  for (const item of items) {
    const derived = newGlobalInsightGroup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalInsightGroup(item: GlobalInsightGroup): string {
  return replyWindowBucket(item.projectedExposure());
}
