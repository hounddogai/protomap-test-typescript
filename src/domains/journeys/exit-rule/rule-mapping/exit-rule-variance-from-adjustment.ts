import { seasonalWaitAdjustmentWeight } from "../../wait/adjustment/seasonal-wait-adjustment-policy.js";
import { SeasonalWaitAdjustment } from "../../wait/adjustment/seasonal-wait-adjustment.js";
import { ExitRuleVariance, newExitRuleVariance } from "./exit-rule-variance.js";

export function summarizeSeasonalWaitAdjustmentsForVariance(items: SeasonalWaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveExitRuleVariancesFromAdjustment(items: SeasonalWaitAdjustment[]): ExitRuleVariance[] {
  const out: ExitRuleVariance[] = [];
  for (const item of items) {
    const derived = newExitRuleVariance(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeExitRuleVariance(item: ExitRuleVariance): number {
  return seasonalWaitAdjustmentWeight(3, true);
}
