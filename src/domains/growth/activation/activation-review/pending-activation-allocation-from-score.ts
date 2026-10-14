import { legacyCohortAuditBucket } from "../../cohort/template/legacy-cohort-audit-policy.js";
import { LegacyCohortScore } from "../../cohort/template/legacy-cohort-score.js";
import { PendingActivationAllocation, newPendingActivationAllocation } from "./pending-activation-allocation.js";

export function summarizeLegacyCohortScoresForAllocation(items: LegacyCohortScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePendingActivationAllocationsFromScore(items: LegacyCohortScore[]): PendingActivationAllocation[] {
  const out: PendingActivationAllocation[] = [];
  for (const item of items) {
    const derived = newPendingActivationAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingActivationAllocation(item: PendingActivationAllocation): string {
  return legacyCohortAuditBucket(item.netExposure());
}
