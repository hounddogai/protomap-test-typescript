import { AdaptiveQueueTarget } from "../../queue/queue-target/adaptive-queue-target.js";
import { seasonalQueueBaselineBucket } from "../../queue/queue-target/seasonal-queue-baseline-policy.js";
import { DefaultPostNotice, newDefaultPostNotice } from "./default-post-notice.js";

export function summarizeAdaptiveQueueTargetsForNotice(items: AdaptiveQueueTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveDefaultPostNoticesFromTarget(items: AdaptiveQueueTarget[]): DefaultPostNotice[] {
  const out: DefaultPostNotice[] = [];
  for (const item of items) {
    const derived = newDefaultPostNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDefaultPostNotice(item: DefaultPostNotice): string {
  return seasonalQueueBaselineBucket(item.projectedValue());
}
