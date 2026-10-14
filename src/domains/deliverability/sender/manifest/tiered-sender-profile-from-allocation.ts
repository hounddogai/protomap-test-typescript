import { PendingReputationAllocation } from "../../reputation/audit/pending-reputation-allocation.js";
import { tieredReputationAssignmentBucket } from "../../reputation/audit/tiered-reputation-assignment-policy.js";
import { TieredSenderProfile, newTieredSenderProfile } from "./tiered-sender-profile.js";

export function summarizePendingReputationAllocationsForProfile(items: PendingReputationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredSenderProfilesFromAllocation(items: PendingReputationAllocation[]): TieredSenderProfile[] {
  const out: TieredSenderProfile[] = [];
  for (const item of items) {
    const derived = newTieredSenderProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTieredSenderProfile(item: TieredSenderProfile): string {
  return tieredReputationAssignmentBucket(item.adjustedExposure());
}
