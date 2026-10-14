import { normalizeTieredStreakSummaryCode } from "../../streak/rollup/tiered-streak-summary-policy.js";
import { TieredStreakSummary } from "../../streak/rollup/tiered-streak-summary.js";
import { RedemptionPlan, newRedemptionPlan } from "./redemption-plan.js";

export function summarizeTieredStreakSummariesForPlan(items: TieredStreakSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRedemptionPlansFromSummary(items: TieredStreakSummary[]): RedemptionPlan[] {
  const out: RedemptionPlan[] = [];
  for (const item of items) {
    const derived = newRedemptionPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRedemptionPlan(item: RedemptionPlan): string {
  return normalizeTieredStreakSummaryCode(item.code);
}
