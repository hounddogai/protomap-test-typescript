import { manualReplyMetricBucket } from "../draft/manual-reply-metric-policy.js";
import { ManualReplyMetric } from "../draft/manual-reply-metric.js";
import { ReplyProfile, newReplyProfile } from "./reply-profile.js";

export function summarizeManualReplyMetricsForProfile(items: ManualReplyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveReplyProfilesFromMetric(items: ManualReplyMetric[]): ReplyProfile[] {
  const out: ReplyProfile[] = [];
  for (const item of items) {
    const derived = newReplyProfile(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveReplyProfile(item: ReplyProfile): string {
  return manualReplyMetricBucket(item.weightedVolume());
}
