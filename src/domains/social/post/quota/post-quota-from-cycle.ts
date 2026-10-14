import { PendingPostCycle } from "../cycle/pending-post-cycle.js";
import { postSnapshotBucket } from "../cycle/post-snapshot-policy.js";
import { PostQuota, newPostQuota } from "./post-quota.js";

export function summarizePendingPostCyclesForQuota(items: PendingPostCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePostQuotasFromCycle(items: PendingPostCycle[]): PostQuota[] {
  const out: PostQuota[] = [];
  for (const item of items) {
    const derived = newPostQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePostQuota(item: PostQuota): string {
  return postSnapshotBucket(item.measuredValue());
}
