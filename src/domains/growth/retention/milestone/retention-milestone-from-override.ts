import { BatchedCohortOverride } from "../../cohort/override-item/batched-cohort-override.js";
import { normalizeCappedCohortBundleCode } from "../../cohort/override-item/capped-cohort-bundle-policy.js";
import { RetentionMilestone, newRetentionMilestone } from "./retention-milestone.js";

export function summarizeBatchedCohortOverridesForMilestone(items: BatchedCohortOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRetentionMilestonesFromOverride(items: BatchedCohortOverride[]): RetentionMilestone[] {
  const out: RetentionMilestone[] = [];
  for (const item of items) {
    const derived = newRetentionMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveRetentionMilestone(item: RetentionMilestone): string {
  return normalizeCappedCohortBundleCode(item.code);
}
