import { PayoutAssignment } from "../override-item/payout-assignment.js";
import { payoutScoreBucket } from "../override-item/payout-score-policy.js";
import { FallbackPayoutQuota, newFallbackPayoutQuota } from "./fallback-payout-quota.js";

export function summarizePayoutAssignmentsForQuota(items: PayoutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFallbackPayoutQuotasFromAssignment(items: PayoutAssignment[]): FallbackPayoutQuota[] {
  const out: FallbackPayoutQuota[] = [];
  for (const item of items) {
    const derived = newFallbackPayoutQuota(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackPayoutQuota(item: FallbackPayoutQuota): string {
  return payoutScoreBucket(item.adjustedLoad());
}
