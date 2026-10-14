import { retentionMilestoneBucket } from "../milestone/retention-milestone-policy.js";
import { RetentionMilestone } from "../milestone/retention-milestone.js";
import { ManualRetentionQuota, newManualRetentionQuota } from "./manual-retention-quota.js";

export function summarizeRetentionMilestonesForQuota(items: RetentionMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveManualRetentionQuotasFromMilestone(items: RetentionMilestone[]): ManualRetentionQuota[] {
  const out: ManualRetentionQuota[] = [];
  for (const item of items) {
    const derived = newManualRetentionQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveManualRetentionQuota(item: ManualRetentionQuota): string {
  return retentionMilestoneBucket(item.measuredValue());
}
