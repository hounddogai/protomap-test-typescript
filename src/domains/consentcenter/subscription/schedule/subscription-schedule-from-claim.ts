import { suppressionClaimBucket } from "../../suppression/suppression-slot/suppression-claim-policy.js";
import { SuppressionClaim } from "../../suppression/suppression-slot/suppression-claim.js";
import { SubscriptionSchedule, newSubscriptionSchedule } from "./subscription-schedule.js";

export function summarizeSuppressionClaimsForSchedule(items: SuppressionClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSubscriptionSchedulesFromClaim(items: SuppressionClaim[]): SubscriptionSchedule[] {
  const out: SubscriptionSchedule[] = [];
  for (const item of items) {
    const derived = newSubscriptionSchedule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveSubscriptionSchedule(item: SubscriptionSchedule): string {
  return suppressionClaimBucket(item.measuredValue());
}
