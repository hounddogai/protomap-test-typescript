import { redemptionSummaryBucket } from "../../redemption/summary/redemption-summary-policy.js";
import { RedemptionSummary } from "../../redemption/summary/redemption-summary.js";
import { StreakRule, newStreakRule } from "./streak-rule.js";

export function summarizeRedemptionSummariesForRule(items: RedemptionSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStreakRulesFromSummary(items: RedemptionSummary[]): StreakRule[] {
  const out: StreakRule[] = [];
  for (const item of items) {
    const derived = newStreakRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyStreakRule(item: StreakRule): string {
  return redemptionSummaryBucket(item.weightedVolume());
}
