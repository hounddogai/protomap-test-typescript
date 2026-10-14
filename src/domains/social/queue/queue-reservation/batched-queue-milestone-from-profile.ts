import { CappedPostProfile } from "../../post/profile/capped-post-profile.js";
import { normalizePostMetricCode } from "../../post/profile/post-metric-policy.js";
import { BatchedQueueMilestone, newBatchedQueueMilestone } from "./batched-queue-milestone.js";

export function summarizeCappedPostProfilesForMilestone(items: CappedPostProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedQueueMilestonesFromProfile(items: CappedPostProfile[]): BatchedQueueMilestone[] {
  const out: BatchedQueueMilestone[] = [];
  for (const item of items) {
    const derived = newBatchedQueueMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedQueueMilestone(item: BatchedQueueMilestone): string {
  return normalizePostMetricCode(item.code);
}
