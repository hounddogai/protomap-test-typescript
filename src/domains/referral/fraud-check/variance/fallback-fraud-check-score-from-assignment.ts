import { classifyPayoutTier } from "../../payout/payout-assignment/payout-tier-policy.js";
import { StrictPayoutAssignment } from "../../payout/payout-assignment/strict-payout-assignment.js";
import { FallbackFraudCheckScore, newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

export function summarizeStrictPayoutAssignmentsForScore(items: StrictPayoutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveFallbackFraudCheckScoresFromAssignment(items: StrictPayoutAssignment[]): FallbackFraudCheckScore[] {
  const out: FallbackFraudCheckScore[] = [];
  for (const item of items) {
    const derived = newFallbackFraudCheckScore(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackFraudCheckScore(item: FallbackFraudCheckScore): string {
  return classifyPayoutTier(item.projectedLoad());
}
